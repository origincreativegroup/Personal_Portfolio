import type { FastifyPluginAsync } from 'fastify';
import { fileService } from '../services/FileService.js';

export const filesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/upload-url', async (request, reply) => {
    const body = request.body as { objectName?: string; contentType?: string };
    if (!body?.objectName || !body?.contentType) {
      return reply.badRequest('objectName and contentType required');
    }
    return fileService.createSignedUpload(body.objectName, body.contentType);
  });
};
