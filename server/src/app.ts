import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import analysisRoutes from './routes/analysis';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import projectRoutes from './routes/projects';
import syncRoutes from './routes/sync';
import { authenticate, requireAuth } from './middleware/auth';

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Attach user context if a valid access token is provided
app.use(authenticate);

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', requireAuth, workspaceRoutes);
app.use('/api/workspaces', requireAuth, projectRoutes);
app.use('/api/analysis', requireAuth, analysisRoutes);
app.use('/api/sync', requireAuth, syncRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
