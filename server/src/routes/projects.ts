import express from 'express';
import { z } from 'zod';
import { WorkspaceRole, ProjectVisibility, InviteStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  requireWorkspaceMembership,
  requireWorkspaceRole,
  type AuthenticatedRequest,
} from '../middleware/auth';
import { projectEventBus } from '../lib/projectEvents';
import { randomBytes } from 'crypto';

const router = express.Router({ mergeParams: true });

const baseProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  template: z.string().optional(),
  color: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).optional(),
  visibility: z.nativeEnum(ProjectVisibility).optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
});

const createProjectSchema = baseProjectSchema.extend({
  files: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    mimeType: z.string(),
    size: z.number().int().nonnegative(),
  })).optional(),
});

const updateProjectSchema = baseProjectSchema.extend({
  version: z.number().int().positive(),
  summary: z.string().optional(),
  conflictStrategy: z.enum(['merge', 'overwrite']).optional(),
});

const revisionSchema = z.object({
  summary: z.string().optional(),
  snapshot: z.record(z.any()),
});

const importProjectsSchema = z.object({
  projects: z.array(
    baseProjectSchema.extend({
      slug: z.string().optional(),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
      version: z.number().int().positive().optional(),
    }),
  ),
});

const shareSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(WorkspaceRole).optional(),
  expiresInDays: z.number().min(1).max(30).optional(),
});

const ensureContributor = (req: AuthenticatedRequest): boolean => {
  if (!req.workspace) return false;
  const allowedRoles: WorkspaceRole[] = [
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.CONTRIBUTOR,
  ];
  return allowedRoles.includes(req.workspace.role);
};

router.get('/:workspaceId/projects', requireWorkspaceMembership, async (req: AuthenticatedRequest, res) => {
  const { workspaceId } = req.params;

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({ projects });
});

router.post('/:workspaceId/projects', requireWorkspaceMembership, async (req: AuthenticatedRequest, res) => {
  if (!ensureContributor(req)) {
    res.status(403).json({ error: 'Insufficient permissions to create projects' });
    return;
  }

  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { workspaceId } = req.params;
  const { files = [], ...projectData } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        workspaceId,
        ownerId: req.user!.id,
        name: projectData.name,
        description: projectData.description,
        category: projectData.category,
        template: projectData.template,
        color: projectData.color,
        visibility: projectData.visibility ?? ProjectVisibility.PRIVATE,
      },
    });

    const revision = await tx.projectRevision.create({
      data: {
        projectId: project.id,
        workspaceId,
        createdById: req.user!.id,
        number: 1,
        summary: 'Initial import',
        snapshot: projectData as unknown as Record<string, unknown>,
      },
    });

    const updatedProject = await tx.project.update({
      where: { id: project.id },
      data: {
        currentRevisionId: revision.id,
        version: 1,
      },
    });

    if (files.length > 0) {
      await tx.projectFile.createMany({
        data: files.map((file, index) => ({
          workspaceId,
          projectId: project.id,
          name: file.name,
          filename: file.name,
          originalName: file.name,
          mimeType: file.mimeType,
          size: file.size,
          url: file.url,
          order: index,
          uploadedById: req.user!.id,
          tags: [],
        })),
      });
    }

    return { project: updatedProject, revision };
  });

  projectEventBus.emitEvent({
    workspaceId,
    projectId: result.project.id,
    type: 'project.created',
    actorId: req.user!.id,
    data: {
      name: result.project.name,
      version: 1,
    },
    revisionId: result.revision.id,
  });

  res.status(201).json({
    project: result.project,
    revisionId: result.revision.id,
    version: 1,
  });
});

router.get('/:workspaceId/projects/:projectId', requireWorkspaceMembership, async (req, res) => {
  const { workspaceId, projectId } = req.params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    include: {
      revisions: {
        orderBy: { number: 'desc' },
        take: 1,
      },
    },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  res.json({
    project,
    version: project.version,
    latestRevision: project.revisions[0] ?? null,
  });
});

