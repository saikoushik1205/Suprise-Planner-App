import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/generateToken.js';

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError('Unauthorized.', 401));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(new AppError('Unauthorized.', 401));
    return;
  }

  try {
    const { userId } = verifyToken(token);
    req.userId = userId;
    next();
  } catch {
    next(new AppError('Unauthorized.', 401));
  }
}
