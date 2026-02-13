import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { getTenantFromRequest } from '@/lib/middleware/tenant';
import { extractClientInfo, createAuditLog } from '@/lib/services/audit';


export const GET = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const tenant = await getTenantFromRequest(request);
      if (!tenant) {
        return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 });
      }

      const { searchParams } = new URL(request.url);

      const page = Math.max(1, Number(searchParams.get('page')) || 1);
      const limit = Math.max(1, Number(searchParams.get('limit')) || 20);
      const offset = (page - 1) * limit;

      const status = searchParams.get('status');
      const paymentMethod = searchParams.get('payment_method');
      const userId = searchParams.get('user_id');
      const bookingId = searchParams.get('booking_id');
      const includeInactive = searchParams.get('include_inactive') === 'true';

      const whereConditions: string[] = ['p.tenant_id = ?'];
      const params: any[] = [tenant.id];

      if (status) {
        whereConditions.push('p.status = ?');
        params.push(status);
      }

      if (paymentMethod) {
        whereConditions.push('p.payment_method = ?');
        params.push(paymentMethod);
      }

      if (userId) {
        whereConditions.push('p.user_id = ?');
        params.push(userId);
      }

      if (bookingId) {
        whereConditions.push('p.booking_id = ?');
        params.push(bookingId);
      }

      if (!includeInactive) {
        whereConditions.push('p.status != ?');
        params.push('cancelled');
      }

      const whereClause = whereConditions.join(' AND ');

      const paymentsSql = `
        SELECT
          p.id,
          p.tenant_id,
          p.booking_id,
          p.user_id,
          p.amount,
          p.currency,
          p.payment_method,
          p.payment_gateway_reference AS transaction_id,
          p.status,
          p.metadata,
          p.created_at,
          p.updated_at,
          u.email AS customer_email,
          u.first_name AS customer_first_name,
          u.last_name AS customer_last_name,
          b.scheduled_at,
          s.name AS service_name,
          s.name_ar AS service_name_ar,
          sp.business_name AS provider_name,
          sp.business_name_ar AS provider_name_ar,
          JSON_UNQUOTE(JSON_EXTRACT(p.metadata, '$.notes')) AS notes
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN bookings b ON p.booking_id = b.id
        JOIN services s ON b.service_id = s.id
        JOIN service_providers sp ON b.provider_id = sp.id
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countSql = `
        SELECT COUNT(*) AS total
        FROM payments p
        WHERE ${whereClause}
      `;

      const [payments, countResult] = await Promise.all([
        query<any[]>(paymentsSql, params),
        query<any[]>(countSql, params),
      ]);

      return NextResponse.json({
        payments,
        pagination: {
          total: countResult[0].total,
          page,
          limit,
          totalPages: Math.ceil(countResult[0].total / limit),
        },
      });
    } catch (error) {
      console.error('Get payments error:', error);
      return NextResponse.json(
        { error: 'Failed to get payments' },
        { status: 500 }
      );
    }
  }
);

/* =========================
   EXPORT: Payments (Excel | JSON | PDF)
========================= */
export const POST = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const tenant = await getTenantFromRequest(request);
      if (!tenant) {
        return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 });
      }

      const { format } = await request.json();

      const payments = await query<any[]>(
        `SELECT * FROM payments WHERE tenant_id = ? ORDER BY created_at DESC`,
        [tenant.id]
      );

      if (format === 'json') {
        return NextResponse.json({ payments });
      }

      if (format === 'excel') {
        // يتم تنفيذ التصدير في الواجهة الأمامية أو Service منفصل
        return NextResponse.json({ error: 'Excel export handled externally' }, { status: 501 });
      }

      if (format === 'pdf') {
        return NextResponse.json({ error: 'PDF export handled externally' }, { status: 501 });
      }

      return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 });
    } catch (error) {
      console.error('Export payments error:', error);
      return NextResponse.json(
        { error: 'Failed to export payments' },
        { status: 500 }
      );
    }
  }
);


export const PUT = async () =>
  NextResponse.json({ error: 'Payments are read-only' }, { status: 403 });

export const DELETE = async () =>
  NextResponse.json({ error: 'Payments are read-only' }, { status: 403 });
