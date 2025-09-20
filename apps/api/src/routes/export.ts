import type { FastifyPluginAsync } from 'fastify';
import { exportService } from '../services/ExportService.js';
import { projectService } from '../services/ProjectService.js';
import { templateService } from '../services/TemplateService.js';

export const exportRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/:projectId/pdf', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const body = request.body as { templateId?: string } | undefined;
    const project = await projectService.get(projectId);
    if (!project) {
      return reply.notFound('project not found');
    }
    const template = body?.templateId ? templateService.get(body.templateId) ?? undefined : undefined;
    const pdf = await exportService.generatePdf(project, template);
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${project.title.replace(/[^a-z0-9-]+/gi, '_')}.pdf"`);
    return reply.send(pdf);
  });

  fastify.get('/:projectId/public', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = await projectService.get(projectId);
    if (!project) {
      return reply.notFound('project not found');
    }
    const [recommended] = templateService.recommend(project);
    const html = exportService.renderPublicHtml(project, recommended);
    reply.header('Content-Type', 'text/html');
    return reply.send(html);
  });
};
