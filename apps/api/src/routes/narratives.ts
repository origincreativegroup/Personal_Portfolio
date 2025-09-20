import type { FastifyPluginAsync } from 'fastify';
import { projectService } from '../services/ProjectService.js';
import { narrativeService, type NarrativeMode, type ToneLevel } from '../services/NarrativeService.js';

export const narrativesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/:projectId/generate', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const body = request.body as { tone?: number; mode?: NarrativeMode; action?: 'generate' | 'rewrite' };
    const project = await projectService.get(projectId);
    if (!project) {
      return reply.notFound('project not found');
    }
    const tone = (body.tone ?? 3) as ToneLevel;
    const mode = body.mode ?? 'default';

    if (body.action === 'rewrite') {
      const content = await narrativeService.rewrite(project.blocks, mode, tone);
      return { projectId, content };
    }

    return narrativeService.generate(project, tone, mode);
  });
};
