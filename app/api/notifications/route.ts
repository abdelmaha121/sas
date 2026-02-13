import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';

export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)); // Validate limit
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const offset = Math.max(0, (page - 1) * limit);

    // إعداد شروط WHERE
    const whereConditions: string[] = ['user_id = ?', 'tenant_id = ?'];
    const params: any[] = [request.user!.userId, request.user!.tenantId];

    if (unreadOnly) {
      whereConditions.push('is_read = ?');
      params.push(0);
    }

    const whereClause = whereConditions.join(' AND ');

    // Build complete param arrays for each query
    const notificationsParams = [...params, limit, offset];
    const countParams = [...params];
    const unreadParams = [request.user!.userId, request.user!.tenantId];

    // استعلامات
    const [notifications, countResult, unreadCount] = await Promise.all([
      query<any[]>(
        `SELECT * FROM notifications
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        notificationsParams
      ),
      query<any[]>(
        `SELECT COUNT(*) as total
         FROM notifications
         WHERE ${whereClause}`,
        countParams
      ),
      query<any[]>(
        `SELECT COUNT(*) as total
         FROM notifications
         WHERE user_id = ? AND tenant_id = ? AND is_read = 0`,
        unreadParams
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount: unreadCount[0]?.total || 0,
        pagination: {
          total: countResult[0]?.total || 0,
          page,
          limit,
          totalPages: Math.ceil((countResult[0]?.total || 0) / limit),
        },
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
});
