import type { Request, Response } from 'express';

import { serializeSurprise } from './surpriseController.js';
import { Surprise } from '../models/Surprise.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function getCrewMe(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new AppError('Unauthorized.', 401);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role ?? 'crew',
        crewStatus: user.crewStatus ?? 'approved',
        phone: user.phone,
        city: user.city,
      },
    },
  });
}

export async function listAssignedSurprises(req: Request, res: Response) {
  if (!req.userId) {
    throw new AppError('Unauthorized.', 401);
  }

  const surprises = await Surprise.find({ assignedCrewId: req.userId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: surprises.map((item) => serializeSurprise(item)),
  });
}
