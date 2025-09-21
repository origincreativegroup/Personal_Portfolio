/**
 * Global Error Handler - Comprehensive Error Tracking
 *
 * Sets up global error listeners and provides centralized error handling
 * for unhandled errors, promise rejections, and resource loading failures.
 */

import logger from './logger';

interface GlobalErrorConfig {
  enableConsoleErrorCapture: boolean;
  enableUnhandledRejectionCapture: boolean;
  enableResourceErrorCapture: boolean;
  enableNetworkErrorCapture: boolean;
  maxConsoleErrors: number;
}

class GlobalErrorHandler {
  private config: GlobalErrorConfig;
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private isInitialized = false;

  constructor(config: Partial<GlobalErrorConfig> = {}) {
    this.config = {
      enableConsoleErrorCapture: true,
      enableUnhandledRejectionCapture: true,
      enableResourceErrorCapture: true,
      enableNetworkErrorCapture: true,
      maxConsoleErrors: 50,
      ...config
    };

    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
  }

  public initialize() {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    this.setupGlobalErrorListener();
    this.setupUnhandledRejectionListener();
    this.setupResourceErrorListener();
    this.setupConsoleErrorCapture();
    this.setupNetworkErrorCapture();

    this.isInitialized = true;
    logger.info('Global error handler initialized', 'system');
  }

  public destroy() {
    if (!this.isInitialized) {
      return;
    }

    // Restore original console methods
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;

    // Remove event listeners
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

    this.isInitialized = false;
    logger.info('Global error handler destroyed', 'system');
  }

  private setupGlobalErrorListener() {
    window.addEventListener('error', this.handleGlobalError, true);
  }

  private setupUnhandledRejectionListener() {
    if (this.config.enableUnhandledRejectionCapture) {
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }

  private setupResourceErrorListener() {
    if (this.config.enableResourceErrorCapture) {
      window.addEventListener('error', this.handleResourceError, true);
    }
  }

  private setupConsoleErrorCapture() {
    if (!this.config.enableConsoleErrorCapture) {
      return;
    }

    let consoleErrorCount = 0;

    console.error = (...args: any[]) => {
      // Call original console.error
      this.originalConsoleError.apply(console, args);

      // Limit console error capturing to prevent spam
      if (consoleErrorCount < this.config.maxConsoleErrors) {
        consoleErrorCount++;

        const message = args.map(arg =>
          typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
        ).join(' ');

        logger.error('Console error captured', 'error', {
          arguments: args,
          message,
          consoleErrorCount,
          stackTrace: new Error().stack
        });
      }
    };

    console.warn = (...args: any[]) => {
      // Call original console.warn
      this.originalConsoleWarn.apply(console, args);

      const message = args.map(arg =>
        typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
      ).join(' ');

      logger.warn('Console warning captured', 'error', {
        arguments: args,
        message
      });
    };
  }

  private setupNetworkErrorCapture() {
    if (!this.config.enableNetworkErrorCapture) {
      return;
    }

    // Intercept fetch for network error tracking
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = (args[1]?.method || 'GET').toUpperCase();

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        // Log API calls through the logger's trackApiCall method
        logger.trackApiCall(method, url, response.status, duration, {
          ok: response.ok,
          redirected: response.redirected,
          type: response.type
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        logger.trackApiCall(method, url, 0, duration, {
          error: error instanceof Error ? error.message : String(error),
          networkError: true
        });

        logger.error('Network request failed', 'api', {
          url,
          method,
          duration,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : String(error)
        });

        throw error;
      }
    };
  }

  private handleGlobalError = (event: ErrorEvent) => {
    const { message, filename, lineno, colno, error } = event;

    // Skip resource loading errors (handled separately)
    if (!filename || filename.includes('.js') || filename.includes('.css') || filename.includes('.png')) {
      return;
    }

    logger.critical('Global JavaScript error', 'error', {
      message,
      filename,
      lineno,
      colno,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;

    logger.critical('Unhandled Promise rejection', 'error', {
      reason: reason instanceof Error ? {
        name: reason.name,
        message: reason.message,
        stack: reason.stack
      } : reason,
      url: window.location.href,
      timestamp: Date.now()
    });

    // Prevent default browser handling in development
    if (process.env.NODE_ENV === 'development') {
      event.preventDefault();
    }
  };

  private handleResourceError = (event: Event) => {
    const target = event.target as HTMLElement;

    // Only handle resource loading errors
    if (!target || target === window) {
      return;
    }

    const tagName = target.tagName?.toLowerCase();
    const resourceUrl = (target as any).src || (target as any).href;

    if (!resourceUrl || !tagName) {
      return;
    }

    // Track resource loading failures
    logger.error('Resource loading failed', 'system', {
      tagName,
      resourceUrl,
      baseURI: target.baseURI,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
  };

  // Method to manually report errors with context
  public reportError(
    error: Error,
    context: string = 'manual',
    additionalData?: Record<string, any>
  ) {
    logger.trackError(error, 'error', context, {
      ...additionalData,
      reportedManually: true,
      timestamp: Date.now()
    });
  }

  // Method to track custom events
  public trackEvent(
    eventName: string,
    data?: Record<string, any>,
    level: 'debug' | 'info' | 'warn' = 'info'
  ) {
    logger.log(level, `Custom event: ${eventName}`, 'user-action', data);
  }

  // Method to set user context for error reporting
  public setUserContext(userId: string, userInfo?: Record<string, any>) {
    logger.info('User context set', 'system', {
      userId,
      userInfo,
      timestamp: Date.now()
    });
  }

  // Method to add breadcrumb manually
  public addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, any>
  ) {
    logger.info(`Breadcrumb: ${message}`, 'user-action', {
      category,
      breadcrumb: true,
      ...data
    });
  }

  // Get error statistics
  public async getErrorStats() {
    try {
      const recentLogs = await logger.getRecentLogs(1000);
      const errors = recentLogs.filter(log =>
        log.metadata.level === 'error' || log.metadata.level === 'critical'
      );

      const stats = {
        totalErrors: errors.length,
        criticalErrors: errors.filter(log => log.metadata.level === 'critical').length,
        errorsByContext: errors.reduce((acc: Record<string, number>, log) => {
          acc[log.metadata.context] = (acc[log.metadata.context] || 0) + 1;
          return acc;
        }, {}),
        errorsByComponent: errors.reduce((acc: Record<string, number>, log) => {
          const component = log.metadata.component || 'unknown';
          acc[component] = (acc[component] || 0) + 1;
          return acc;
        }, {}),
        recentErrors: errors.slice(0, 10).map(log => ({
          timestamp: log.metadata.timestamp,
          message: log.message,
          component: log.metadata.component,
          context: log.metadata.context
        }))
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get error statistics', 'system', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}

// Singleton instance
const globalErrorHandler = new GlobalErrorHandler();

export default globalErrorHandler;
export { GlobalErrorHandler };