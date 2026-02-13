import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

export const GET = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const bookings = await query<any[]>(
        `SELECT b.*,
                c.email as customer_email, c.first_name as customer_first_name,
                c.last_name as customer_last_name, c.phone as customer_phone,
                sp.business_name as provider_name, sp.id as provider_id,
                s.name as service_name, s.description as service_description
         FROM bookings b
         JOIN users c ON b.customer_id = c.id
         JOIN service_providers sp ON b.provider_id = sp.id
         JOIN services s ON b.service_id = s.id
         WHERE b.id = ? AND b.tenant_id = ?
         LIMIT 1`,
        [params.id, request.user!.tenantId]
      );

      if (bookings.length === 0) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ booking: bookings[0] });
    } catch (error) {
      console.error('Get booking error:', error);
      return NextResponse.json(
        { error: 'Failed to get booking' },
        { status: 500 }
      );
    }
  }
);

export const PUT = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const body = await request.json();
      const { status, paymentStatus, notes } = body;

      const updates: string[] = [];
      const values: any[] = [];

      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);

        if (status === 'completed') {
          updates.push('completed_at = NOW()');
        }
      }

      if (paymentStatus !== undefined) {
        updates.push('payment_status = ?');
        values.push(paymentStatus);
      }

      if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes);
      }

      if (updates.length > 0) {
        await query(
          `UPDATE bookings
           SET ${updates.join(', ')}, updated_at = NOW()
           WHERE id = ? AND tenant_id = ?`,
          [...values, params.id, request.user!.tenantId]
        );

        const clientInfo = extractClientInfo(request);
        await createAuditLog({
          tenantId: request.user!.tenantId,
          userId: request.user!.userId,
          action: 'admin.booking.update',
          resourceType: 'booking',
          resourceId: params.id,
          changes: body,
          ...clientInfo,
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update booking error:', error);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }
  }
);
