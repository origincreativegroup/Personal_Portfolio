import Fastify from 'fastify';
import cors from '@fastify/cors';
import formBody from '@fastify/formbody';
import cookie from '@fastify/cookie';
import sensible from '@fastify/sensible';
import { projectsRoute } from './routes/projects.js';
import { blocksRoute } from './routes/blocks.js';
import { filesRoute } from './routes/files.js';
import { narrativesRoute } from './routes/narratives.js';
import { templatesRoute } from './routes/templates.js';
import { exportRoute } from './routes/export.js';

export const buildServer = async () => {
  const server = Fastify({
    logger: true,
  });

  await server.register(cors, {
    origin: true,
    credentials: true,
  });
  await server.register(formBody);
  await server.register(cookie);
  await server.register(sensible);

  await server.register(projectsRoute, { prefix: '/projects' });
  await server.register(blocksRoute, { prefix: '/blocks' });
  await server.register(filesRoute, { prefix: '/files' });
  await server.register(narrativesRoute, { prefix: '/narratives' });
  await server.register(templatesRoute, { prefix: '/templates' });
  await server.register(exportRoute, { prefix: '/export' });

  return server;
};

export type ApiServer = Awaited<ReturnType<typeof buildServer>>;
