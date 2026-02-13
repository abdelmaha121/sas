import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

async function getProviderId(userId: string, tenantId: string): Promise<string | null> {
  const providers = await query<any[]>(
    'SELECT id FROM service_providers WHERE user_id = ? AND tenant_id = ? LIMIT 1',
    [userId, tenantId]
  );
  return providers.length > 0 ? providers[0].id : null;
}

export const PUT = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const providerId = await getProviderId(request.user!.userId, request.user!.tenantId);

      if (!providerId) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }

      const body = await request.json();
      const { status } = body;

      if (!status) {
        return NextResponse.json(
          { error: 'Status is required' },
          { status: 400 }
        );
      }

      const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }

      const bookings = await query<any[]>(
        'SELECT id, status FROM bookings WHERE id = ? AND provider_id = ? AND tenant_id = ? LIMIT 1',
        [params.id, providerId, request.user!.tenantId]
      );

      if (bookings.length === 0) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      const updates = ['status = ?'];
      const values: any[] = [status];

      if (status === 'completed') {
        updates.push('completed_at = NOW()');
      }

      await query(
        `UPDATE bookings
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = ? AND provider_id = ? AND tenant_id = ?`,
        [...values, params.id, providerId, request.user!.tenantId]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'provider.booking.update_status',
        resourceType: 'booking',
        resourceId: params.id,
        changes: { status, previousStatus: bookings[0].status },
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update booking status error:', error);
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      );
    }
  }
);
