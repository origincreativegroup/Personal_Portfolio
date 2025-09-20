import type { Request, Response, NextFunction } from 'express';
import type { WorkspaceRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { verifyAccessToken } from '../utils/tokenService';

export interface AuthenticatedRequest extends Request {
  user?: NonNullable<Request['user']>;
  workspace?: { id: string; role: WorkspaceRole };
}

const extractBearerToken = (headerValue: string | undefined): string | null => {
  if (!headerValue) return null;
  if (!headerValue.toLowerCase().startsWith('bearer ')) return null;
  return headerValue.slice(7).trim();
};

export const authenticate = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  const headerToken = extractBearerToken(req.header('authorization') ?? req.header('Authorization'));
  const queryToken = typeof req.query.access_token === 'string'
    ? req.query.access_token
    : typeof req.query.token === 'string'
      ? req.query.token
      : null;
  const token = headerToken ?? queryToken ?? null;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: true,
      },
    });

    if (!user) {
      next();
      return;
    }

    const memberships = user.memberships.map((membership) => ({
      workspaceId: membership.workspaceId,
      role: membership.role,
    }));

    const activeWorkspaceId = payload.activeWorkspaceId
      ?? req.query.workspaceId?.toString()
      ?? memberships[0]?.workspaceId;

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      workspaceMemberships: memberships,
      activeWorkspaceId,
      tokenVersion: payload.tokenVersion,
    };
  } catch (error) {
    console.warn('Failed to authenticate access token', error);
  }

  next();
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
};

export const requireWorkspaceMembership = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const workspaceId = (req.params.workspaceId ?? req.user.activeWorkspaceId ?? req.query.workspaceId)?.toString();

  if (!workspaceId) {
    res.status(400).json({ error: 'Workspace is required' });
    return;
  }

  const membership = req.user.workspaceMemberships?.find((m) => m.workspaceId === workspaceId);

  if (!membership) {
    res.status(403).json({ error: 'Forbidden: workspace access denied' });
    return;
  }

  req.workspace = {
    id: workspaceId,
    role: membership.role,
  };

  next();
};

export const requireWorkspaceRole = (roles: WorkspaceRole[]) => (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.workspace) {
    res.status(400).json({ error: 'Workspace context missing' });
    return;
  }

  if (!roles.includes(req.workspace.role)) {
    res.status(403).json({ error: 'Insufficient workspace permissions' });
    return;
  }

  next();
};
