import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { User } from '@/lib/types/database';

export async function GET(request: NextRequest) {
  try {
    const authUser = await authenticate(request);

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = await query<User[]>(
      `SELECT id, tenant_id, email, phone, address, first_name, last_name, role,
              status, avatar_url, preferences, last_login_at, created_at
       FROM users
       WHERE id = ? AND tenant_id = ?
       LIMIT 1`,
      [authUser.userId, authUser.tenantId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        address: user.address,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatar_url,
        preferences: user.preferences,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
