import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import type { WorkspaceRole } from '@prisma/client';

export interface WorkspaceMembershipToken {
  workspaceId: string;
  role: WorkspaceRole;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name?: string | null;
  activeWorkspaceId?: string;
  memberships: WorkspaceMembershipToken[];
  tokenVersion?: number;
}

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL ?? '15m';
const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 60 * 60 * 24 * 14);

const getAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }
    return 'dev-access-secret';
  }
  return secret;
};

export const createAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_TTL,
    subject: payload.sub,
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, getAccessSecret()) as AccessTokenPayload;
};

export const createRefreshTokenString = (): string => {
  return randomBytes(48).toString('hex');
};

export const refreshTokenExpiresAt = (): Date => {
  const expires = new Date();
  expires.setSeconds(expires.getSeconds() + REFRESH_TOKEN_TTL_SECONDS);
  return expires;
};
