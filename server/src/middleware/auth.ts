import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: unknown;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
};
