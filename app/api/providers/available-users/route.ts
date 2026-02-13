import { NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';

export const GET = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const users = await query<any[]>(
        `SELECT
           id,
           email,
           phone,
           first_name,
           last_name,
           status
         FROM users
         WHERE tenant_id = ?
           AND role = 'provider'
         ORDER BY created_at DESC`,
        [request.user!.tenantId]
      );

      return NextResponse.json({
        users: users.map(u => ({
          id: u.id,
          name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
          email: u.email,
          phone: u.phone,
          status: u.status,
        })),
      });
    } catch (error) {
      console.error('Get provider users error:', error);
      return NextResponse.json(
        { error: 'Failed to get provider users' },
        { status: 500 }
      );
    }
  }
);

