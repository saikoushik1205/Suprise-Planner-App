import type { NextFunction, Request, Response } from 'express';

import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function requireApprovedCrew(req: Request, _res: Response, next: NextFunction) {
  if (!req.userId) {
    next(new AppError('Unauthorized.', 401));
    return;
  }

  const user = await User.findById(req.userId);
  if (!user) {
    next(new AppError('Unauthorized.', 401));
    return;
  }

  const role = user.role ?? 'customer';
  if (role !== 'crew') {
    next(new AppError('Crew access only.', 403));
    return;
  }

  if (user.crewStatus === 'pending') {
    next(
      new AppError(
        'Your Crew registration is currently under review. We\'ll get back to you once your registration has been reviewed.',
        403,
      ),
    );
    return;
  }

  if (user.crewStatus === 'rejected') {
    next(new AppError('Your Crew registration was not approved.', 403));
    return;
  }

  if (user.crewStatus === 'suspended') {
    next(new AppError('Your Crew account is suspended.', 403));
    return;
  }

  if (user.crewStatus !== 'approved') {
    next(
      new AppError(
        'Your Crew registration is currently under review. We\'ll get back to you once your registration has been reviewed.',
        403,
      ),
    );
    return;
  }

  next();
}
