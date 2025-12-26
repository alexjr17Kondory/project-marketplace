import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
}

export function generateToken(payload: JwtPayload): string {
  const secret = env.JWT_SECRET;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt as any).sign(payload, secret, { expiresIn: '30d' });
}

export function verifyToken(token: string): JwtPayload {
  const secret = env.JWT_SECRET;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt as any).verify(token, secret) as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (jwt as any).decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
