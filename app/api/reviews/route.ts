import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query, transaction } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';
import { v4 as uuidv4 } from 'uuid';

export const GET = requireAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const serviceId = searchParams.get('serviceId');
      const providerId = searchParams.get('providerId');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = parseInt(searchParams.get('offset') || '0');

      let whereClause = 'r.tenant_id = ?';
      let params: any[] = [request.user!.tenantId];

      if (serviceId) {
        whereClause += ' AND r.service_id = ?';
        params.push(serviceId);
      }

      if (providerId) {
        whereClause += ' AND r.provider_id = ?';
        params.push(providerId);
      }

      // For customer, only show their own reviews
      whereClause += ' AND r.customer_id = ?';
      params.push(request.user!.userId);

      const reviews = await query<any[]>(
        `SELECT r.*, s.name as service_name, s.name_ar as service_name_ar,
                sp.business_name as provider_name, sp.business_name_ar as provider_name_ar,
                sp.logo as provider_logo
         FROM reviews r
         LEFT JOIN services s ON r.service_id = s.id
         LEFT JOIN service_providers sp ON r.provider_id = sp.id
         WHERE ${whereClause}
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const total = await query<any[]>(
        `SELECT COUNT(*) as count FROM reviews r WHERE ${whereClause}`,
        params
      );

      return NextResponse.json({
        success: true,
        reviews: reviews.map(review => ({
          id: review.id,
          bookingId: review.booking_id,
          serviceId: review.service_id,
          providerId: review.provider_id,
          rating: review.rating,
          comment: review.comment,
          media: review.media ? JSON.parse(review.media) : null,
          isVerified: review.is_verified,
          createdAt: review.created_at,
          service: {
            name: review.service_name,
            nameAr: review.service_name_ar,
          },
          provider: {
            name: review.provider_name,
            nameAr: review.provider_name_ar,
            logo: review.provider_logo,
          },
        })),
        total: total[0].count,
        limit,
        offset,
      });
    } catch (error) {
      console.error('Get reviews error:', error);
      return NextResponse.json(
        { error: 'Failed to get reviews' },
        { status: 500 }
      );
    }
  }
);

export const POST = requireAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { bookingId, rating, comment, media } = body;

      // Enhanced validation
      if (!bookingId || bookingId.trim() === '') {
        return NextResponse.json(
          { error: 'Booking ID is required' },
          { status: 400 }
        );
      }

      if (!rating || typeof rating !== 'number') {
        return NextResponse.json(
          { error: 'Valid rating is required' },
          { status: 400 }
        );
      }

      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }

      // Improved booking validation query
      const bookings = await query<any[]>(
        `SELECT b.id, b.service_id, b.provider_id, b.status, b.customer_id
         FROM bookings b
         WHERE b.id = ? 
         AND b.customer_id = ? 
         AND b.tenant_id = ?
         LIMIT 1`,
        [bookingId, request.user!.userId, request.user!.tenantId]
      );

      if (bookings.length === 0) {
        console.warn(`Booking not found: ${bookingId} for user ${request.user!.userId}`);
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      const booking = bookings[0];
      
      // Check booking status - only completed bookings can be reviewed
      if (booking.status !== 'completed') {
        return NextResponse.json(
          { error: `Booking cannot be reviewed. Current status: ${booking.status}. Only completed bookings can be reviewed.` },
          { status: 400 }
        );
      }

      // Check if booking has completion date
      if (!booking.completed_at) {
        return NextResponse.json(
          { error: 'Booking must be completed before it can be reviewed.' },
          { status: 400 }
        );
      }

      // Check if review already exists
      const existingReviews = await query<any[]>(
        'SELECT id FROM reviews WHERE booking_id = ? AND tenant_id = ? LIMIT 1',
        [bookingId, request.user!.tenantId]
      );

      if (existingReviews.length > 0) {
        return NextResponse.json(
          { error: 'Review already exists for this booking' },
          { status: 409 }
        );
      }

      const reviewId = uuidv4();

      await transaction(async (conn) => {
        // Insert review with all required fields
        await conn.execute(
          `INSERT INTO reviews (
            id, tenant_id, booking_id, customer_id, service_id, provider_id,
            rating, comment, media, is_verified, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            reviewId,
            request.user!.tenantId,
            bookingId,
            request.user!.userId,
            booking.service_id,
            booking.provider_id,
            rating,
            comment || null,
            media ? JSON.stringify(media) : null,
            true,
          ]
        );

        // Update provider rating statistics
        const providerStats = await conn.execute(
          `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
           FROM reviews
           WHERE provider_id = ? AND tenant_id = ?`,
          [booking.provider_id, request.user!.tenantId]
        ) as any;

        await conn.execute(
          `UPDATE service_providers
           SET rating = ?, total_reviews = ?, updated_at = NOW()
           WHERE id = ? AND tenant_id = ?`,
          [
            providerStats[0]?.[0]?.avg_rating || 0,
            providerStats[0]?.[0]?.total_reviews || 0,
            booking.provider_id,
            request.user!.tenantId,
          ]
        );
      });

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'customer.review.create',
        resourceType: 'review',
        resourceId: reviewId,
        changes: { bookingId, rating, serviceId: booking.service_id, providerId: booking.provider_id },
        ...clientInfo,
      });

      return NextResponse.json(
        { 
          success: true, 
          reviewId,
          message: 'Review submitted successfully'
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create review error:', error);
      return NextResponse.json(
        { error: 'Failed to create review. Please try again.' },
        { status: 500 }
      );
    }
  }
);
