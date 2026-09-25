import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../models/User';

export interface TokenPayload {
  userId: string;
  role: Role;
  type: 'access' | 'refresh' | 'reset';
}

export function generateAccessToken(userId: string, role: Role): string {
  const payload: TokenPayload = { userId, role, type: 'access' };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

export function generateRefreshToken(userId: string, role: Role): string {
  const payload: TokenPayload & { nonce: string } = { userId, role, type: 'refresh', nonce: Math.random().toString(36).substring(2) };
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

// Single-purpose password reset token; it cannot be used as an API access token
export function generatePasswordResetToken(userId: string, role: Role): string {
  const payload: TokenPayload = { userId, role, type: 'reset' };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
}

export function verifyPasswordResetToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  if (decoded.type !== 'reset') {
    throw new Error('Invalid token type');
  }
  return decoded;
}
