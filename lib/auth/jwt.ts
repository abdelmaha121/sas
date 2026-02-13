import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '../types/database';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface JWTPayload {
  providerId: any;
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function setAuthCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60;
  return `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`;
}

export function clearAuthCookie(): string {
  return 'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/';
}
