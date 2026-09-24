import { Router } from 'express';

import {
  createSurprise,
  deleteSurprise,
  getSurprise,
  listSurprises,
  updateSurprise,
} from '../controllers/surpriseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const surpriseRoutes = Router();

surpriseRoutes.use(authMiddleware);

surpriseRoutes.post('/', (req, res, next) => {
  void createSurprise(req, res).catch(next);
});

surpriseRoutes.get('/', (req, res, next) => {
  void listSurprises(req, res).catch(next);
});

surpriseRoutes.get('/:id', (req, res, next) => {
  void getSurprise(req, res).catch(next);
});

surpriseRoutes.put('/:id', (req, res, next) => {
  void updateSurprise(req, res).catch(next);
});

surpriseRoutes.delete('/:id', (req, res, next) => {
  void deleteSurprise(req, res).catch(next);
});
