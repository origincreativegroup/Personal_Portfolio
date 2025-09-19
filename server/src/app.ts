import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import analysisRoutes from './routes/analysis';

const app = express();
const prisma = new PrismaClient();

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
    fileSize: 50 * 1024 * 1024
  }
});

app.use('/api/analysis', analysisRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
