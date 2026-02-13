import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { getTenantFromRequest } from '@/lib/middleware/tenant';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('category_id') || '';
    const sortBy = searchParams.get('sort') || 'popular';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    let whereClause = 's.tenant_id = ? AND s.is_active = TRUE';
    const params: any[] = [tenant.id];

    if (search) {
      whereClause += ' AND (s.name LIKE ? OR s.name_ar LIKE ? OR s.description LIKE ? OR s.description_ar LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (categoryId) {
      whereClause += ' AND s.category_id = ?';
      params.push(categoryId);
    }

    let orderClause = 'sp.total_bookings DESC';
    switch (sortBy) {
      case 'price_asc':
        orderClause = 's.base_price ASC';
        break;
      case 'price_desc':
        orderClause = 's.base_price DESC';
        break;
      case 'rating':
        orderClause = 'sp.rating DESC';
        break;
      case 'popular':
      default:
        orderClause = 'sp.total_bookings DESC';
        break;
    }

    // Get total count
    const countResult = await query<any[]>(
      `SELECT COUNT(*) as total FROM services s
       LEFT JOIN service_providers sp ON s.provider_id = sp.id
       WHERE ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // Get services with provider info and review stats
    const services = await query<any[]>(
      `SELECT
        s.id, s.provider_id, s.category_id,
        s.name, s.name_ar, s.description, s.description_ar,
        s.base_price, s.currency, s.duration_minutes,
        s.pricing_type, s.booking_type,
        s.allow_recurring, s.allow_urgent, s.urgent_fee,
        s.min_advance_hours, s.free_cancellation_hours,
        s.cancellation_type, s.cancellation_value,
        s.is_active, s.images, s.availability,
        s.payment_methods, s.metadata,
        sc.name as category_name, sc.name_ar as category_name_ar,
        sp.business_name as provider_name, sp.business_name_ar as provider_name_ar,
        sp.logo as provider_logo, sp.rating as provider_rating,
        sp.total_reviews as provider_total_reviews,
        sp.total_bookings as provider_total_bookings,
        sp.verification_status as provider_verification_status,
        COALESCE(
          (SELECT AVG(r.rating) FROM reviews r 
           JOIN bookings b ON r.booking_id = b.id 
           WHERE b.service_id = s.id), 0
        ) as avg_rating,
        COALESCE(
          (SELECT COUNT(r.id) FROM reviews r 
           JOIN bookings b ON r.booking_id = b.id 
           WHERE b.service_id = s.id), 0
        ) as review_count
       FROM services s
       LEFT JOIN service_categories sc ON s.category_id = sc.id
       LEFT JOIN service_providers sp ON s.provider_id = sp.id
       WHERE ${whereClause}
       ORDER BY ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Parse JSON fields
    const parsedServices = services.map((s: any) => ({
      ...s,
      images: typeof s.images === 'string' ? JSON.parse(s.images) : (s.images || []),
      availability: typeof s.availability === 'string' ? JSON.parse(s.availability) : (s.availability || []),
      payment_methods: typeof s.payment_methods === 'string' ? JSON.parse(s.payment_methods) : (s.payment_methods || ['instant', 'cash_on_delivery']),
      metadata: typeof s.metadata === 'string' ? JSON.parse(s.metadata) : (s.metadata || {}),
      avg_rating: parseFloat(s.avg_rating) || 0,
      review_count: parseInt(s.review_count) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        services: parsedServices,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get public services error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
