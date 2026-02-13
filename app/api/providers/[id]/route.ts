import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id;

    const providerResult = await query<any[]>(
      `SELECT
        sp.id,
        sp.business_name,
        sp.business_name_ar,
        sp.description,
        sp.rating as avg_rating,
        sp.total_reviews,
        sp.total_bookings,
        sp.verification_status,
        sp.featured,
        sp.commission_rate,
        sp.created_at,
        u.email,
        u.phone,
        u.first_name,
        u.last_name
      FROM service_providers sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.id = ? AND sp.is_active = TRUE
      LIMIT 1`,
      [providerId]
    );

    if (!providerResult || providerResult.length === 0) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    const provider = providerResult[0];

    const services = await query<any[]>(
      `SELECT
        s.id,
        s.name,
        s.name_ar,
        s.description,
        s.description_ar,
        s.base_price,
        s.currency,
        s.duration_minutes,
        s.pricing_type,
        s.is_active,
        sc.name as category_name,
        sc.name_ar as category_name_ar,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.service_id = s.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.service_id = s.id) as review_count
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE s.provider_id = ? AND s.is_active = TRUE
      ORDER BY s.created_at DESC`,
      [providerId]
    );

    const reviews = await query<any[]>(
      `SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.first_name,
        u.last_name,
        s.name as service_name,
        s.name_ar as service_name_ar
      FROM reviews r
      LEFT JOIN bookings b ON r.booking_id = b.id
      LEFT JOIN users u ON b.customer_id = u.id
      LEFT JOIN services s ON r.service_id = s.id
      WHERE r.provider_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20`,
      [providerId]
    );

    const stats = await query<any[]>(
      `SELECT
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
        COUNT(DISTINCT s.id) as total_services,
        AVG(r.rating) as avg_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM service_providers sp
      LEFT JOIN services s ON sp.id = s.provider_id
      LEFT JOIN bookings b ON s.id = b.service_id
      LEFT JOIN reviews r ON sp.id = r.provider_id
      WHERE sp.id = ?
      GROUP BY sp.id`,
      [providerId]
    );

    return NextResponse.json({
      provider: {
        ...provider,
        stats: stats[0] || {
          total_bookings: 0,
          completed_bookings: 0,
          total_services: 0,
          avg_rating: 0,
          total_reviews: 0
        }
      },
      services: services || [],
      reviews: reviews || []
    });
  } catch (error) {
    console.error('Get provider details error:', error);
    return NextResponse.json(
      { error: 'Failed to get provider details' },
      { status: 500 }
    );
  }
}
