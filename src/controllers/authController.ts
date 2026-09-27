import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';

import { TEST_CREW, TEST_CUSTOMER } from '../config/testAccounts.js';
import { User, type CrewStatus, type UserRole } from '../models/User.js';
import { seedTestAccounts } from '../services/seedTestAccounts.js';
import { AppError } from '../utils/AppError.js';
import { generateToken } from '../utils/generateToken.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isPasswordStrong(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

function readRole(value: unknown): UserRole {
  return value === 'crew' ? 'crew' : 'customer';
}

function readRequestedRole(value: unknown): UserRole | undefined {
  if (value === 'crew' || value === 'customer') {
    return value;
  }
  return undefined;
}

function officialTestPassword(email: string): string | undefined {
  if (email === TEST_CREW.email) {
    return TEST_CREW.password;
  }
  if (email === TEST_CUSTOMER.email) {
    return TEST_CUSTOMER.password;
  }
  return undefined;
}

async function refreshOfficialTestAccount(email: string, password: string) {
  if (officialTestPassword(email) !== password) {
    return;
  }

  try {
    await seedTestAccounts();
  } catch (error) {
    console.error('Failed to refresh sandbox test accounts.', error);
  }
}

function denyCrewAccess(status: CrewStatus | undefined): never {
  if (status === 'rejected') {
    throw new AppError('Your Crew registration was not approved.', 403);
  }
  if (status === 'suspended') {
    throw new AppError('Your Crew account is suspended.', 403);
  }
  throw new AppError(
    'Your Crew registration is currently under review. We\'ll get back to you once your registration has been reviewed.',
    403,
  );
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  crewStatus?: CrewStatus;
  phone?: string;
  city?: string;
}) {
  const role = user.role ?? 'customer';
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    crewStatus: role === 'crew' ? user.crewStatus ?? 'pending' : null,
    phone: user.phone,
    city: user.city,
  };
}

export async function signup(req: Request, res: Response) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const role = readRole(req.body?.role);
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const city = typeof req.body?.city === 'string' ? req.body.city.trim() : '';
  const crewCategory = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
  const crewExperience = typeof req.body?.experience === 'string' ? req.body.experience.trim() : '';

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

  if (role === 'crew') {
    if (phone.replace(/\D/g, '').length < 8) {
      throw new AppError('A valid phone number is required.', 400);
    }
    if (city.length < 2) {
      throw new AppError('City / service area is required.', 400);
    }
    if (!crewCategory) {
      throw new AppError('Please select a crew category.', 400);
    }
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    ...(role === 'crew'
      ? {
          crewStatus: 'pending' as const,
          phone,
          city,
          crewCategory,
          crewExperience,
        }
      : {}),
  });

  const safeUser = publicUser({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    crewStatus: user.crewStatus,
    phone: user.phone,
    city: user.city,
  });

  if (role === 'crew') {
    res.status(201).json({
      success: true,
      data: {
        user: safeUser,
      },
    });
    return;
  }

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
  const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
  const requestedRole = readRequestedRole(req.body?.role);

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  await refreshOfficialTestAccount(email, password);

  const user = await User.findOne({ email }).select('+passwordHash');
  const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !matches) {
    throw new AppError('Invalid email or password.', 401);
  }

  const role = user.role ?? 'customer';
  if (requestedRole && requestedRole !== role) {
    throw new AppError(
      requestedRole === 'crew'
        ? 'This is a customer account. Use the crew sandbox login from Continue as Crew.'
        : 'This is a crew account. Sign in from Continue as Crew.',
      403,
    );
  }
  if (role === 'crew' && user.crewStatus !== 'approved') {
    denyCrewAccess(user.crewStatus);
  }

  const safeUser = publicUser({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role,
    crewStatus: user.crewStatus,
    phone: user.phone,
    city: user.city,
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
        role: user.role,
        crewStatus: user.crewStatus,
        phone: user.phone,
        city: user.city,
      }),
    },
  });
}
