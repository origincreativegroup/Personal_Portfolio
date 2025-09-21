/**
 * Smart Logger Service - AI-Accessible Logging Infrastructure
 *
 * Provides structured, context-aware logging with multiple levels,
 * performance timing, and AI-friendly data formats for efficient
 * troubleshooting and development assistance.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogContext = 'ui' | 'api' | 'storage' | 'performance' | 'user-action' | 'error' | 'system';

export interface LogMetadata {
  userId?: string;
  sessionId: string;
  timestamp: number;
  level: LogLevel;
  context: LogContext;
  component?: string;
  function?: string;
  correlationId?: string;
  environment: 'development' | 'production';
  userAgent?: string;
  url?: string;
  stackTrace?: string;
  performance?: {
    memory?: number;
    timing?: number;
    renderTime?: number;
  };
  breadcrumbs?: LogBreadcrumb[];
}

export interface LogBreadcrumb {
  timestamp: number;
  category: string;
  message: string;
  data?: Record<string, any>;
}

export interface LogEntry {
  id: string;
  message: string;
  data?: Record<string, any>;
  metadata: LogMetadata;
}

export interface LoggerConfig {
  enabledLevels: LogLevel[];
  maxBreadcrumbs: number;
  enablePerformanceTracking: boolean;
  enableStackTrace: boolean;
  enableRemoteLogging: boolean;
  apiEndpoint?: string;
  bufferSize: number;
  flushInterval: number;
}

class SmartLogger {
  private config: LoggerConfig;
  private sessionId: string;
  private breadcrumbs: LogBreadcrumb[] = [];
  private logBuffer: LogEntry[] = [];
  private correlationCounter = 0;
  private performanceMarks = new Map<string, number>();
  private flushTimer: number | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabledLevels: ['debug', 'info', 'warn', 'error', 'critical'],
      maxBreadcrumbs: 100,
      enablePerformanceTracking: true,
      enableStackTrace: true,
      enableRemoteLogging: false,
      bufferSize: 50,
      flushInterval: 5000,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.setupFlushTimer();
    this.setupUnloadHandler();
  }

  private generateSessionId(): string {
    if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
      return globalThis.crypto.randomUUID();
    }
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${this.sessionId}_${++this.correlationCounter}`;
  }

  private getEnvironment(): 'development' | 'production' {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.getEnvironment() === 'production' && level === 'debug') {
      return false;
    }
    return this.config.enabledLevels.includes(level);
  }

  private getStackTrace(): string | undefined {
    if (!this.config.enableStackTrace) return undefined;

    try {
      throw new Error();
    } catch (e) {
      const stack = (e as Error).stack;
      return stack?.split('\n').slice(3).join('\n'); // Remove logger internals
    }
  }

  private getCurrentPerformanceMetrics() {
    if (!this.config.enablePerformanceTracking) return undefined;

    const metrics: any = {};

    // Memory usage (if available)
    if ('memory' in performance) {
      metrics.memory = (performance as any).memory.usedJSHeapSize;
    }

    return metrics;
  }

  private addBreadcrumb(category: string, message: string, data?: Record<string, any>) {
    const breadcrumb: LogBreadcrumb = {
      timestamp: Date.now(),
      category,
      message,
      data
    };

    this.breadcrumbs.push(breadcrumb);

    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext,
    data?: Record<string, any>,
    metadata: Partial<LogMetadata> = {}
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateCorrelationId(),
      message,
      data,
      metadata: {
        userId: metadata.userId,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        level,
        context,
        component: metadata.component,
        function: metadata.function,
        correlationId: metadata.correlationId || this.generateCorrelationId(),
        environment: this.getEnvironment(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        stackTrace: level === 'error' || level === 'critical' ? this.getStackTrace() : undefined,
        performance: this.getCurrentPerformanceMetrics(),
        breadcrumbs: [...this.breadcrumbs],
        ...metadata
      }
    };

    return entry;
  }

  private async persistLog(entry: LogEntry) {
    // Store in IndexedDB for local debugging
    try {
      const request = indexedDB.open('PortfolioLogDB', 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('logs')) {
          const store = db.createObjectStore('logs', { keyPath: 'id' });
          store.createIndex('timestamp', 'metadata.timestamp');
          store.createIndex('level', 'metadata.level');
          store.createIndex('context', 'metadata.context');
          store.createIndex('component', 'metadata.component');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['logs'], 'readwrite');
        const store = transaction.objectStore('logs');
        store.add(entry);
      };
    } catch (error) {
      console.warn('Failed to persist log to IndexedDB:', error);
    }
  }

  private setupFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupUnloadHandler() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  public async flush() {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // Persist logs locally
    for (const entry of logsToFlush) {
      await this.persistLog(entry);
    }

    // Send to remote endpoint if configured
    if (this.config.enableRemoteLogging && this.config.apiEndpoint) {
      try {
        await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logs: logsToFlush })
        });
      } catch (error) {
        console.warn('Failed to send logs to remote endpoint:', error);
      }
    }
  }

  public log(
    level: LogLevel,
    message: string,
    context: LogContext,
    data?: Record<string, any>,
    metadata: Partial<LogMetadata> = {}
  ) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, data, metadata);

    // Add to buffer
    this.logBuffer.push(entry);

    // Console output for development
    if (this.getEnvironment() === 'development') {
      const consoleMethod = level === 'debug' ? 'log' : level === 'info' ? 'info' : level === 'warn' ? 'warn' : 'error';
      console[consoleMethod](`[${level.toUpperCase()}] ${context}:${metadata.component || 'unknown'}`, message, data);
    }

    // Add breadcrumb for user actions
    if (context === 'user-action') {
      this.addBreadcrumb('user', message, data);
    }

    // Auto-flush on critical errors
    if (level === 'critical') {
      this.flush();
    }

    // Flush buffer if it reaches max size
    if (this.logBuffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  // Convenience methods
  public debug(message: string, context: LogContext = 'system', data?: Record<string, any>, metadata?: Partial<LogMetadata>) {
    this.log('debug', message, context, data, metadata);
  }

  public info(message: string, context: LogContext = 'system', data?: Record<string, any>, metadata?: Partial<LogMetadata>) {
    this.log('info', message, context, data, metadata);
  }

  public warn(message: string, context: LogContext = 'system', data?: Record<string, any>, metadata?: Partial<LogMetadata>) {
    this.log('warn', message, context, data, metadata);
  }

  public error(message: string, context: LogContext = 'error', data?: Record<string, any>, metadata?: Partial<LogMetadata>) {
    this.log('error', message, context, data, metadata);
  }

  public critical(message: string, context: LogContext = 'error', data?: Record<string, any>, metadata?: Partial<LogMetadata>) {
    this.log('critical', message, context, data, metadata);
  }

  // Performance tracking
  public startPerformanceTimer(markName: string) {
    if (!this.config.enablePerformanceTracking) return;
    this.performanceMarks.set(markName, performance.now());
  }

  public endPerformanceTimer(markName: string, context: LogContext = 'performance', component?: string) {
    if (!this.config.enablePerformanceTracking) return;

    const startTime = this.performanceMarks.get(markName);
    if (startTime === undefined) return;

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(markName);

    this.info(`Performance: ${markName} completed`, context, { duration }, {
      component,
      performance: { timing: duration }
    });
  }

  // User action tracking
  public trackUserAction(action: string, target?: string, data?: Record<string, any>, component?: string) {
    this.info(`User action: ${action}`, 'user-action', {
      action,
      target,
      ...data
    }, { component });
  }

  // API call tracking
  public trackApiCall(method: string, url: string, status?: number, duration?: number, data?: Record<string, any>) {
    const level: LogLevel = status && status >= 400 ? 'error' : 'info';
    this.log(level, `API ${method} ${url}`, 'api', {
      method,
      url,
      status,
      duration,
      ...data
    }, {
      performance: duration ? { timing: duration } : undefined
    });
  }

  // Component lifecycle tracking
  public trackComponentLifecycle(component: string, lifecycle: 'mount' | 'unmount' | 'update', data?: Record<string, any>) {
    this.debug(`Component ${lifecycle}: ${component}`, 'ui', data, { component });
  }

  // Storage operations tracking
  public trackStorageOperation(operation: string, key?: string, success?: boolean, error?: Error) {
    const level: LogLevel = success === false ? 'error' : 'debug';
    this.log(level, `Storage operation: ${operation}`, 'storage', {
      operation,
      key,
      success,
      error: error?.message
    });
  }

  // Error tracking with context
  public trackError(error: Error, context: LogContext = 'error', component?: string, additionalData?: Record<string, any>) {
    this.error(error.message, context, {
      name: error.name,
      stack: error.stack,
      ...additionalData
    }, {
      component,
      stackTrace: error.stack
    });
  }

  // Get recent logs for debugging
  public async getRecentLogs(limit: number = 100): Promise<LogEntry[]> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('PortfolioLogDB', 1);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['logs'], 'readonly');
          const store = transaction.objectStore('logs');
          const index = store.index('timestamp');
          const getAllRequest = index.getAll();

          getAllRequest.onsuccess = () => {
            const logs = getAllRequest.result
              .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
              .slice(0, limit);
            resolve(logs);
          };

          getAllRequest.onerror = () => reject(getAllRequest.error);
        };

        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Clear logs (for privacy/storage management)
  public async clearLogs(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('PortfolioLogDB', 1);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['logs'], 'readwrite');
          const store = transaction.objectStore('logs');
          const clearRequest = store.clear();

          clearRequest.onsuccess = () => resolve();
          clearRequest.onerror = () => reject(clearRequest.error);
        };

        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Update configuration
  public updateConfig(newConfig: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.setupFlushTimer();
  }

  // Get session information
  public getSessionInfo() {
    return {
      sessionId: this.sessionId,
      environment: this.getEnvironment(),
      breadcrumbsCount: this.breadcrumbs.length,
      bufferSize: this.logBuffer.length,
      config: this.config
    };
  }
}

// Singleton instance
const logger = new SmartLogger({
  enableRemoteLogging: true,
  apiEndpoint: '/api/logs/batch',
  enabledLevels: process.env.NODE_ENV === 'production'
    ? ['info', 'warn', 'error', 'critical']
    : ['debug', 'info', 'warn', 'error', 'critical'],
  bufferSize: 25, // Smaller buffer for more frequent uploads
  flushInterval: 10000 // Flush every 10 seconds
});

export default logger;
export { SmartLogger };