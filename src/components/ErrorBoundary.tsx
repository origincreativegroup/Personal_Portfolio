import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import logger from '../utils/logger';
import { useApp } from '../contexts/AppContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  component?: string; // Component name for better error tracking
  enableAutomaticReporting?: boolean;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  userActions?: string[];
  retryCount: number;
}

interface ComponentStackInfo {
  componentName: string;
  props: Record<string, any>;
  state?: Record<string, any>;
}

class ErrorBoundary extends Component<Props, State> {
  private errorReportingEnabled: boolean;
  private userActionHistory: string[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };

    this.errorReportingEnabled = props.enableAutomaticReporting ?? true;

    // Set up global error listeners for additional context
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers();
    }
  }

  private setupGlobalErrorHandlers() {
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.state.hasError) {
        logger.error('Unhandled promise rejection during error state', 'error', {
          reason: event.reason,
          promise: String(event.promise),
          errorId: this.state.errorId,
          component: this.props.component
        });
      }
    });

    // Track user actions for error context
    window.addEventListener('click', (event) => {
      if (event.target) {
        const target = event.target as Element;
        const actionDescription = `Click on ${target.tagName}${target.id ? `#${target.id}` : ''}${target.className ? `.${target.className.split(' ').join('.')}` : ''}`;
        this.userActionHistory.push(actionDescription);

        // Keep only last 10 actions
        if (this.userActionHistory.length > 10) {
          this.userActionHistory.shift();
        }
      }
    });
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractComponentStack(errorInfo: ErrorInfo): ComponentStackInfo[] {
    const stack = errorInfo.componentStack;
    const components: ComponentStackInfo[] = [];

    // Parse component stack to extract component names
    const lines = stack.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      const match = line.match(/^\s*in\s+(\w+)/);
      if (match) {
        components.push({
          componentName: match[1],
          props: {}, // Would need additional instrumentation to capture props
          state: {} // Would need additional instrumentation to capture state
        });
      }
    }

    return components;
  }

  private collectErrorMetadata(error: Error, errorInfo: ErrorInfo) {
    const componentStack = this.extractComponentStack(errorInfo);
    const url = typeof window !== 'undefined' ? window.location.href : 'unknown';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

    return {
      errorId: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack,
      componentName: this.props.component || 'Unknown',
      userActions: [...this.userActionHistory],
      environment: {
        url,
        userAgent,
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : null,
        timestamp: Date.now()
      },
      retryCount: this.state.retryCount,
      sessionInfo: logger.getSessionInfo()
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMetadata = this.collectErrorMetadata(error, errorInfo);
    const errorId = errorMetadata.errorId;

    // Update state with error details
    this.setState({
      errorInfo,
      errorId,
      userActions: [...this.userActionHistory]
    });

    // Log error with comprehensive metadata
    if (this.errorReportingEnabled) {
      logger.critical('React Error Boundary caught error', 'error', {
        ...errorMetadata,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.props.component || 'ErrorBoundary'
      }, {
        component: this.props.component,
        stackTrace: error.stack,
        correlationId: errorId
      });
    }

    // Legacy console logging for development
    console.error('Error caught by boundary:', error, errorInfo);
    console.error('Error metadata:', errorMetadata);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Additional error reporting could be added here
    // e.g., send to external error tracking service
    if (typeof window !== 'undefined' && this.errorReportingEnabled) {
      // Could integrate with Sentry, LogRocket, etc.
      this.reportErrorToExternalService(error, errorMetadata);
    }
  }

  private async reportErrorToExternalService(error: Error, metadata: any) {
    try {
      // Send to backend error reporting endpoint
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          metadata
        })
      });

      logger.info('Error report sent to server successfully', 'error', {
        errorId: metadata.errorId,
        component: this.props.component
      });
    } catch (reportingError) {
      logger.error('Failed to report error to external service', 'error', {
        originalError: error.message,
        reportingError: reportingError instanceof Error ? reportingError.message : String(reportingError),
        errorId: metadata.errorId
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      userActions: undefined,
      retryCount: prevState.retryCount + 1
    }));

    // Log retry attempt
    if (this.errorReportingEnabled) {
      logger.info('Error boundary retry attempted', 'ui', {
        previousErrorId: this.state.errorId,
        retryCount: this.state.retryCount + 1,
        component: this.props.component
      });
    }
  };

  private copyErrorToClipboard = async () => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorReport = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      component: this.props.component || 'Unknown',
      error: {
        name: this.state.error.name,
        message: this.state.error.message,
        stack: this.state.error.stack
      },
      componentStack: this.state.errorInfo.componentStack,
      userActions: this.state.userActions,
      retryCount: this.state.retryCount,
      sessionInfo: logger.getSessionInfo()
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      // Could show a toast notification here
      logger.info('Error report copied to clipboard', 'ui', { errorId: this.state.errorId });
    } catch (err) {
      console.error('Failed to copy error report:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const showDetails = this.props.showErrorDetails && process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <Card.Body>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                  <svg
                    className="h-6 w-6 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Something went wrong
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>

                {this.state.errorId && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    Error ID: {this.state.errorId}
                  </p>
                )}

                {this.state.retryCount > 0 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4">
                    This error has occurred {this.state.retryCount} time{this.state.retryCount > 1 ? 's' : ''}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
                  <Button onClick={this.handleRetry}>
                    Try again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Reload page
                  </Button>
                  {showDetails && (
                    <Button
                      variant="outline"
                      onClick={this.copyErrorToClipboard}
                    >
                      Copy error report
                    </Button>
                  )}
                </div>

                {showDetails && this.state.error && (
                  <details className="text-left mt-6">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs">
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Error:</h4>
                        <pre className="whitespace-pre-wrap break-words">
                          {this.state.error.name}: {this.state.error.message}
                        </pre>
                      </div>

                      {this.state.error.stack && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Stack Trace:</h4>
                          <pre className="whitespace-pre-wrap break-words text-xs">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}

                      {this.state.errorInfo?.componentStack && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Component Stack:</h4>
                          <pre className="whitespace-pre-wrap break-words text-xs">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}

                      {this.state.userActions && this.state.userActions.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Recent User Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {this.state.userActions.map((action, index) => (
                              <li key={index} className="text-xs">{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;