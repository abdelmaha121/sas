import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db/mysql';
import { hashPassword } from '@/lib/auth/password';
import { createToken, setAuthCookie } from '@/lib/auth/jwt';
import { getTenantFromRequest } from '@/lib/middleware/tenant';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';
import { User, UserRole } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, role = 'customer' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 400 }
      );
    }

    const existingUser = await query<User[]>(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ? LIMIT 1',
      [email, tenant.id]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const userId = uuidv4();
    const passwordHash = await hashPassword(password);

    await query(
      `INSERT INTO users (
        id, tenant_id, email, password_hash, first_name, last_name,
        phone, role, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        tenant.id,
        email,
        passwordHash,
        firstName || null,
        lastName || null,
        phone || null,
        role,
        'active',
      ]
    );

    const token = await createToken({
      userId,
      tenantId: tenant.id,
      email,
      role: role as UserRole,
    });

    const clientInfo = extractClientInfo(request);
    await createAuditLog({
      tenantId: tenant.id,
      userId,
      action: 'user.register',
      resourceType: 'user',
      resourceId: userId,
      ...clientInfo,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: userId,
          email,
          firstName,
          lastName,
          role,
        },
      },
      { status: 201 }
    );

    response.headers.set('Set-Cookie', setAuthCookie(token));

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
