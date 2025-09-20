import Queue from 'bull';
import type { Queue as BullQueue } from 'bull';
import type { PrismaClient } from '@prisma/client';
import { FileProcessor } from '../services/fileProcessor';
import { AIAnalysisService } from '../services/aiAnalysis';

export type AnalysisQueue = BullQueue;

export type CreateAnalysisQueueOptions = {
  prisma: PrismaClient;
};

export const createAnalysisQueue = ({ prisma }: CreateAnalysisQueueOptions): AnalysisQueue => {
  const queue: AnalysisQueue = new Queue('analysis processing', process.env.REDIS_URL || 'redis://localhost:6379');
  const fileProcessor = new FileProcessor({ prisma });
  const aiAnalysisService = new AIAnalysisService({ prisma });

  queue.process('analyze-file', async job => {
    const { fileId } = job.data as { fileId: string };

    job.progress(0);
    await fileProcessor.processFile(fileId);
    job.progress(100);

    return { fileId, status: 'completed' as const };
  });

  queue.process('analyze-project', async job => {
    const { projectId } = job.data as { projectId: string };

    job.progress(0);
    const result = await aiAnalysisService.analyzeProject(projectId);
    job.progress(100);

    return { projectId, status: 'completed' as const, result };
  });

  return queue;
};
