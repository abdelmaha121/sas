import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';

// قيم الحالة الصالحة في جدول bookings
const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'refunded'
] as const;

type BookingStatus = typeof BOOKING_STATUSES[number];

// دالة للحصول على معرف المزود
async function getProviderId(userId: string, tenantId: string): Promise<string | null> {
  const [provider] = await query<{ id: string }[]>(
    'SELECT id FROM service_providers WHERE user_id = ? AND tenant_id = ? LIMIT 1',
    [userId, tenantId]
  );
  return provider ? provider.id : null;
}

// GET API لحجوزات المزود
export const GET = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      // 1️⃣ التأكد من وجود المستخدم
      if (!request.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { userId, tenantId } = request.user;
      const providerId = await getProviderId(userId, tenantId);

      if (!providerId) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      // 2️⃣ قراءة Pagination وفلترة الحالة
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
      const status = searchParams.get('status');

      if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
        return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
      }

      if (status && !BOOKING_STATUSES.includes(status as BookingStatus)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }

      const offset = (page - 1) * limit;

      // 3️⃣ بناء استعلام الحجوزات
      let baseQuery = `
        SELECT b.*,
               c.email AS customer_email, c.first_name AS customer_first_name,
               c.last_name AS customer_last_name, c.phone AS customer_phone,
               s.name AS service_name, s.name_ar AS service_name_ar
        FROM bookings b
        JOIN users c ON b.customer_id = c.id
        JOIN services s ON b.service_id = s.id
        WHERE b.provider_id = ? AND b.tenant_id = ?
      `;

      let countQuery = `
        SELECT COUNT(*) AS total
        FROM bookings b
        WHERE b.provider_id = ? AND b.tenant_id = ?
      `;

      const bookingsParams: any[] = [providerId, tenantId];
      const countParams: any[] = [providerId, tenantId];

      if (status) {
        baseQuery += ' AND b.status = ?';
        countQuery += ' AND b.status = ?';
        bookingsParams.push(status);
        countParams.push(status);
      }

      // ✅ وضع LIMIT و OFFSET مباشرة لتجنب ER_WRONG_ARGUMENTS
      baseQuery += ` ORDER BY b.scheduled_at DESC LIMIT ${limit} OFFSET ${offset}`;

      // 4️⃣ تنفيذ الاستعلامات بالتوازي
      const [bookings, countResult] = await Promise.all([
        query<any[]>(baseQuery, bookingsParams),
        query<{ total: number | string }[]>(countQuery, countParams),
      ]);

      const total = Number(countResult[0].total);

      // 5️⃣ إرجاع النتيجة
      return NextResponse.json({
        bookings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });

    } catch (error) {
      console.error('Get provider bookings error:', error);
      return NextResponse.json({ error: 'Failed to get bookings' }, { status: 500 });
    }
  }
);
