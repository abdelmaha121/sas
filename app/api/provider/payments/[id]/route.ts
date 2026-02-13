import { NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

/* ================================
   Helper: Get Provider ID
================================ */
async function getProviderId(userId: string, tenantId: string): Promise<string | null> {
  const rows = await query<any[]>(
    'SELECT id FROM service_providers WHERE user_id = ? AND tenant_id = ? LIMIT 1',
    [userId, tenantId]
  );
  return rows.length ? rows[0].id : null;
}

/* ================================
   GET – تفاصيل دفعة واحدة
================================ */
export const GET = requireRole(['provider', 'admin', 'super_admin'])(
  async (
    request: AuthenticatedRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const providerId = await getProviderId(
        request.user!.userId,
        request.user!.tenantId
      );

      if (!providerId) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      const payments = await query<any[]>(
        `
        SELECT
          p.*,
          b.scheduled_at,
          b.status AS booking_status,
          u.first_name AS customer_first_name,
          u.last_name AS customer_last_name,
          u.email AS customer_email,
          s.name AS service_name,
          s.name_ar AS service_name_ar
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN users u ON p.user_id = u.id
        JOIN services s ON b.service_id = s.id
        WHERE p.id = ?
          AND p.tenant_id = ?
          AND b.provider_id = ?
        LIMIT 1
        `,
        [params.id, request.user!.tenantId, providerId]
      );

      if (payments.length === 0) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ payment: payments[0] });
    } catch (error) {
      console.error('Get payment error:', error);
      return NextResponse.json(
        { error: 'Failed to get payment' },
        { status: 500 }
      );
    }
  }
);

/* ================================
   PUT – تحديث دفعة واحدة
================================ */
export const PUT = requireRole(['provider', 'admin', 'super_admin'])(
  async (
    request: AuthenticatedRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const providerId = await getProviderId(
        request.user!.userId,
        request.user!.tenantId
      );

      if (!providerId) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      const body = await request.json();
      const { status, paymentGatewayReference, metadata } = body;

      if (!status) {
        return NextResponse.json(
          { error: 'Status is required' },
          { status: 400 }
        );
      }

      const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid payment status' },
          { status: 400 }
        );
      }

      /** تحقق أن الدفعة تخص هذا المزود */
      const rows = await query<any[]>(
        `
        SELECT p.id, p.status
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        WHERE p.id = ?
          AND p.tenant_id = ?
          AND b.provider_id = ?
        LIMIT 1
        `,
        [params.id, request.user!.tenantId, providerId]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }

      await query(
        `
        UPDATE payments
        SET status = ?, payment_gateway_reference = ?, metadata = ?, updated_at = NOW()
        WHERE id = ? AND tenant_id = ?
        `,
        [
          status,
          paymentGatewayReference || null,
          metadata ? JSON.stringify(metadata) : null,
          params.id,
          request.user!.tenantId,
        ]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'payment.update',
        resourceType: 'payment',
        resourceId: params.id,
        changes: { status, previousStatus: rows[0].status },
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update payment error:', error);
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      );
    }
  }
);
