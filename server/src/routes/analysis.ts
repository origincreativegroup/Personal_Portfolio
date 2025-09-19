import express from 'express';
import { getPrismaClient } from '../utils/prismaClient';
import { analysisQueue, enqueueFileAnalysis, enqueueProjectAnalysis } from '../jobs/analysisQueue';
import { deadLetterQueue } from '../jobs/deadLetterQueue';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { jobHistoryService } from '../services/jobHistory';
import { jobEventBus, type JobUpdateEvent } from '../observability/jobEventBus';

const ensureStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (typeof item === 'number' || typeof item === 'boolean') {
        return String(item);
      }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        if (typeof record.content === 'string') {
          return record.content.trim();
        }
        if (typeof record.value === 'string') {
          return record.value.trim();
        }
        try {
          return JSON.stringify(record);
        } catch {
          return '';
        }
      }
      return '';
    })
    .filter((entry): entry is string => entry.length > 0);
};

const ensureEvidenceArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const type = typeof record.type === 'string' ? record.type.toUpperCase() : null;
        const content = typeof record.content === 'string'
          ? record.content.trim()
          : record.content != null
            ? JSON.stringify(record.content)
            : '';
        if (!content) {
          return '';
        }
        const confidence = typeof record.confidence === 'number'
          ? ` (confidence ${(record.confidence * 100).toFixed(0)}%)`
          : '';
        return type ? `[${type}] ${content}${confidence}` : `${content}${confidence}`;
      }
      try {
        return JSON.stringify(item);
      } catch {
        return '';
      }
    })
    .filter((entry): entry is string => entry.length > 0);
};

type MetricRecord = { metric: string; before: string; after: string; change: string };

const ensureMetricArray = (value: unknown): MetricRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as Record<string, unknown>;
      const metric = typeof record.metric === 'string' ? record.metric : '';
      const before = typeof record.before === 'string' ? record.before : '';
      const after = typeof record.after === 'string' ? record.after : '';
      const change = typeof record.change === 'string' ? record.change : '';

      if (!metric && !before && !after && !change) {
        return null;
      }

      return { metric, before, after, change };
    })
    .filter((entry): entry is MetricRecord => Boolean(entry));
};

type SerializedInsight = {
  content: string;
  type?: string;
  confidence?: number;
  source?: string;
};

const normalizeInsights = (value: unknown): SerializedInsight[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): SerializedInsight | null => {
      if (typeof item === 'string') {
        return { content: item };
      }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const contentRaw = record.content;
        const content = typeof contentRaw === 'string'
          ? contentRaw
          : contentRaw != null
            ? (() => {
              try {
                return JSON.stringify(contentRaw);
              } catch {
                return String(contentRaw);
              }
            })()
            : '';

        if (!content.trim()) {
          return null;
        }

        const type = typeof record.type === 'string' ? record.type : undefined;
        const confidenceValue = record.confidence;
        const confidence = typeof confidenceValue === 'number'
          ? confidenceValue
          : typeof confidenceValue === 'string'
            ? Number(confidenceValue)
            : undefined;
        const source = typeof record.source === 'string' ? record.source : undefined;

        return {
          content: content.trim(),
          type,
          confidence: Number.isFinite(confidence) ? confidence : undefined,
          source,
        };
      }
      if (item == null) {
        return null;
      }
      try {
        return { content: JSON.stringify(item) };
      } catch {
        return { content: String(item) };
      }
    })
    .filter((entry): entry is SerializedInsight => entry !== null);
};

const router = express.Router();
const initialiseSse = (res: express.Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
};

const writeSseEvent = (res: express.Response, event: JobUpdateEvent) => {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
};

