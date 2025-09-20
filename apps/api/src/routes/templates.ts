import type { FastifyPluginAsync } from 'fastify';
import { templateService } from '../services/TemplateService.js';
import { projectService } from '../services/ProjectService.js';

export const templatesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    return templateService.list();
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const template = templateService.get(id);
    if (!template) {
      return reply.notFound('template not found');
    }
    return template;
  });

  fastify.get('/recommend/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = await projectService.get(projectId);
    if (!project) {
      return reply.notFound('project not found');
    }
    return templateService.recommend(project);
  });
};
