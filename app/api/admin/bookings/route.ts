import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';

export const GET = requireRole(['admin', 'super_admin'])(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    // الصفحة وعدد العناصر لكل صفحة
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.max(parseInt(searchParams.get('limit') || '10', 10), 1);
    const offset = (page - 1) * limit;

    // الفلاتر
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const providerId = searchParams.get('provider_id');
    const customerId = searchParams.get('customer_id');
    const search = searchParams.get('search')?.trim(); // البحث النصي

    // بناء شروط WHERE
    let whereConditions = ['b.tenant_id = ?'];
    const params: any[] = [request.user!.tenantId];

    if (status) {
      whereConditions.push('b.status = ?');
      params.push(status);
    }

    if (paymentStatus) {
      whereConditions.push('b.payment_status = ?');
      params.push(paymentStatus);
    }

    if (providerId) {
      whereConditions.push('b.provider_id = ?');
      params.push(providerId);
    }

    if (customerId) {
      whereConditions.push('b.customer_id = ?');
      params.push(customerId);
    }

    if (search) {
      // البحث على البريد أو الاسم الأول/الأخير للعميل أو اسم مقدم الخدمة
      whereConditions.push(
        `(c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR sp.business_name LIKE ?)`
      );
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.join(' AND ');

    // استعلام الحجز
    const bookingsQuery = `
      SELECT b.*,
             c.email as customer_email, c.first_name as customer_first_name, c.last_name as customer_last_name,
             sp.business_name as provider_name,
             s.name as service_name
      FROM bookings b
      JOIN users c ON b.customer_id = c.id
      JOIN service_providers sp ON b.provider_id = sp.id
      JOIN services s ON b.service_id = s.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // استعلام عدد النتائج
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN users c ON b.customer_id = c.id
      JOIN service_providers sp ON b.provider_id = sp.id
      WHERE ${whereClause}
    `;

    const [bookings, countResult] = await Promise.all([
      query<any[]>(bookingsQuery, params),
      query<any[]>(countQuery, params),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Failed to get bookings' }, { status: 500 });
  }
});