router.post('/projects/:projectId/analyze', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const prisma = getPrismaClient();

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId
      },
      include: {
        files: true
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.files.length === 0) {
      res.status(400).json({ error: 'Project must have files to analyze' });
      return;
    }

    const spacing = Number(process.env.ANALYSIS_FILE_JOB_DELAY_MS ?? 250);
    let offset = 0;

    for (const file of project.files) {
      await enqueueFileAnalysis({ projectId, fileId: file.id, delay: offset });
      offset += spacing;
    }

    const projectDelay = Math.max(project.files.length * 5000, offset);
    await enqueueProjectAnalysis({ projectId, delay: projectDelay });

    res.json({
      message: 'Analysis started',
      projectId,
      filesQueued: project.files.length
    });

  } catch (error) {
    console.error('Error starting analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/projects/:projectId/analysis', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const prisma = getPrismaClient();

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId
      },
      include: {
        files: {
          include: {
            analysis: true
          }
        }
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const jobExecutions = await prisma.jobExecution.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    const fileJobMap = new Map<string, typeof jobExecutions[number]>();
    for (const execution of jobExecutions) {
      if (execution.fileId && !fileJobMap.has(execution.fileId)) {
        fileJobMap.set(execution.fileId, execution);
      }
    }

    const projectJob = jobExecutions.find(execution => execution.jobName === 'analyze-project');

    const analysisRecord = await prisma.projectAnalysis.findUnique({
      where: { projectId }
    });

    const fileAnalyses = project.files.map(file => {
      const jobState = fileJobMap.get(file.id);
      const meta = jobState?.metadata as Record<string, unknown> | null;
      const progress = typeof meta?.lastProgress === 'number' ? meta.lastProgress : undefined;

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        status: file.analysis?.status ?? 'pending',
        insights: normalizeInsights(file.analysis?.insights ?? []),
        extractedText: typeof file.analysis?.extractedText === 'string' ? file.analysis.extractedText : null,
        metadata: file.analysis?.metadata ?? null,
        updatedAt: file.analysis?.updatedAt ?? file.updatedAt,
        jobStatus: jobState?.status ?? 'queued',
        jobAttempt: jobState?.attempts ?? 0,
        jobMaxAttempts: jobState?.maxAttempts ?? null,
        jobNextRetryAt: jobState?.retryAt ? jobState.retryAt.toISOString() : null,
        jobLastError: jobState?.lastError ?? null,
        jobProgress: typeof progress === 'number'
          ? progress
          : jobState?.status === 'completed'
            ? 100
            : undefined,
      };
    });

    const analysisPayload = analysisRecord
      ? {
          status: analysisRecord.status,
          confidence: analysisRecord.confidence ?? null,
          processingTime: analysisRecord.processingTime ?? null,
          filesAnalyzed: analysisRecord.filesAnalyzed,
          insightsFound: analysisRecord.insightsFound,
          suggestedTitle: analysisRecord.suggestedTitle ?? null,
          suggestedCategory: analysisRecord.suggestedCategory ?? null,
          suggestedTags: ensureStringArray(analysisRecord.suggestedTags ?? []),
          updatedAt: analysisRecord.updatedAt,
          startedAt: analysisRecord.createdAt,
          jobStatus: projectJob
            ? {
                status: projectJob.status,
                attempts: projectJob.attempts,
                maxAttempts: projectJob.maxAttempts,
                nextRetryAt: projectJob.retryAt ? projectJob.retryAt.toISOString() : null,
                lastError: projectJob.lastError ?? null,
              }
            : null,
        }
      : {
          status: 'pending',
          confidence: null,
          processingTime: null,
          filesAnalyzed: 0,
          insightsFound: 0,
          suggestedTitle: null,
          suggestedCategory: null,
          suggestedTags: [] as string[],
          updatedAt: null,
          startedAt: null,
          jobStatus: projectJob
            ? {
                status: projectJob.status,
                attempts: projectJob.attempts,
                maxAttempts: projectJob.maxAttempts,
                nextRetryAt: projectJob.retryAt ? projectJob.retryAt.toISOString() : null,
                lastError: projectJob.lastError ?? null,
              }
            : null,
        };

    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        category: project.category,
        fileCount: project.files.length,
        updatedAt: project.updatedAt,
      },
      analysis: analysisPayload,
      fileAnalyses,
    });

  } catch (error) {
    console.error('Error getting analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/projects/:projectId/stream', requireAuth, (req: AuthenticatedRequest, res) => {
  const { projectId } = req.params;
  initialiseSse(res);
  writeSseEvent(res, {
    jobId: 'initial',
    jobName: 'initial-state',
    queueName: analysisQueue.name,
    projectId,
    status: 'queued',
    timestamp: new Date().toISOString(),
  });

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 15000);
  heartbeat.unref();

  const unsubscribe = jobEventBus.subscribe(event => {
    if (!event.projectId || event.projectId !== projectId) {
      return;
    }
    writeSseEvent(res, event);
  });

  req.on('close', () => {
    unsubscribe();
    clearInterval(heartbeat);
  });
});

router.get('/projects/:projectId/jobs/history', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    const limit = Math.min(Math.max(Number(req.query.limit ?? 25), 1), 100);
    const jobs = await jobHistoryService.getProjectHistory(projectId, limit);
    res.json({ jobs });
  } catch (error) {
    console.error('Error loading project job history:', error);
    res.status(500).json({ error: 'Unable to load job history' });
  }
});

