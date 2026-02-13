import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from '../auth/jwt';
import { UserRole } from '../types/database';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export async function authenticate(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload;
}

export function requireAuth(
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    (request as AuthenticatedRequest).user = user;
    return handler(request as AuthenticatedRequest, context);
  };
}

export function requireRole(roles: UserRole[]) {
  return function (
    handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context?: any) => {
      const user = await authenticate(request);

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (!roles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      (request as AuthenticatedRequest).user = user;
      return handler(request as AuthenticatedRequest, context);
    };
  };
}
