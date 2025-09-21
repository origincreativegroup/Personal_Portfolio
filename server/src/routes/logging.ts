/**
 * Server-side Logging Routes - Log Aggregation and Analysis
 *
 * Provides API endpoints for collecting, storing, and analyzing
 * client-side logs for AI-assisted troubleshooting and development.
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';

interface LogEntry {
  id: string;
  message: string;
  data?: Record<string, any>;
  metadata: {
    userId?: string;
    sessionId: string;
    timestamp: number;
    level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    context: 'ui' | 'api' | 'storage' | 'performance' | 'user-action' | 'error' | 'system';
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
    breadcrumbs?: Array<{
      timestamp: number;
      category: string;
      message: string;
      data?: Record<string, any>;
    }>;
  };
}

interface ErrorReport {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata: {
    errorId: string;
    timestamp: string;
    componentName: string;
    userActions: string[];
    environment: {
      url: string;
      userAgent: string;
      viewport?: {
        width: number;
        height: number;
      };
    };
    retryCount: number;
    sessionInfo: any;
    componentStack?: any[];
  };
}

interface LogAnalysisResult {
  summary: {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    criticalCount: number;
    timeRange: {
      start: string;
      end: string;
    };
  };
  patterns: {
    commonErrors: Array<{
      message: string;
      count: number;
      component?: string;
      lastOccurrence: string;
    }>;
    performanceIssues: Array<{
      operation: string;
      averageTime: number;
      slowestTime: number;
      component?: string;
    }>;
    userBehavior: Array<{
      action: string;
      frequency: number;
      component?: string;
    }>;
  };
  recommendations: string[];
}

export default function createLoggingRoutes() {
  const router = express.Router();

  // Middleware to ensure user context
  router.use((req, res, next) => {
    if (!(req as any).user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  });

  /**
   * POST /api/logs/batch
   * Accept batch log submissions from clients
   */
  router.post('/batch', async (req, res) => {
    const prisma: PrismaClient = req.app.locals.prisma;
    const { logs }: { logs: LogEntry[] } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: 'Invalid logs format' });
    }

    try {
      // Validate and sanitize logs
      const validLogs = logs.filter(log => {
        return log.id && log.message && log.metadata && log.metadata.sessionId;
      });

      if (validLogs.length === 0) {
        return res.status(400).json({ error: 'No valid logs provided' });
      }

      // Store logs in database
      const logEntries = validLogs.map(log => ({
        id: log.id,
        sessionId: log.metadata.sessionId,
        userId: (req as any).user.id,
        level: log.metadata.level,
        context: log.metadata.context,
        component: log.metadata.component,
        message: log.message,
        data: log.data ? JSON.stringify(log.data) : null,
        metadata: JSON.stringify(log.metadata),
        timestamp: new Date(log.metadata.timestamp),
        createdAt: new Date()
      }));

      // Batch insert logs
      await prisma.$transaction(async (tx) => {
        // Create logs table if it doesn't exist (in a real app, this would be in migrations)
        await tx.$executeRaw`
          CREATE TABLE IF NOT EXISTS client_logs (
            id VARCHAR(255) PRIMARY KEY,
            session_id VARCHAR(255) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            level VARCHAR(50) NOT NULL,
            context VARCHAR(100) NOT NULL,
            component VARCHAR(255),
            message TEXT NOT NULL,
            data TEXT,
            metadata TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_session_timestamp (session_id, timestamp),
            INDEX idx_user_level (user_id, level),
            INDEX idx_component_timestamp (component, timestamp)
          )
        `;

        // Insert logs
        for (const logEntry of logEntries) {
          await tx.$executeRaw`
            INSERT INTO client_logs
            (id, session_id, user_id, level, context, component, message, data, metadata, timestamp, created_at)
            VALUES (${logEntry.id}, ${logEntry.sessionId}, ${logEntry.userId}, ${logEntry.level},
                   ${logEntry.context}, ${logEntry.component}, ${logEntry.message}, ${logEntry.data},
                   ${logEntry.metadata}, ${logEntry.timestamp}, ${logEntry.createdAt})
            ON DUPLICATE KEY UPDATE
            message = VALUES(message),
            data = VALUES(data),
            metadata = VALUES(metadata)
          `;
        }
      });

      console.log(`Stored ${validLogs.length} log entries for user ${(req as any).user.id}`);

      res.json({
        success: true,
        processed: validLogs.length,
        rejected: logs.length - validLogs.length
      });
    } catch (error) {
      console.error('Error storing logs:', error);
      res.status(500).json({ error: 'Failed to store logs' });
    }
  });

  /**
   * POST /api/logs/error
   * Accept error reports from ErrorBoundary
   */
  router.post('/error', async (req, res) => {
    const prisma: PrismaClient = req.app.locals.prisma;
    const errorReport: ErrorReport = req.body;

    try {
      // Store error report
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS error_reports (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          error_name VARCHAR(255) NOT NULL,
          error_message TEXT NOT NULL,
          error_stack TEXT,
          component_name VARCHAR(255),
          user_actions TEXT,
          environment TEXT NOT NULL,
          retry_count INT DEFAULT 0,
          session_info TEXT,
          component_stack TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_timestamp (user_id, created_at),
          INDEX idx_component_error (component_name, error_name)
        )
      `;

      await prisma.$executeRaw`
        INSERT INTO error_reports
        (id, user_id, error_name, error_message, error_stack, component_name,
         user_actions, environment, retry_count, session_info, component_stack, created_at)
        VALUES (${errorReport.metadata.errorId}, ${(req as any).user.id}, ${errorReport.error.name},
               ${errorReport.error.message}, ${errorReport.error.stack}, ${errorReport.metadata.componentName},
               ${JSON.stringify(errorReport.metadata.userActions)}, ${JSON.stringify(errorReport.metadata.environment)},
               ${errorReport.metadata.retryCount}, ${JSON.stringify(errorReport.metadata.sessionInfo)},
               ${JSON.stringify(errorReport.metadata.componentStack)}, ${new Date()})
        ON DUPLICATE KEY UPDATE
        retry_count = VALUES(retry_count),
        user_actions = VALUES(user_actions)
      `;

      console.log(`Stored error report ${errorReport.metadata.errorId} for user ${(req as any).user.id}`);

      res.json({ success: true, errorId: errorReport.metadata.errorId });
    } catch (error) {
      console.error('Error storing error report:', error);
      res.status(500).json({ error: 'Failed to store error report' });
    }
  });

  /**
   * GET /api/logs/analysis
   * Get AI-friendly log analysis for troubleshooting
   */
  router.get('/analysis', async (req, res) => {
    const prisma: PrismaClient = req.app.locals.prisma;
    const { timeRange = '24h', component, level } = req.query;

    try {
      // Calculate time range
      let startTime: Date;
      switch (timeRange) {
        case '1h':
          startTime = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }

      // Build WHERE conditions
      let whereConditions = `WHERE user_id = '${(req as any).user.id}' AND timestamp >= '${startTime.toISOString()}'`;
      if (component) {
        whereConditions += ` AND component = '${component}'`;
      }
      if (level) {
        whereConditions += ` AND level = '${level}'`;
      }

      // Get log summary
      const summaryResult = await prisma.$queryRaw`
        SELECT
          COUNT(*) as totalLogs,
          SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END) as errorCount,
          SUM(CASE WHEN level = 'warn' THEN 1 ELSE 0 END) as warningCount,
          SUM(CASE WHEN level = 'critical' THEN 1 ELSE 0 END) as criticalCount,
          MIN(timestamp) as earliest,
          MAX(timestamp) as latest
        FROM client_logs
        ${whereConditions}
      ` as any[];

      // Get common errors
      const commonErrors = await prisma.$queryRaw`
        SELECT
          message,
          component,
          COUNT(*) as count,
          MAX(timestamp) as lastOccurrence
        FROM client_logs
        ${whereConditions} AND level IN ('error', 'critical')
        GROUP BY message, component
        ORDER BY count DESC
        LIMIT 10
      ` as any[];

      // Get performance data
      const performanceData = await prisma.$queryRaw`
        SELECT
          component,
          JSON_EXTRACT(metadata, '$.performance.timing') as timing,
          message
        FROM client_logs
        ${whereConditions} AND context = 'performance'
        AND JSON_EXTRACT(metadata, '$.performance.timing') IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 100
      ` as any[];

      // Get user behavior patterns
      const userBehavior = await prisma.$queryRaw`
        SELECT
          JSON_EXTRACT(data, '$.action') as action,
          component,
          COUNT(*) as frequency
        FROM client_logs
        ${whereConditions} AND context = 'user-action'
        AND JSON_EXTRACT(data, '$.action') IS NOT NULL
        GROUP BY action, component
        ORDER BY frequency DESC
        LIMIT 20
      ` as any[];

      // Process performance data
      const performanceIssues = performanceData.reduce((acc: any[], row: any) => {
        if (row.timing && row.component && row.message) {
          const timing = parseFloat(row.timing);
          if (timing > 100) { // Only consider operations taking > 100ms
            const existing = acc.find(item =>
              item.operation === row.message && item.component === row.component
            );
            if (existing) {
              existing.times.push(timing);
            } else {
              acc.push({
                operation: row.message,
                component: row.component,
                times: [timing]
              });
            }
          }
        }
        return acc;
      }, []).map((item: any) => ({
        operation: item.operation,
        component: item.component,
        averageTime: item.times.reduce((a: number, b: number) => a + b, 0) / item.times.length,
        slowestTime: Math.max(...item.times)
      })).filter((item: any) => item.averageTime > 200); // Only show operations averaging > 200ms

      // Generate recommendations
      const recommendations: string[] = [];
      const summary = summaryResult[0];

      if (summary.errorCount > 0) {
        recommendations.push(`${summary.errorCount} errors detected. Review error patterns and implement proper error handling.`);
      }

      if (performanceIssues.length > 0) {
        recommendations.push(`${performanceIssues.length} performance issues identified. Consider optimizing slow operations.`);
      }

      if (summary.criticalCount > 0) {
        recommendations.push(`${summary.criticalCount} critical errors found. These require immediate attention.`);
      }

      if (summary.totalLogs > 1000) {
        recommendations.push('High log volume detected. Consider reducing debug logging in production.');
      }

      // Format analysis result
      const analysis: LogAnalysisResult = {
        summary: {
          totalLogs: parseInt(summary.totalLogs),
          errorCount: parseInt(summary.errorCount),
          warningCount: parseInt(summary.warningCount),
          criticalCount: parseInt(summary.criticalCount),
          timeRange: {
            start: summary.earliest?.toISOString() || startTime.toISOString(),
            end: summary.latest?.toISOString() || new Date().toISOString()
          }
        },
        patterns: {
          commonErrors: commonErrors.map((error: any) => ({
            message: error.message,
            count: parseInt(error.count),
            component: error.component,
            lastOccurrence: error.lastOccurrence?.toISOString()
          })),
          performanceIssues,
          userBehavior: userBehavior.map((behavior: any) => ({
            action: behavior.action,
            frequency: parseInt(behavior.frequency),
            component: behavior.component
          }))
        },
        recommendations
      };

      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing logs:', error);
      res.status(500).json({ error: 'Failed to analyze logs' });
    }
  });

  /**
   * GET /api/logs/search
   * Search logs with AI-friendly query interface
   */
  router.get('/search', async (req, res) => {
    const prisma: PrismaClient = req.app.locals.prisma;
    const {
      query,
      level,
      component,
      context,
      startTime,
      endTime,
      limit = 100
    } = req.query;

    try {
      let whereConditions = `WHERE user_id = '${(req as any).user.id}'`;
      const params: any[] = [];

      if (query) {
        whereConditions += ` AND (message LIKE ? OR data LIKE ?)`;
        params.push(`%${query}%`, `%${query}%`);
      }

      if (level) {
        whereConditions += ` AND level = ?`;
        params.push(level);
      }

      if (component) {
        whereConditions += ` AND component = ?`;
        params.push(component);
      }

      if (context) {
        whereConditions += ` AND context = ?`;
        params.push(context);
      }

      if (startTime) {
        whereConditions += ` AND timestamp >= ?`;
        params.push(new Date(startTime as string));
      }

      if (endTime) {
        whereConditions += ` AND timestamp <= ?`;
        params.push(new Date(endTime as string));
      }

      const logs = await prisma.$queryRaw`
        SELECT id, session_id, level, context, component, message, data, metadata, timestamp
        FROM client_logs
        ${whereConditions}
        ORDER BY timestamp DESC
        LIMIT ${parseInt(limit as string)}
      ` as any[];

      // Parse JSON fields
      const formattedLogs = logs.map((log: any) => ({
        ...log,
        data: log.data ? JSON.parse(log.data) : null,
        metadata: JSON.parse(log.metadata),
        timestamp: log.timestamp.toISOString()
      }));

      res.json({
        logs: formattedLogs,
        total: formattedLogs.length,
        hasMore: formattedLogs.length === parseInt(limit as string)
      });
    } catch (error) {
      console.error('Error searching logs:', error);
      res.status(500).json({ error: 'Failed to search logs' });
    }
  });

  /**
   * DELETE /api/logs/cleanup
   * Clean up old logs (for privacy/storage management)
   */
  router.delete('/cleanup', async (req, res) => {
    const prisma: PrismaClient = req.app.locals.prisma;
    const { olderThan = '30d' } = req.query;

    try {
      let cutoffDate: Date;
      switch (olderThan) {
        case '7d':
          cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const result = await prisma.$executeRaw`
        DELETE FROM client_logs
        WHERE user_id = ${(req as any).user.id}
        AND timestamp < ${cutoffDate}
      `;

      res.json({
        success: true,
        deletedCount: result,
        cutoffDate: cutoffDate.toISOString()
      });
    } catch (error) {
      console.error('Error cleaning up logs:', error);
      res.status(500).json({ error: 'Failed to clean up logs' });
    }
  });

  return router;
}