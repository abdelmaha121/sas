import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { getTenantFromRequest } from '@/lib/middleware/tenant';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 });
    }

    const services = await query<any[]>(
      `SELECT
        s.*, 
        sc.name as category_name, sc.name_ar as category_name_ar,
        sp.business_name as provider_name, sp.business_name_ar as provider_name_ar,
        sp.logo as provider_logo, sp.rating as provider_rating,
        sp.total_reviews as provider_total_reviews,
        sp.total_bookings as provider_total_bookings,
        sp.description as provider_description,
        sp.verification_status as provider_verification_status,
        sp.created_at as provider_created_at,
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
       WHERE s.id = ? AND s.tenant_id = ?
       LIMIT 1`,
      [id, tenant.id]
    );

    if (services.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const service = services[0];

    // Get addons
    const addons = await query<any[]>(
      `SELECT id, name, name_ar, price, is_required FROM service_addons WHERE service_id = ?`,
      [id]
    );

    // Get recent reviews
    const reviews = await query<any[]>(
      `SELECT r.*, u.first_name, u.last_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       JOIN bookings b ON r.booking_id = b.id
       WHERE b.service_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Parse JSON fields
    const parsed = {
      ...service,
      images: typeof service.images === 'string' ? JSON.parse(service.images) : (service.images || []),
      availability: typeof service.availability === 'string' ? JSON.parse(service.availability) : (service.availability || []),
      payment_methods: typeof service.payment_methods === 'string' ? JSON.parse(service.payment_methods) : (service.payment_methods || ['instant', 'cash_on_delivery']),
      metadata: typeof service.metadata === 'string' ? JSON.parse(service.metadata) : (service.metadata || {}),
      avg_rating: parseFloat(service.avg_rating) || 0,
      review_count: parseInt(service.review_count) || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        service: parsed,
        addons,
        reviews,
      },
    });
  } catch (error) {
    console.error('Get service detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service details' },
      { status: 500 }
    );
  }
}
