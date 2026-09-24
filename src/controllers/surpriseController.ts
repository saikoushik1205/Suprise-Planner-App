import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';

import { Surprise, type SurpriseStatus } from '../models/Surprise.js';
import { AppError } from '../utils/AppError.js';

const FRONTEND_STATUS: Record<string, SurpriseStatus> = {
  draft: 'planned',
  planned: 'planned',
  'in-progress': 'in-progress',
  launched: 'in-progress',
  completed: 'completed',
};

function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function serializeSurprise(item: {
  id?: string;
  _id?: unknown;
  title: string;
  recipientName: string;
  occasion: string;
  date: Date;
  budget: number;
  description: string;
  status: SurpriseStatus;
  city?: string;
  relationship?: string;
  createdAt: Date;
}) {
  return {
    id: item.id ?? String(item._id),
    title: item.title,
    recipientName: item.recipientName,
    occasion: item.occasion,
    date: toDateKey(item.date),
    budget: item.budget,
    description: item.description,
    status: item.status,
    city: item.city,
    relationship: item.relationship,
    createdAt: item.createdAt.toISOString(),
  };
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseStatus(value: unknown): SurpriseStatus | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  return FRONTEND_STATUS[value.trim().toLowerCase()];
}

function readUserId(req: Request): string {
  if (!req.userId) {
    throw new AppError('Unauthorized.', 401);
  }
  return req.userId;
}

function readOwnedSurpriseId(req: Request): string {
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id || !isValidObjectId(id)) {
    throw new AppError('Surprise not found.', 404);
  }
  return id;
}

async function findOwnedSurprise(id: string, userId: string) {
  const surprise = await Surprise.findOne({ _id: id, userId });
  if (!surprise) {
    throw new AppError('Surprise not found.', 404);
  }
  return surprise;
}

function readCreateInput(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const recipientName =
    typeof body.recipientName === 'string'
      ? body.recipientName.trim()
      : typeof body.recipient === 'string'
        ? body.recipient.trim()
        : '';
  const occasion = typeof body.occasion === 'string' ? body.occasion.trim() : '';
  const date = parseDate(body.date);
  const budget = typeof body.budget === 'number' ? body.budget : Number(body.budget);
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const parsedStatus = parseStatus(body.status);
  if (body.status != null && body.status !== '' && !parsedStatus) {
    throw new AppError('Invalid status.', 400);
  }
  const status = parsedStatus ?? 'planned';
  const city = typeof body.city === 'string' ? body.city.trim() : undefined;
  const relationship = typeof body.relationship === 'string' ? body.relationship.trim() : undefined;

  if (!title) {
    throw new AppError('Title is required.', 400);
  }
  if (!recipientName) {
    throw new AppError('Recipient name is required.', 400);
  }
  if (!occasion) {
    throw new AppError('Occasion is required.', 400);
  }
  if (!date) {
    throw new AppError('A valid date is required.', 400);
  }
  if (!Number.isFinite(budget) || budget < 0) {
    throw new AppError('Budget must be a valid number.', 400);
  }

  return { title, recipientName, occasion, date, budget, description, status, city, relationship };
}

export async function createSurprise(req: Request, res: Response) {
  const userId = readUserId(req);
  const input = readCreateInput(req.body ?? {});
  const surprise = await Surprise.create({ ...input, userId });

  res.status(201).json({
    success: true,
    data: serializeSurprise(surprise),
  });
}

export async function listSurprises(req: Request, res: Response) {
  const userId = readUserId(req);
  const surprises = await Surprise.find({ userId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: surprises.map((item) => serializeSurprise(item)),
  });
}

export async function getSurprise(req: Request, res: Response) {
  const userId = readUserId(req);
  const surprise = await findOwnedSurprise(readOwnedSurpriseId(req), userId);

  res.json({
    success: true,
    data: serializeSurprise(surprise),
  });
}

export async function updateSurprise(req: Request, res: Response) {
  const userId = readUserId(req);
  const surprise = await findOwnedSurprise(readOwnedSurpriseId(req), userId);
  const input = readCreateInput(req.body ?? {});

  surprise.title = input.title;
  surprise.recipientName = input.recipientName;
  surprise.occasion = input.occasion;
  surprise.date = input.date;
  surprise.budget = input.budget;
  surprise.description = input.description;
  surprise.status = input.status;
  surprise.city = input.city;
  surprise.relationship = input.relationship;
  await surprise.save();

  res.json({
    success: true,
    data: serializeSurprise(surprise),
  });
}

export async function deleteSurprise(req: Request, res: Response) {
  const userId = readUserId(req);
  const surprise = await findOwnedSurprise(readOwnedSurpriseId(req), userId);
  await surprise.deleteOne();

  res.json({
    success: true,
    data: {
      message: 'Surprise deleted.',
    },
  });
}
