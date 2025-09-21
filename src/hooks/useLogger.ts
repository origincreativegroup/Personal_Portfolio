/**
 * React Hook for Smart Logger Integration
 *
 * Provides React-specific logging utilities with component context,
 * lifecycle tracking, and performance monitoring.
 */

import { useCallback, useEffect, useRef } from 'react';
import logger, { LogContext, LogLevel, LogMetadata } from '../utils/logger';

interface UseLoggerOptions {
  component?: string;
  enableLifecycleTracking?: boolean;
  enablePerformanceTracking?: boolean;
  autoTrackUserActions?: boolean;
}

interface LoggerHookReturn {
  log: (level: LogLevel, message: string, context?: LogContext, data?: Record<string, any>) => void;
  debug: (message: string, context?: LogContext, data?: Record<string, any>) => void;
  info: (message: string, context?: LogContext, data?: Record<string, any>) => void;
  warn: (message: string, context?: LogContext, data?: Record<string, any>) => void;
  error: (message: string, context?: LogContext, data?: Record<string, any>) => void;
  critical: (message: string, context?: LogContext, data?: Record<string, any>) => void;
  trackUserAction: (action: string, target?: string, data?: Record<string, any>) => void;
  trackApiCall: (method: string, url: string, status?: number, duration?: number, data?: Record<string, any>) => void;
  trackError: (error: Error, context?: LogContext, additionalData?: Record<string, any>) => void;
  startTimer: (markName: string) => void;
  endTimer: (markName: string, context?: LogContext) => void;
  trackStorageOperation: (operation: string, key?: string, success?: boolean, error?: Error) => void;
}

export function useLogger(options: UseLoggerOptions = {}): LoggerHookReturn {
  const {
    component,
    enableLifecycleTracking = true,
    enablePerformanceTracking = true,
    autoTrackUserActions = true
  } = options;

  const mountTimeRef = useRef<number>();
  const renderCountRef = useRef(0);

  // Create component-specific metadata
  const createMetadata = useCallback((additional: Partial<LogMetadata> = {}): Partial<LogMetadata> => ({
    component,
    ...additional
  }), [component]);

  // Track component lifecycle
  useEffect(() => {
    if (enableLifecycleTracking && component) {
      mountTimeRef.current = performance.now();
      logger.trackComponentLifecycle(component, 'mount');

      return () => {
        logger.trackComponentLifecycle(component, 'unmount', {
          lifetimeMs: mountTimeRef.current ? performance.now() - mountTimeRef.current : undefined,
          renderCount: renderCountRef.current
        });
      };
    }
  }, [component, enableLifecycleTracking]);

  // Track renders in development
  useEffect(() => {
    if (enableLifecycleTracking && component) {
      renderCountRef.current++;
      if (process.env.NODE_ENV === 'development' && renderCountRef.current > 1) {
        logger.debug(`Component re-render #${renderCountRef.current}`, 'ui', {}, createMetadata());
      }
    }
  });

  // Main logging function with component context
  const log = useCallback((
    level: LogLevel,
    message: string,
    context: LogContext = 'ui',
    data?: Record<string, any>
  ) => {
    logger.log(level, message, context, data, createMetadata());
  }, [createMetadata]);

  // Convenience methods
  const debug = useCallback((message: string, context: LogContext = 'ui', data?: Record<string, any>) => {
    log('debug', message, context, data);
  }, [log]);

  const info = useCallback((message: string, context: LogContext = 'ui', data?: Record<string, any>) => {
    log('info', message, context, data);
  }, [log]);

  const warn = useCallback((message: string, context: LogContext = 'ui', data?: Record<string, any>) => {
    log('warn', message, context, data);
  }, [log]);

  const error = useCallback((message: string, context: LogContext = 'error', data?: Record<string, any>) => {
    log('error', message, context, data);
  }, [log]);

  const critical = useCallback((message: string, context: LogContext = 'error', data?: Record<string, any>) => {
    log('critical', message, context, data);
  }, [log]);

  // User action tracking
  const trackUserAction = useCallback((action: string, target?: string, data?: Record<string, any>) => {
    logger.trackUserAction(action, target, data, component);
  }, [component]);

  // API call tracking
  const trackApiCall = useCallback((
    method: string,
    url: string,
    status?: number,
    duration?: number,
    data?: Record<string, any>
  ) => {
    logger.trackApiCall(method, url, status, duration, { component, ...data });
  }, [component]);

  // Error tracking with component context
  const trackError = useCallback((
    error: Error,
    context: LogContext = 'error',
    additionalData?: Record<string, any>
  ) => {
    logger.trackError(error, context, component, additionalData);
  }, [component]);

  // Performance timing
  const startTimer = useCallback((markName: string) => {
    if (enablePerformanceTracking) {
      logger.startPerformanceTimer(`${component || 'unknown'}_${markName}`);
    }
  }, [component, enablePerformanceTracking]);

  const endTimer = useCallback((markName: string, context: LogContext = 'performance') => {
    if (enablePerformanceTracking) {
      logger.endPerformanceTimer(`${component || 'unknown'}_${markName}`, context, component);
    }
  }, [component, enablePerformanceTracking]);

  // Storage operation tracking
  const trackStorageOperation = useCallback((
    operation: string,
    key?: string,
    success?: boolean,
    error?: Error
  ) => {
    logger.trackStorageOperation(operation, key, success, error);
  }, []);

  return {
    log,
    debug,
    info,
    warn,
    error,
    critical,
    trackUserAction,
    trackApiCall,
    trackError,
    startTimer,
    endTimer,
    trackStorageOperation
  };
}

