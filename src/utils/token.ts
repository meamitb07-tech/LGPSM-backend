import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../models/User';

export interface TokenPayload {
  userId: string;
  role: Role;
  type: 'access' | 'refresh';
}

export function generateAccessToken(userId: string, role: Role): string {
  const payload: TokenPayload = { userId, role, type: 'access' };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

export function generateRefreshToken(userId: string, role: Role): string {
  const payload: TokenPayload = { userId, role, type: 'refresh' };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
}
