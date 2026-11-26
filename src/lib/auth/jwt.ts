import jwt from 'jsonwebtoken';
import type { Role } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'welfare-hospital-secure-jwt-secret-key-2026-prod';
const TOKEN_EXPIRY = '8h';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function extractBearerToken(authHeader?: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
}

export function extractCookieToken(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/welfare_admin_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