/**
 * Hook for tracking user interactions with automatic event detection
 */
export function useUserActionTracker(component?: string) {
  const { trackUserAction } = useLogger({ component, autoTrackUserActions: true });

  const trackClick = useCallback((target: string, data?: Record<string, any>) => {
    trackUserAction('click', target, data);
  }, [trackUserAction]);

  const trackSubmit = useCallback((formName: string, data?: Record<string, any>) => {
    trackUserAction('submit', formName, data);
  }, [trackUserAction]);

  const trackNavigation = useCallback((from: string, to: string, data?: Record<string, any>) => {
    trackUserAction('navigation', `${from} -> ${to}`, data);
  }, [trackUserAction]);

  const trackFileUpload = useCallback((fileName: string, fileSize?: number, fileType?: string) => {
    trackUserAction('file_upload', fileName, { fileSize, fileType });
  }, [trackUserAction]);

  const trackSearch = useCallback((query: string, resultCount?: number) => {
    trackUserAction('search', query, { resultCount });
  }, [trackUserAction]);

  const trackError = useCallback((error: Error, action?: string) => {
    trackUserAction('error', action || 'unknown', {
      errorMessage: error.message,
      errorName: error.name
    });
  }, [trackUserAction]);

  return {
    trackClick,
    trackSubmit,
    trackNavigation,
    trackFileUpload,
    trackSearch,
    trackError
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceTracker(component?: string) {
  const { startTimer, endTimer, info } = useLogger({ component, enablePerformanceTracking: true });

  const trackRenderTime = useCallback((renderName?: string) => {
    const markName = renderName || 'render';
    startTimer(markName);

    return () => {
      endTimer(markName, 'performance');
    };
  }, [startTimer, endTimer]);

  const trackAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    startTimer(operationName);

    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      endTimer(operationName);
      info(`Async operation completed: ${operationName}`, 'performance', { duration, success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      endTimer(operationName);
      info(`Async operation failed: ${operationName}`, 'performance', {
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, [startTimer, endTimer, info]);

  const trackMemoryUsage = useCallback((label?: string) => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      info(`Memory usage${label ? ` - ${label}` : ''}`, 'performance', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      });
    }
  }, [info]);

  return {
    trackRenderTime,
    trackAsyncOperation,
    trackMemoryUsage
  };
}

export default useLogger;