router.get('/projects/:projectId/analysis/results', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const prisma = getPrismaClient();

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const analysis = await prisma.projectAnalysis.findUnique({
      where: { projectId }
    });

    if (!analysis || analysis.status !== 'completed') {
      res.status(404).json({ error: 'Analysis not completed' });
      return;
    }

    const result = {
      confidence: analysis.confidence ?? null,
      processingTime: analysis.processingTime ?? null,
      filesAnalyzed: analysis.filesAnalyzed,
      insights: analysis.insightsFound,
      problem: {
        primary: analysis.primaryProblem ?? '',
        confidence: analysis.problemConfidence ?? null,
        evidence: ensureEvidenceArray(analysis.problemEvidence),
        alternatives: ensureStringArray(analysis.problemAlternatives),
      },
      solution: {
        primary: analysis.primarySolution ?? '',
        confidence: analysis.solutionConfidence ?? null,
        keyElements: ensureStringArray(analysis.solutionElements),
        designPatterns: ensureStringArray(analysis.designPatterns),
      },
      impact: {
        primary: analysis.primaryImpact ?? '',
        confidence: analysis.impactConfidence ?? null,
        metrics: ensureMetricArray(analysis.metrics),
        businessValue: analysis.businessValue ?? '',
      },
      narrative: {
        story: analysis.story ?? '',
        challenges: ensureStringArray(analysis.challenges),
        process: ensureStringArray(analysis.process),
      },
      suggestedTitle: analysis.suggestedTitle ?? '',
      suggestedCategory: analysis.suggestedCategory ?? '',
      tags: ensureStringArray(analysis.suggestedTags),
    };

    res.json(result);

  } catch (error) {
    console.error('Error getting analysis results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/jobs/:jobId/requeue', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { jobId } = req.params;
    const job = await analysisQueue.getJob(jobId);
    if (job) {
      try {
        await job.retry();
        res.json({ jobId: String(job.id), status: 'requeued', source: 'primary' });
        return;
      } catch (retryError) {
        console.error('Error retrying job from primary queue:', retryError);
      }
    }

    const deadLetterJob = await deadLetterQueue.getJob(jobId);
    if (!deadLetterJob) {
      res.status(404).json({ error: 'Job not found in queues' });
      return;
    }

    const payload = deadLetterJob.data as {
      jobName?: string;
      data?: Record<string, unknown>;
      projectId?: string;
      fileId?: string;
    };

    const jobName = payload.jobName ?? 'analyze-project';
    const jobData = payload.data ?? {};
    const requeued = await analysisQueue.add(jobName, jobData);
    await jobHistoryService.recordQueued({
      jobId: String(requeued.id),
      jobName: requeued.name,
      queueName: analysisQueue.name,
      projectId: payload.projectId ?? (typeof jobData.projectId === 'string' ? jobData.projectId : undefined),
      fileId: payload.fileId ?? (typeof jobData.fileId === 'string' ? jobData.fileId : undefined),
      data: jobData,
      maxAttempts: requeued.opts?.attempts,
    });
    await deadLetterJob.remove();
    res.json({ jobId: String(requeued.id), status: 'requeued', source: 'dead-letter' });
  } catch (error) {
    console.error('Error requeuing job:', error);
    res.status(500).json({ error: 'Unable to requeue job' });
  }
});

router.post('/projects/:projectId/analysis/apply', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const { suggestions } = req.body as { suggestions: { title?: string; category?: string; description?: string } };
    const prisma = getPrismaClient();

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    
    if (suggestions?.title) updateData.name = suggestions.title;
    if (suggestions?.category) updateData.category = suggestions.category;
    if (suggestions?.description) updateData.description = suggestions.description;

    await prisma.project.update({
      where: { id: projectId },
      data: updateData
    });

    res.json({ message: 'Suggestions applied successfully' });

  } catch (error) {
    console.error('Error applying suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/observability/summary', requireAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const [counts, hourly, daily, isPaused, workers] = await Promise.all([
      analysisQueue.getJobCounts(),
      jobHistoryService.getSummary(analysisQueue.name, 60 * 60 * 1000),
      jobHistoryService.getSummary(analysisQueue.name, 24 * 60 * 60 * 1000),
      analysisQueue.isPaused(),
      analysisQueue.getWorkers().catch(() => [] as unknown[]),
    ]);

    const clientStatus = (analysisQueue.client as unknown as { status?: string } | undefined)?.status;
    const workerHealth = {
      isReady: clientStatus === 'ready' || clientStatus === 'connect',
      isPaused,
      workerCount: Array.isArray(workers) ? workers.length : 0,
    };

    res.json({
      queue: counts,
      throughput: {
        hourly,
        daily,
      },
      failureRate: {
        hourly: hourly.jobs > 0 ? hourly.failures / hourly.jobs : 0,
        daily: daily.jobs > 0 ? daily.failures / daily.jobs : 0,
      },
      workerHealth,
    });
  } catch (error) {
    console.error('Error building observability summary:', error);
    res.status(500).json({ error: 'Unable to load observability summary' });
  }
});

router.get('/observability/recent-jobs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const jobs = await jobHistoryService.getRecentExecutions(limit);
    res.json({ jobs });
  } catch (error) {
    console.error('Error loading recent jobs:', error);
    res.status(500).json({ error: 'Unable to load recent jobs' });
  }
});

router.get('/observability/stream', requireAuth, (_req: AuthenticatedRequest, res) => {
  initialiseSse(res);
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 15000);
  heartbeat.unref();

  const unsubscribe = jobEventBus.subscribe(event => {
    writeSseEvent(res, event);
  });

  _req.on('close', () => {
    unsubscribe();
    clearInterval(heartbeat);
  });
});

export default router;
