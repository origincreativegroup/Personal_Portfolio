import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import analysisRoutes from './routes/analysis';
import projectRoutes from './routes/projects';
import intakeRoutes from './routes/intake';
import ProjectSyncService from './services/projectSyncService';
import ProjectIntakeService from './services/projectIntakeService';
import { registerProjectSyncScheduler } from './jobs/projectSyncScheduler';
import './types/express'; // Import Express type extensions

const app = express();
const prisma = new PrismaClient();
const projectRoot = process.env.PROJECTS_ROOT ?? path.resolve(__dirname, '../..', 'projects');
const projectSyncService = new ProjectSyncService(prisma, { projectRoot });
const projectIntakeService = new ProjectIntakeService({ projectRoot, syncService: projectSyncService });

app.locals.projectSyncService = projectSyncService;
app.locals.prisma = prisma;
app.locals.projectIntakeService = projectIntakeService;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  const headerUserId = req.header('x-user-id');
  const devUserId = process.env.DEV_USER_ID ?? (process.env.NODE_ENV !== 'production' ? 'demo-user' : undefined);

  if (headerUserId || devUserId) {
    req.user = {
      id: headerUserId ?? devUserId!,
    };
  }

  next();
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

app.use('/api/analysis', analysisRoutes);
app.use('/api/projects', projectRoutes(upload));
app.use('/api/intake', intakeRoutes(upload));

registerProjectSyncScheduler({
  service: projectSyncService,
  intervalMs: Number(process.env.PROJECT_SYNC_INTERVAL_MS ?? 5 * 60 * 1000),
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
