import 'express';
import type { WorkspaceRole } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name?: string | null;
      activeWorkspaceId?: string;
      workspaceMemberships?: Array<{
        workspaceId: string;
        role: WorkspaceRole;
      }>;
      tokenVersion?: number;
    };
    workspace?: {
      id: string;
      role: WorkspaceRole;
    };
  }
}
