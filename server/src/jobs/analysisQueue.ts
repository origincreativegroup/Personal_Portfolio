import Queue from 'bull';
import type { Job } from 'bull';
import { FileProcessor } from '../services/fileProcessor';
import { AIAnalysisService } from '../services/aiAnalysis';
import { QueueMonitor } from '../observability/queueMonitor';
import { deadLetterQueue } from './deadLetterQueue';
import { jobHistoryService } from '../services/jobHistory';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const defaultAttempts = Number(process.env.ANALYSIS_JOB_ATTEMPTS ?? 5);
const defaultBackoffDelay = Number(process.env.ANALYSIS_JOB_BACKOFF_MS ?? 15000);
const backoffType = (process.env.ANALYSIS_JOB_BACKOFF_TYPE ?? 'exponential').toLowerCase();

const backoffOption = backoffType === 'fixed'
  ? { type: 'fixed' as const, delay: defaultBackoffDelay }
  : { type: 'exponential' as const, delay: defaultBackoffDelay };

const analysisQueue = new Queue('analysis processing', redisUrl, {
  defaultJobOptions: {
    attempts: defaultAttempts,
    backoff: backoffOption,
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const fileProcessor = new FileProcessor();
const aiAnalysisService = new AIAnalysisService();
const monitor = new QueueMonitor(analysisQueue, deadLetterQueue);

const processFileJob = async (job: Job): Promise<void> => {
  const { fileId } = job.data as { fileId: string };

  job.progress(0);
  await fileProcessor.processFile(fileId);
  job.progress(100);
};

const processProjectJob = async (job: Job): Promise<void> => {
  const { projectId } = job.data as { projectId: string };

  job.progress(0);
  await aiAnalysisService.analyzeProject(projectId);
  job.progress(100);
};

monitor.process('analyze-file', processFileJob);
monitor.process('analyze-project', processProjectJob);

type EnqueueOptions = {
  projectId: string;
  fileId?: string;
  delay?: number;
  data?: Record<string, unknown>;
};

export const enqueueFileAnalysis = async ({ projectId, fileId, delay }: EnqueueOptions) => {
  if (!fileId) {
    throw new Error('fileId is required to enqueue file analysis');
  }

  const job = await analysisQueue.add('analyze-file', { fileId, projectId }, { delay });
  await jobHistoryService.recordQueued({
    jobId: String(job.id),
    jobName: job.name,
    queueName: analysisQueue.name,
    projectId,
    fileId,
    data: job.data,
    maxAttempts: job.opts?.attempts ?? defaultAttempts,
  });
  return job;
};

export const enqueueProjectAnalysis = async ({ projectId, delay }: EnqueueOptions) => {
  const job = await analysisQueue.add('analyze-project', { projectId }, { delay });
  await jobHistoryService.recordQueued({
    jobId: String(job.id),
    jobName: job.name,
    queueName: analysisQueue.name,
    projectId,
    data: job.data,
    maxAttempts: job.opts?.attempts ?? defaultAttempts,
  });
  return job;
};

export { analysisQueue };
