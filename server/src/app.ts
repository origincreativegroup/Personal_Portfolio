import express from 'express';
import cors from 'cors';
import analysisRoutes from './routes/analysis';
import { analysisQueue } from './jobs/analysisQueue';
import { getMetricsSnapshot } from './observability/metrics';
import type { AuthenticatedRequest } from './middleware/auth';
import { getPrismaClient } from './utils/prismaClient';

const app = express();
app.locals.analysisQueue = analysisQueue;

app.use(cors());
app.use(express.json());

app.use((req: AuthenticatedRequest, _res, next) => {
  const headerUserId = req.header('x-user-id');
  const devUserId = process.env.DEV_USER_ID ?? (process.env.NODE_ENV !== 'production' ? 'demo-user' : undefined);

  if (headerUserId || devUserId) {
    req.user = {
      id: headerUserId ?? devUserId!,
    };
  }

  next();
});

app.use('/api/analysis', analysisRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/health/worker', async (_req, res) => {
  try {
    const counts = await analysisQueue.getJobCounts();
    res.json({ status: 'OK', queue: counts, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/readyz', async (_req, res) => {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await analysisQueue.isReady();
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'not-ready', error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/metrics', async (_req, res) => {
  try {
    const snapshot = await getMetricsSnapshot();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(snapshot);
  } catch (error) {
    res.status(500).send(`# Metrics unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
});

export default app;
