import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';

export const PUT = requireAuth(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      await query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE id = ? AND user_id = ? AND tenant_id = ?`,
        [params.id, request.user!.userId, request.user!.tenantId]
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }
  }
);
