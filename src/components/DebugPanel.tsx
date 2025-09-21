/**
 * Developer Debug Panel - Real-time Log Viewer and System Monitor
 *
 * Provides a comprehensive debugging interface for developers and AI
 * to inspect logs, monitor performance, and analyze system behavior.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bug, Download, Trash2, Search, Filter, RefreshCw,
  ChevronDown, ChevronRight, X, Settings, BarChart3,
  AlertTriangle, Info, AlertCircle, Zap, Eye, Copy
} from 'lucide-react';
import logger, { LogEntry, LogLevel, LogContext } from '../utils/logger';
import globalErrorHandler from '../utils/globalErrorHandler';
import Button from './ui/Button';
import Card from './ui/Card';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogFilter {
  levels: LogLevel[];
  contexts: LogContext[];
  components: string[];
  searchQuery: string;
  timeRange: 'last-hour' | 'last-day' | 'all';
}

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: 'text-gray-600 bg-gray-100',
  info: 'text-blue-600 bg-blue-100',
  warn: 'text-yellow-600 bg-yellow-100',
  error: 'text-red-600 bg-red-100',
  critical: 'text-red-800 bg-red-200'
};

const LOG_LEVEL_ICONS: Record<LogLevel, React.ComponentType<any>> = {
  debug: Bug,
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  critical: Zap
};

const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [errorStats, setErrorStats] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const [filter, setFilter] = useState<LogFilter>({
    levels: ['debug', 'info', 'warn', 'error', 'critical'],
    contexts: ['ui', 'api', 'storage', 'performance', 'user-action', 'error', 'system'],
    components: [],
    searchQuery: '',
    timeRange: 'last-hour'
  });

  // Load logs from storage
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const recentLogs = await logger.getRecentLogs(1000);
      setLogs(recentLogs);

      const stats = await globalErrorHandler.getErrorStats();
      setErrorStats(stats);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter logs based on current filter settings
  const applyFilters = useCallback(() => {
    let filtered = logs;

    // Level filter
    filtered = filtered.filter(log => filter.levels.includes(log.metadata.level));

    // Context filter
    filtered = filtered.filter(log => filter.contexts.includes(log.metadata.context));

    // Component filter
    if (filter.components.length > 0) {
      filtered = filtered.filter(log =>
        filter.components.includes(log.metadata.component || 'unknown')
      );
    }

    // Search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        (log.metadata.component?.toLowerCase().includes(query)) ||
        JSON.stringify(log.data).toLowerCase().includes(query)
      );
    }

    // Time range filter
    const now = Date.now();
    const timeThresholds = {
      'last-hour': now - (60 * 60 * 1000),
      'last-day': now - (24 * 60 * 60 * 1000),
      'all': 0
    };

    filtered = filtered.filter(log =>
      log.metadata.timestamp >= timeThresholds[filter.timeRange]
    );

    setFilteredLogs(filtered);
  }, [logs, filter]);

  // Auto-refresh logs
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadLogs, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadLogs]);

  // Initial load and filter application
  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, loadLogs]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Get unique components for filter dropdown
  const availableComponents = useMemo(() => {
    const components = new Set<string>();
    logs.forEach(log => {
      if (log.metadata.component) {
        components.add(log.metadata.component);
      }
    });
    return Array.from(components).sort();
  }, [logs]);

  // Toggle log expansion
  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  // Copy log to clipboard
  const copyLogToClipboard = async (log: LogEntry) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      // Could show toast notification
    } catch (error) {
      console.error('Failed to copy log:', error);
    }
  };

  // Export logs
  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear all logs
  const clearLogs = async () => {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      try {
        await logger.clearLogs();
        setLogs([]);
        setFilteredLogs([]);
      } catch (error) {
        console.error('Failed to clear logs:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-5/6 flex flex-col">
        <Card.Body className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Bug className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold">Debug Panel</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time logging and system monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-100 text-green-700' : ''}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-refresh
              </Button>
              <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          {errorStats && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <div className="text-lg font-semibold text-red-600">{errorStats.totalErrors}</div>
                <div className="text-xs text-red-500">Total Errors</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <div className="text-lg font-semibold text-yellow-600">{errorStats.criticalErrors}</div>
                <div className="text-xs text-yellow-500">Critical</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">{filteredLogs.length}</div>
                <div className="text-xs text-blue-500">Filtered Logs</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{logs.length}</div>
                <div className="text-xs text-green-500">Total Logs</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-medium mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                    value={filter.searchQuery}
                    onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
                  />
                </div>
              </div>

              {/* Time Range */}
              <div>
                <label className="block text-xs font-medium mb-1">Time Range</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                  value={filter.timeRange}
                  onChange={(e) => setFilter(prev => ({ ...prev, timeRange: e.target.value as any }))}
                >
                  <option value="last-hour">Last Hour</option>
                  <option value="last-day">Last Day</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Log Levels */}
              <div>
                <label className="block text-xs font-medium mb-1">Levels</label>
                <div className="flex flex-wrap gap-1">
                  {(['debug', 'info', 'warn', 'error', 'critical'] as LogLevel[]).map(level => (
                    <button
                      key={level}
                      className={`px-2 py-1 text-xs rounded ${
                        filter.levels.includes(level)
                          ? LOG_LEVEL_COLORS[level]
                          : 'bg-gray-100 text-gray-500'
                      }`}
                      onClick={() => {
                        const newLevels = filter.levels.includes(level)
                          ? filter.levels.filter(l => l !== level)
                          : [...filter.levels, level];
                        setFilter(prev => ({ ...prev, levels: newLevels }));
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Components */}
              <div>
                <label className="block text-xs font-medium mb-1">Components</label>
                <select
                  multiple
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                  value={filter.components}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFilter(prev => ({ ...prev, components: selected }));
                  }}
                >
                  <option value="">All Components</option>
                  {availableComponents.map(component => (
                    <option key={component} value={component}>{component}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Log List */}
          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No logs match the current filters
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map(log => {
                    const Icon = LOG_LEVEL_ICONS[log.metadata.level];
                    const isExpanded = expandedLogs.has(log.id);

                    return (
                      <div
                        key={log.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`w-4 h-4 mt-0.5 ${LOG_LEVEL_COLORS[log.metadata.level].split(' ')[0]}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs rounded ${LOG_LEVEL_COLORS[log.metadata.level]}`}>
                                {log.metadata.level}
                              </span>
                              <span className="text-xs text-gray-500">
                                {log.metadata.context}
                              </span>
                              {log.metadata.component && (
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                  {log.metadata.component}
                                </span>
                              )}
                              <span className="text-xs text-gray-400 ml-auto">
                                {new Date(log.metadata.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-sm font-medium mb-1">{log.message}</div>
                            {(log.data || log.metadata.stackTrace) && (
                              <button
                                onClick={() => toggleLogExpansion(log.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                {isExpanded ? 'Hide' : 'Show'} Details
                              </button>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => copyLogToClipboard(log)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            {log.data && (
                              <div className="mb-3">
                                <h4 className="text-xs font-medium mb-1">Data:</h4>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.data, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.metadata.stackTrace && (
                              <div>
                                <h4 className="text-xs font-medium mb-1">Stack Trace:</h4>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                                  {log.metadata.stackTrace}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DebugPanel;