import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort');
    const verified = searchParams.get('verified');

    let orderBy = 'sp.created_at DESC';

    if (sort === 'rating') {
      orderBy = 'sp.rating DESC';
    } else if (sort === 'bookings') {
      orderBy = 'sp.total_bookings DESC';
    }

    let whereConditions = ['sp.is_active = TRUE'];

    if (verified === 'true') {
      whereConditions.push("sp.verification_status = 'verified'");
    }

    const whereClause = whereConditions.join(' AND ');

    const providers = await query<any[]>(
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
        sp.created_at,
        u.phone,
        u.email,
        COUNT(DISTINCT s.id) as service_count
      FROM service_providers sp
      LEFT JOIN users u ON sp.user_id = u.id
      LEFT JOIN services s ON sp.id = s.provider_id AND s.is_active = TRUE
      WHERE ${whereClause}
      GROUP BY sp.id, sp.business_name, sp.business_name_ar, sp.description,
               sp.rating, sp.total_reviews, sp.total_bookings, sp.verification_status,
               sp.featured, sp.created_at, u.phone, u.email
      ORDER BY ${orderBy}
      LIMIT 50`
    );

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json(
      { error: 'Failed to get providers' },
      { status: 500 }
    );
  }
}