router.put('/:workspaceId/projects/:projectId', requireWorkspaceMembership, async (req: AuthenticatedRequest, res) => {
  if (!ensureContributor(req)) {
    res.status(403).json({ error: 'Insufficient permissions to update projects' });
    return;
  }

  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { workspaceId, projectId } = req.params;
  const { version, conflictStrategy = 'merge', summary, ...updates } = parsed.data;

  const existing = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (existing.version !== version) {
    const latest = await prisma.project.findFirst({
      where: { id: projectId },
      include: { revisions: { orderBy: { number: 'desc' }, take: 1 } },
    });

    res.status(409).json({
      error: 'Version conflict',
      latest: {
        project: latest,
        version: latest?.version ?? 0,
        latestRevision: latest?.revisions?.[0] ?? null,
      },
    });
    return;
  }

  const nextVersion = existing.version + 1;

  const result = await prisma.$transaction(async (tx) => {
    const revision = await tx.projectRevision.create({
      data: {
        projectId: projectId,
        workspaceId,
        createdById: req.user!.id,
        number: nextVersion,
        summary: summary ?? 'Project updated',
        snapshot: {
          ...updates,
          conflictStrategy,
        },
      },
    });

    const updatedProject = await tx.project.update({
      where: { id: projectId },
      data: {
        ...updates,
        version: nextVersion,
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
        currentRevisionId: revision.id,
      },
    });

    return { updatedProject, revision };
  });

  projectEventBus.emitEvent({
    workspaceId,
    projectId,
    type: 'project.updated',
    actorId: req.user!.id,
    data: { version: nextVersion },
    revisionId: result.revision.id,
  });

  res.json({
    project: result.updatedProject,
    version: nextVersion,
    revisionId: result.revision.id,
  });
});

router.delete('/:workspaceId/projects/:projectId', requireWorkspaceMembership, requireWorkspaceRole([
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
]), async (req: AuthenticatedRequest, res) => {
  const { workspaceId, projectId } = req.params;

  const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  await prisma.project.delete({ where: { id: projectId } });

  projectEventBus.emitEvent({
    workspaceId,
    projectId,
    type: 'project.deleted',
    actorId: req.user!.id,
  });

  res.status(204).send();
});

router.get('/:workspaceId/projects/:projectId/revisions', requireWorkspaceMembership, async (req, res) => {
  const { workspaceId, projectId } = req.params;

  const revisions = await prisma.projectRevision.findMany({
    where: { workspaceId, projectId },
    orderBy: { number: 'desc' },
    take: 25,
  });

  res.json({ revisions });
});

router.post('/:workspaceId/projects/:projectId/revisions', requireWorkspaceMembership, async (req: AuthenticatedRequest, res) => {
  if (!ensureContributor(req)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }

  const parsed = revisionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { workspaceId, projectId } = req.params;
  const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const nextNumber = project.version + 1;

  const revision = await prisma.projectRevision.create({
    data: {
      projectId,
      workspaceId,
      createdById: req.user!.id,
      number: nextNumber,
      summary: parsed.data.summary ?? 'Manual revision',
      snapshot: parsed.data.snapshot,
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: {
      version: nextNumber,
      currentRevisionId: revision.id,
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    },
  });

  projectEventBus.emitEvent({
    workspaceId,
    projectId,
    type: 'project.revision',
    actorId: req.user!.id,
    data: { version: nextNumber },
    revisionId: revision.id,
  });

  res.status(201).json({ revision, version: nextNumber });
});

router.post('/:workspaceId/projects/:projectId/share', requireWorkspaceMembership, requireWorkspaceRole([
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
]), async (req, res) => {
  const { workspaceId, projectId } = req.params;
  const parsed = shareSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, role = WorkspaceRole.CONTRIBUTOR, expiresInDays = 7 } = parsed.data;

  const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId,
      email,
      role,
      token,
      status: InviteStatus.PENDING,
      expiresAt,
      createdById: req.user!.id,
    },
  });

  res.status(201).json({ invite, projectId });
});

router.post('/:workspaceId/import/legacy', requireWorkspaceMembership, async (req: AuthenticatedRequest, res) => {
  if (!ensureContributor(req)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }

  const parsed = importProjectsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { workspaceId } = req.params;

  const createdProjects = [] as Array<{ id: string; name: string }>;

  for (const project of parsed.data.projects) {
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          workspaceId,
          ownerId: req.user!.id,
          name: project.name,
          description: project.description,
          category: project.category,
          template: project.template,
          color: project.color,
          visibility: project.visibility ?? ProjectVisibility.PRIVATE,
        },
      });

      const revision = await tx.projectRevision.create({
        data: {
          projectId: created.id,
          workspaceId,
          createdById: req.user!.id,
          number: 1,
          summary: project.summary ?? 'Legacy import',
          snapshot: project as unknown as Record<string, unknown>,
        },
      });

      await tx.project.update({
        where: { id: created.id },
        data: {
          currentRevisionId: revision.id,
          version: 1,
        },
      });

      return { created, revision };
    });

    createdProjects.push({ id: result.created.id, name: result.created.name });

    projectEventBus.emitEvent({
      workspaceId,
      projectId: result.created.id,
      type: 'project.created',
      actorId: req.user!.id,
      data: { name: result.created.name, version: 1, legacy: true },
      revisionId: result.revision.id,
    });
  }

  res.status(201).json({ imported: createdProjects.length, projects: createdProjects });
});

export default router;
