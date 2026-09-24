import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';

import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { generateToken } from '../utils/generateToken.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isPasswordStrong(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

function publicUser(user: { id: string; name: string; email: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export async function signup(req: Request, res: Response) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name) {
    throw new AppError('Name is required.', 400);
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new AppError('A valid email is required.', 400);
  }
  if (!isPasswordStrong(password)) {
    throw new AppError(
      'Password must be at least 8 characters, with one uppercase letter and one number.',
      400,
    );
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  const safeUser = publicUser({
    id: String(user._id),
    name: user.name,
    email: user.email,
  });

  res.status(201).json({
    success: true,
    data: {
      user: safeUser,
      token: generateToken(safeUser.id),
    },
  });
}

export async function login(req: Request, res: Response) {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !matches) {
    throw new AppError('Invalid email or password.', 401);
  }

  const safeUser = publicUser({
    id: String(user._id),
    name: user.name,
    email: user.email,
  });

  res.json({
    success: true,
    data: {
      user: safeUser,
      token: generateToken(safeUser.id),
    },
  });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new AppError('Unauthorized.', 401);
  }

  res.json({
    success: true,
    data: {
      user: publicUser({
        id: String(user._id),
        name: user.name,
        email: user.email,
      }),
    },
  });
}
