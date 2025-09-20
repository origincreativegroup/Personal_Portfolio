import type { FastifyPluginAsync } from 'fastify';
import { projectService } from '../services/ProjectService.js';
import { blockService } from '../services/BlockService.js';
import { ProjectStatus, Project } from '@portfolioforge/schemas';

export const projectsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request) => {
    const status = request.query?.status;
    if (typeof status === 'string' && ProjectStatus.safeParse(status).success) {
      return projectService.list(status as 'draft' | 'published');
    }
    return projectService.list();
  });

  fastify.post('/', async (request, reply) => {
    const body = request.body as { title?: string; summary?: string; tags?: string[]; coverUrl?: string };
    if (!body?.title) {
      return reply.badRequest('title is required');
    }
    const project = await projectService.create(body);
    return project;
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await projectService.get(id);
    if (!project) {
      return reply.notFound('project not found');
    }
    return project;
  });

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { title?: string; summary?: string; tags?: string[]; coverUrl?: string; blocks?: unknown };
    const project = await projectService.update(id, body);
    if (!project) {
      return reply.notFound('project not found');
    }
    if (body.blocks) {
      const parse = Project.shape.blocks.safeParse(body.blocks);
      if (!parse.success) {
        return reply.badRequest('invalid blocks');
      }
      blockService.save(id, parse.data);
    }
    return projectService.get(id);
  });

  fastify.post('/:id/publish', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await projectService.publish(id);
    if (!result) {
      return reply.notFound('project not found');
    }
    return result;
  });
};
