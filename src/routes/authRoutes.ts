import { Router } from 'express';

import { login, me, signup } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const authRoutes = Router();

authRoutes.post('/signup', (req, res, next) => {
  void signup(req, res).catch(next);
});

authRoutes.post('/login', (req, res, next) => {
  void login(req, res).catch(next);
});

authRoutes.get('/me', authMiddleware, (req, res, next) => {
  void me(req, res).catch(next);
});
