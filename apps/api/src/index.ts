import { buildServer } from './server.js';

const server = await buildServer();
const port = Number(process.env.PORT ?? 4000);

try {
  await server.listen({ port, host: '0.0.0.0' });
  server.log.info(`API ready on http://localhost:${port}`);
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
