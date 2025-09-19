import express from 'express';
import { requireWorkspaceMembership, type AuthenticatedRequest } from '../middleware/auth';
import { projectEventBus } from '../lib/projectEvents';
import type { ProjectEventPayload } from '../lib/projectEvents';

const router = express.Router();

router.get('/workspaces/:workspaceId/stream', requireWorkspaceMembership, (req: AuthenticatedRequest, res) => {
  const { workspaceId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ workspaceId, connectedAt: new Date().toISOString() })}\n\n`);

  const sendEvent = (event: ProjectEventPayload) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const unsubscribe = projectEventBus.subscribe(workspaceId, sendEvent);
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

export default router;
