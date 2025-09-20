import type { FastifyPluginAsync } from 'fastify';
import { blockService } from '../services/BlockService.js';
import { Project } from '@portfolioforge/schemas';

export const blocksRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const blocks = blockService.list(projectId);
    if (!blocks) {
      return reply.notFound('project not found');
    }
    return blocks;
  });

  fastify.post('/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const body = request.body as unknown;
    const parsed = Project.shape.blocks.safeParse(body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.flatten().formErrors.join(', '));
    }
    const blocks = blockService.save(projectId, parsed.data);
    return blocks;
  });
};
