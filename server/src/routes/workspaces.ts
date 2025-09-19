import express from 'express';
import { z } from 'zod';
import { WorkspaceRole, InviteStatus, MembershipStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  requireWorkspaceMembership,
  requireWorkspaceRole,
  type AuthenticatedRequest,
} from '../middleware/auth';
import {
  createAccessToken,
  type WorkspaceMembershipToken,
} from '../utils/tokenService';
import { randomBytes } from 'crypto';

const router = express.Router();

const workspaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/i).optional(),
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(WorkspaceRole).optional(),
  expiresInDays: z.number().min(1).max(30).optional(),
});

const membershipSummary = (memberships: Array<{ workspaceId: string; role: WorkspaceRole }>): WorkspaceMembershipToken[] =>
  memberships.map((membership) => ({
    workspaceId: membership.workspaceId,
    role: membership.role,
  }));

const fetchMemberships = async (userId: string) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId, status: MembershipStatus.ACTIVE },
    include: {
      workspace: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return memberships;
};

router.get('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const memberships = await fetchMemberships(userId);

  res.json({
    workspaces: memberships.map((membership) => ({
      id: membership.workspaceId,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role,
      joinedAt: membership.createdAt,
    })),
    activeWorkspaceId: req.user?.activeWorkspaceId ?? memberships[0]?.workspaceId ?? null,
  });
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = workspaceSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { name, slug } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name,
        slug,
        createdById: req.user!.id,
      },
    });

    const membership = await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: req.user!.id,
        role: WorkspaceRole.OWNER,
      },
    });

    return { workspace, membership };
  });

  const memberships = await fetchMemberships(req.user!.id);
  const tokens = membershipSummary(memberships.map(({ workspaceId, role }) => ({ workspaceId, role })));
  const accessToken = createAccessToken({
    sub: req.user!.id,
    email: req.user!.email,
    name: req.user!.name ?? null,
    memberships: tokens,
    activeWorkspaceId: result.workspace.id,
  });

  res.status(201).json({
    workspace: {
      id: result.workspace.id,
      name: result.workspace.name,
      slug: result.workspace.slug,
      role: result.membership.role,
    },
    accessToken,
    workspaces: memberships.map((membership) => ({
      id: membership.workspaceId,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role,
    })),
    activeWorkspaceId: result.workspace.id,
  });
});

router.get('/:workspaceId', requireWorkspaceMembership, async (req: AuthenticatedRequest, res) => {
  const { workspaceId } = req.params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      memberships: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!workspace) {
    res.status(404).json({ error: 'Workspace not found' });
    return;
  }

  res.json({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    members: workspace.memberships.map((member) => ({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      status: member.status,
      joinedAt: member.createdAt,
    })),
  });
});

router.get('/:workspaceId/invites', requireWorkspaceMembership, requireWorkspaceRole([
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
]), async (req, res) => {
  const { workspaceId } = req.params;

  const invites = await prisma.workspaceInvite.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ invites });
});

router.post('/:workspaceId/invites', requireWorkspaceMembership, requireWorkspaceRole([
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
]), async (req, res) => {
  const { workspaceId } = req.params;
  const parsed = inviteSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, role = WorkspaceRole.CONTRIBUTOR, expiresInDays = 7 } = parsed.data;

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

  res.status(201).json({ invite });
});

router.post('/:workspaceId/invites/:token/cancel', requireWorkspaceMembership, requireWorkspaceRole([
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
]), async (req, res) => {
  const { workspaceId, token } = req.params;

  await prisma.workspaceInvite.updateMany({
    where: { workspaceId, token },
    data: { status: InviteStatus.CANCELLED },
  });

  res.status(204).send();
});

router.post('/invites/:token/accept', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Authentication required to accept invite' });
    return;
  }

  const { token } = req.params;

  const invite = await prisma.workspaceInvite.findUnique({ where: { token } });

  if (!invite || invite.status !== InviteStatus.PENDING || invite.expiresAt < new Date()) {
    res.status(404).json({ error: 'Invite not found or expired' });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspaceInvite.update({
      where: { token },
      data: {
        status: InviteStatus.ACCEPTED,
        acceptedById: req.user!.id,
      },
    });

    await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: req.user!.id,
        },
      },
      create: {
        workspaceId: invite.workspaceId,
        userId: req.user!.id,
        role: invite.role,
        status: MembershipStatus.ACTIVE,
      },
      update: {
        status: MembershipStatus.ACTIVE,
        role: invite.role,
      },
    });
  });

  const memberships = await fetchMemberships(req.user!.id);
  const tokens = membershipSummary(memberships.map(({ workspaceId, role }) => ({ workspaceId, role })));
  const accessToken = createAccessToken({
    sub: req.user!.id,
    email: req.user!.email,
    name: req.user!.name ?? null,
    memberships: tokens,
    activeWorkspaceId: invite.workspaceId,
  });

  res.json({
    accessToken,
    workspaces: memberships.map((membership) => ({
      id: membership.workspaceId,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role,
    })),
    activeWorkspaceId: invite.workspaceId,
  });
});

router.post('/:workspaceId/switch', requireWorkspaceMembership, async (req: AuthenticatedRequest, res) => {
  const { workspaceId } = req.params;
  const memberships = await fetchMemberships(req.user!.id);
  const tokens = membershipSummary(memberships.map(({ workspaceId: id, role }) => ({ workspaceId: id, role })));
  const accessToken = createAccessToken({
    sub: req.user!.id,
    email: req.user!.email,
    name: req.user!.name ?? null,
    memberships: tokens,
    activeWorkspaceId: workspaceId,
  });

  res.json({
    accessToken,
    activeWorkspaceId: workspaceId,
  });
});

export default router;
