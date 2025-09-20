import express from 'express';
import type { Express } from 'express';
import type multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import ProjectSyncService from '../services/projectSyncService';

type AppLocals = {
  projectSyncService?: ProjectSyncService;
  prisma?: PrismaClient;
};

const resolveDependencies = (req: express.Request) => {
  const locals = req.app.locals as AppLocals;
  if (!locals.projectSyncService || !locals.prisma) {
    throw new Error('Project sync service has not been initialised');
  }
  return {
    service: locals.projectSyncService,
    prisma: locals.prisma,
  };
};

const routerFactory = (upload: multer.Multer) => {
  const router = express.Router();
  const archiveUpload = upload.fields([
    { name: 'archive', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);

  const resolveUploadedArchive = (req: express.Request): Express.Multer.File | undefined => {
    if (req.file) {
      return req.file;
    }

    const { files } = req;
    if (!files) {
      return undefined;
    }

    if (Array.isArray(files)) {
      return files[0];
    }

    const typedFiles = files as Record<string, Express.Multer.File[]>;
    return typedFiles.archive?.[0] ?? typedFiles.file?.[0];
  };

  router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { prisma } = resolveDependencies(req);
      const page = Math.max(Number(req.query.page) || 1, 1);
      const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 12, 1), 50);
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

      const where: Parameters<typeof prisma.project.findMany>[0]['where'] = {
        OR: search
          ? [
              { title: { contains: search, mode: 'insensitive' } },
              { organization: { contains: search, mode: 'insensitive' } },
              { tags: { has: search.toLowerCase() } },
            ]
          : undefined,
      };

      const [projects, total] = await prisma.$transaction([
        prisma.project.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          include: {
            assets: { orderBy: { updatedAt: 'desc' }, take: 4 },
            deliverables: { orderBy: { updatedAt: 'desc' }, take: 3 },
            _count: { select: { assets: true, deliverables: true } },
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.project.count({ where }),
      ]);

      res.json({
        data: projects.map(project => ({
          id: project.id,
          slug: project.slug,
          title: project.title,
          summary: project.summary,
          organization: project.organization,
          workType: project.workType,
          year: project.year,
          tags: project.tags,
          highlights: project.highlights,
          syncStatus: project.syncStatus,
          lastSyncedAt: project.lastSyncedAt,
          fsLastModified: project.fsLastModified,
          metadataUpdatedAt: project.metadataUpdatedAt,
          briefUpdatedAt: project.briefUpdatedAt,
          assetCount: project._count.assets,
          deliverableCount: project._count.deliverables,
          assetPreviews: project.assets.map(asset => ({
            id: asset.id,
            label: asset.label,
            relativePath: asset.relativePath,
            type: asset.type,
            updatedAt: asset.updatedAt,
          })),
          deliverablePreviews: project.deliverables.map(deliverable => ({
            id: deliverable.id,
            label: deliverable.label,
            relativePath: deliverable.relativePath,
            format: deliverable.format,
            updatedAt: deliverable.updatedAt,
          })),
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(Math.ceil(total / pageSize), 1),
        },
      });
    } catch (error) {
      console.error('Failed to list projects', error);
      res.status(500).json({ error: 'Failed to list projects' });
    }
  });

  router.post('/sync', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { service } = resolveDependencies(req);
      const result = await service.syncAll();
      res.json(result);
    } catch (error) {
      console.error('Project sync failed', error);
      res.status(500).json({ error: 'Project sync failed' });
    }
  });

  router.post('/import', requireAuth, archiveUpload, async (req: AuthenticatedRequest, res) => {
    try {
      const { service } = resolveDependencies(req);
      const uploadedArchive = resolveUploadedArchive(req);
      if (!uploadedArchive?.buffer) {
        res.status(400).json({ error: 'Missing archive upload' });
        return;
      }
      const results = await service.importFromZip(uploadedArchive.buffer);
      res.status(201).json({ imported: results.length, results });
    } catch (error) {
      console.error('Import failed', error);
      res.status(500).json({ error: 'Import failed' });
    }
  });

  router.get('/:projectId', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { prisma, service } = resolveDependencies(req);
      const { projectId } = req.params;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { assets: true, deliverables: true },
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const brief = await service.readBrief(projectId);
      res.json({
        project,
        metadata: service.metadataFromProject(project),
        brief,
      });
    } catch (error) {
      console.error('Failed to fetch project', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  router.patch('/:projectId/metadata', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { service } = resolveDependencies(req);
      const { projectId } = req.params;
      const { metadata, expectedChecksum } = req.body ?? {};

      if (!metadata || typeof metadata !== 'object') {
        res.status(400).json({ error: 'Metadata payload missing' });
        return;
      }

      try {
        const updated = await service.updateMetadata({
          projectId,
          metadata,
          expectedChecksum,
        });
        res.json({ project: updated });
      } catch (error: unknown) {
        const conflict = (error as { conflict?: unknown }).conflict;
        if (conflict) {
          res.status(409).json({ error: 'conflict', details: conflict });
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Failed to update metadata', error);
      res.status(500).json({ error: 'Failed to update metadata' });
    }
  });

  router.patch('/:projectId/brief', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { service } = resolveDependencies(req);
      const { projectId } = req.params;
      const { content, expectedChecksum } = req.body ?? {};

      if (typeof content !== 'string') {
        res.status(400).json({ error: 'Brief content missing' });
        return;
      }

      try {
        const updated = await service.updateBrief({
          projectId,
          content,
          expectedChecksum,
        });
        res.json({ project: updated });
      } catch (error: unknown) {
        const conflict = (error as { conflict?: unknown }).conflict;
        if (conflict) {
          res.status(409).json({ error: 'conflict', details: conflict });
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Failed to update brief', error);
      res.status(500).json({ error: 'Failed to update brief' });
    }
  });

  router.get('/:projectId/export', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { service } = resolveDependencies(req);
      const { projectId } = req.params;

      const archive = await service.exportToZip(projectId);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${archive.filename}"`);
      res.send(archive.buffer);
    } catch (error) {
      console.error('Export failed', error);
      res.status(500).json({ error: 'Export failed' });
    }
  });

  return router;
};

export default routerFactory;
