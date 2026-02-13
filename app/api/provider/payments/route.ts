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
   GET – قائمة المدفوعات مع Pagination
================================ */
export const GET = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const providerId = await getProviderId(
        request.user!.userId,
        request.user!.tenantId
      );
      if (!providerId) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      let limit = parseInt(searchParams.get('limit') || '10', 10);
      const status = searchParams.get('status');
      const offset = (page - 1) * limit;

      // تأكد من أن limit و offset أعداد صحيحة
      if (isNaN(limit) || limit < 1) limit = 10;

      const where = ['b.provider_id = ?', 'p.tenant_id = ?'];
      const params: any[] = [providerId, request.user!.tenantId];

      if (status) {
        where.push('p.status = ?');
        params.push(status);
      }

      const whereClause = where.join(' AND ');

      const [payments, count] = await Promise.all([
        query<any[]>(
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
          WHERE ${whereClause}
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
          `,
          params
        ),
        query<any[]>(
          `
          SELECT COUNT(*) AS total
          FROM payments p
          JOIN bookings b ON p.booking_id = b.id
          WHERE ${whereClause}
          `,
          params
        ),
      ]);

      return NextResponse.json({
        payments,
        pagination: {
          total: count[0].total,
          page,
          limit,
          totalPages: Math.ceil(count[0].total / limit),
        },
      });
    } catch (error) {
      console.error('Get payments error:', error);
      return NextResponse.json({ error: 'Failed to get payments' }, { status: 500 });
    }
  }
);

/* ================================
   POST – إنشاء دفعة جديدة
================================ */
export const POST = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { bookingId, userId, amount, currency, paymentMethod, status, metadata } = body;

      if (!bookingId || !userId || !amount || !paymentMethod) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const result = await query<any>(
        `
        INSERT INTO payments
        (tenant_id, booking_id, user_id, amount, currency, payment_method, status, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          request.user!.tenantId,
          bookingId,
          userId,
          amount,
          currency || 'USD',
          paymentMethod,
          status || 'pending',
          metadata ? JSON.stringify(metadata) : null,
        ]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'payment.create',
        resourceType: 'payment',
        resourceId: result.insertId,
        changes: body,
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Create payment error:', error);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }
  }
);

/* ================================
   PUT – تحديث حالة الدفع
================================ */
export const PUT = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { id, status, paymentGatewayReference, metadata } = body;

      if (!id || !status) {
        return NextResponse.json({ error: 'Payment id and status are required' }, { status: 400 });
      }

      const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
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
          id,
          request.user!.tenantId,
        ]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'payment.update',
        resourceType: 'payment',
        resourceId: id,
        changes: body,
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update payment error:', error);
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }
  }
);

/* ================================
   DELETE – حذف دفعة أو عدة دفعات
================================ */
export const DELETE = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const { ids } = await request.json();

      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
      }

      await query(
        `
        DELETE FROM payments
        WHERE id IN (${ids.map(() => '?').join(',')})
        AND tenant_id = ?
        `,
        [...ids, request.user!.tenantId]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'payment.delete',
        resourceType: 'payment',
        resourceId: ids.join(','),
        changes: { ids },
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete payment error:', error);
      return NextResponse.json({ error: 'Failed to delete payments' }, { status: 500 });
    }
  }
);
