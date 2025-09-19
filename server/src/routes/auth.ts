import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { WorkspaceRole } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  createAccessToken,
  createRefreshTokenString,
  refreshTokenExpiresAt,
  type WorkspaceMembershipToken,
} from '../utils/tokenService';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  workspaceName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  workspaceId: z.string().optional(),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

const formatMemberships = (memberships: Array<{ workspaceId: string; role: WorkspaceRole; workspace: { id: string; name: string; slug: string | null } }>) => {
  return memberships.map((membership) => ({
    id: membership.workspaceId,
    name: membership.workspace.name,
    slug: membership.workspace.slug,
    role: membership.role,
  }));
};

const createTokenPayload = (
  user: { id: string; email: string; name: string | null },
  memberships: WorkspaceMembershipToken[],
  activeWorkspaceId?: string,
) => {
  return createAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    memberships,
    activeWorkspaceId,
  });
};

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password, name, workspaceName } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: workspaceName ?? `${user.name ?? user.email.split('@')[0]}'s Workspace`,
        createdById: user.id,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: WorkspaceRole.OWNER,
      },
    });

    return { user, workspace };
  });

  const refreshToken = createRefreshTokenString();
  const refreshExpiresAt = refreshTokenExpiresAt();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: result.user.id,
      expiresAt: refreshExpiresAt,
    },
  });

  const memberships: WorkspaceMembershipToken[] = [
    {
      workspaceId: result.workspace.id,
      role: WorkspaceRole.OWNER,
    },
  ];

  const accessToken = createTokenPayload(result.user, memberships, result.workspace.id);

  res
    .cookie('refresh_token', refreshToken, { ...cookieOptions, expires: refreshExpiresAt })
    .status(201)
    .json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      accessToken,
      workspaces: [
        {
          id: result.workspace.id,
          name: result.workspace.name,
          role: WorkspaceRole.OWNER,
          slug: result.workspace.slug,
        },
      ],
      activeWorkspaceId: result.workspace.id,
    });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password, workspaceId } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordsMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const memberships = user.memberships.map((membership) => ({
    workspaceId: membership.workspaceId,
    role: membership.role,
  }));

  const workspaceSummaries = formatMemberships(user.memberships);
  const resolvedActiveWorkspaceId = workspaceId
    ?? user.memberships[0]?.workspaceId;

  if (!resolvedActiveWorkspaceId) {
    res.status(409).json({ error: 'User has no workspace membership' });
    return;
  }

  const refreshToken = createRefreshTokenString();
  const expiresAt = refreshTokenExpiresAt();

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    }),
  ]);

  const accessToken = createTokenPayload(user, memberships, resolvedActiveWorkspaceId);

  res
    .cookie('refresh_token', refreshToken, { ...cookieOptions, expires: expiresAt })
    .json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      workspaces: workspaceSummaries,
      activeWorkspaceId: resolvedActiveWorkspaceId,
    });
});

router.post('/refresh', async (req: AuthenticatedRequest, res) => {
  const refreshToken = req.cookies?.refresh_token ?? req.body?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ error: 'Refresh token missing' });
    return;
  }

  const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    res.status(401).json({ error: 'Refresh token invalid' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: storedToken.userId },
    include: {
      memberships: {
        include: { workspace: true },
      },
    },
  });

  if (!user) {
    res.status(401).json({ error: 'Refresh token invalid' });
    return;
  }

  const memberships = user.memberships.map((membership) => ({
    workspaceId: membership.workspaceId,
    role: membership.role,
  }));

  const workspaceSummaries = formatMemberships(user.memberships);
  const activeWorkspaceId = req.body?.workspaceId
    ?? req.query?.workspaceId?.toString()
    ?? user.memberships[0]?.workspaceId;

  const accessToken = createTokenPayload(user, memberships, activeWorkspaceId);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    accessToken,
    workspaces: workspaceSummaries,
    activeWorkspaceId,
  });
});

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token ?? req.body?.refreshToken;

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }

  res
    .clearCookie('refresh_token', cookieOptions)
    .status(204)
    .send();
});

export default router;
