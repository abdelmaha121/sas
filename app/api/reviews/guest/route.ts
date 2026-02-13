import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      booking_id,
      service_id,
      provider_id,
      rating,
      comment,
      customer_name,
      customer_email,
    } = body;

    if (!booking_id || !rating) {
      return NextResponse.json(
        { error: 'Booking ID and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get tenant from request headers or default
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant-001';

    const bookings = await query<any[]>(
      `SELECT * FROM bookings WHERE id = ? AND tenant_id = ? AND status IN ('confirmed', 'completed') LIMIT 1`,
      [booking_id, tenantId]
    );

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found or not completed' },
        { status: 404 }
      );
    }

    const existingReviews = await query<any[]>(
      `SELECT id FROM reviews WHERE booking_id = ? LIMIT 1`,
      [booking_id]
    );

    if (existingReviews.length > 0) {
      return NextResponse.json(
        { error: 'Review already submitted for this booking' },
        { status: 400 }
      );
    }

    const reviewId = uuidv4();
    const booking = bookings[0];

    await query(
      `INSERT INTO reviews (
        id, tenant_id, booking_id, service_id, provider_id, customer_id,
        rating, comment, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reviewId,
        booking.tenant_id,
        booking_id,
        service_id,
        provider_id,
        booking.customer_id || null,
        rating,
        comment || null,
        JSON.stringify({
          guest_review: true,
          customer_name: customer_name || null,
          customer_email: customer_email || null,
        }),
      ]
    );

    const [providerRating] = await query<any[]>(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM reviews
       WHERE provider_id = ? AND tenant_id = ?`,
      [booking.provider_id, tenantId]
    );

    await query(
      `UPDATE service_providers
       SET rating = ?, total_reviews = ?, updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [
        providerRating[0].avg_rating || 0,
        providerRating[0].total_reviews || 0,
        booking.provider_id,
        tenantId,
      ]
    );

    const reviews = await query<any[]>(
      `SELECT r.*, s.name as service_name, sp.business_name as provider_name
       FROM reviews r
       LEFT JOIN services s ON r.service_id = s.id
       LEFT JOIN service_providers sp ON r.provider_id = sp.id
       WHERE r.id = ?
       LIMIT 1`,
      [reviewId]
    );

    return NextResponse.json(
      {
        success: true,
        review: reviews[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
