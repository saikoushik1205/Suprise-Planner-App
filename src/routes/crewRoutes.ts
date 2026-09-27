import { Router } from 'express';

import { getCrewMe, listAssignedSurprises } from '../controllers/crewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireApprovedCrew } from '../middleware/requireApprovedCrew.js';

export const crewRoutes = Router();

crewRoutes.use(authMiddleware, (req, res, next) => {
  void requireApprovedCrew(req, res, next).catch(next);
});

crewRoutes.get('/me', (req, res, next) => {
  void getCrewMe(req, res).catch(next);
});

crewRoutes.get('/surprises', (req, res, next) => {
  void listAssignedSurprises(req, res).catch(next);
});
