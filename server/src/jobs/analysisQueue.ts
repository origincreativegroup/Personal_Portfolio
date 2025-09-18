import Queue from 'bull';
import { FileProcessor } from '../services/fileProcessor';
import { AIAnalysisService } from '../services/aiAnalysis';

const analysisQueue = new Queue('analysis processing', process.env.REDIS_URL || 'redis://localhost:6379');
const fileProcessor = new FileProcessor();
const aiAnalysisService = new AIAnalysisService();

analysisQueue.process('analyze-file', async (job) => {
  const { fileId } = job.data as { fileId: string };

  job.progress(0);
  await fileProcessor.processFile(fileId);
  job.progress(100);

  return { fileId, status: 'completed' };
});

analysisQueue.process('analyze-project', async (job) => {
  const { projectId } = job.data as { projectId: string };

  job.progress(0);
  const result = await aiAnalysisService.analyzeProject(projectId);
  job.progress(100);

  return { projectId, status: 'completed', result };
});

export { analysisQueue };
