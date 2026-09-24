import jwt from 'jsonwebtoken';

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  const payload = jwt.verify(token, secret);
  if (typeof payload !== 'object' || payload === null || typeof payload.userId !== 'string') {
    throw new Error('Invalid token payload.');
  }

  return { userId: payload.userId };
}
