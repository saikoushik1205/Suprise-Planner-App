import { Router } from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireApprovedCrew } from '../middleware/requireApprovedCrew.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const crewRoutes = Router();

crewRoutes.get('/me', authMiddleware, (req, res, next) => {
  void requireApprovedCrew(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }
    void User.findById(req.userId)
      .then((user) => {
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
            },
          },
        });
      })
      .catch(next);
  });
});
