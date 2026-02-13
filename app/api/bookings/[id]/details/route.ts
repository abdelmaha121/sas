import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;

    const bookings = await query<any[]>(
      `SELECT
        b.*,
        s.name as service_name,
        s.name_ar as service_name_ar,
        s.description as service_description,
        s.description_ar as service_description_ar,
        s.duration_minutes as service_duration,
        sp.business_name as provider_name,
        sp.business_name_ar as provider_name_ar,
        sp.rating as provider_rating,
        sp.total_reviews as provider_reviews,
        sp.logo as provider_logo,
        u.phone as provider_phone,
        u.email as provider_email
       FROM bookings b
       LEFT JOIN services s ON b.service_id = s.id
       LEFT JOIN service_providers sp ON b.provider_id = sp.id
       LEFT JOIN users u ON sp.user_id = u.id
       WHERE b.id = ?
       LIMIT 1`,
      [bookingId]
    );

    if (bookings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found'
        },
        { status: 404 }
      );
    }

    const booking = bookings[0];

    const addons = await query<any[]>(
      `SELECT
        sa.id,
        sa.name,
        sa.name_ar,
        ba.price
       FROM booking_addons ba
       JOIN service_addons sa ON ba.addon_id = sa.id
       WHERE ba.booking_id = ?`,
      [bookingId]
    );

    const payments = await query<any[]>(
      `SELECT
        id,
        amount,
        payment_method,
        status,
        created_at,
        payment_gateway_reference
       FROM payments
       WHERE booking_id = ?
       ORDER BY created_at DESC`,
      [bookingId]
    );

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          status: booking.status,
          bookingType: booking.booking_type,
          paymentStatus: booking.payment_status,
          scheduledAt: booking.scheduled_at,
          completedAt: booking.completed_at,
          totalAmount: parseFloat(booking.total_amount),
          commissionAmount: parseFloat(booking.commission_amount),
          currency: booking.currency,
          customerAddress: booking.customer_address,
          notes: booking.notes,
          metadata: booking.metadata,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at,
          service: {
            name: booking.service_name,
            nameAr: booking.service_name_ar,
            description: booking.service_description,
            descriptionAr: booking.service_description_ar,
            duration: booking.service_duration,
          },
          provider: {
            name: booking.provider_name,
            nameAr: booking.provider_name_ar,
            rating: booking.provider_rating ? parseFloat(booking.provider_rating) : null,
            totalReviews: booking.provider_reviews || 0,
            logo: booking.provider_logo,
            phone: booking.provider_phone,
            email: booking.provider_email,
          },
        },
        addons: addons.map(addon => ({
          id: addon.id,
          name: addon.name,
          nameAr: addon.name_ar,
          price: parseFloat(addon.price),
        })),
        payments: payments.map(payment => ({
          id: payment.id,
          amount: parseFloat(payment.amount),
          method: payment.payment_method,
          status: payment.status,
          createdAt: payment.created_at,
          reference: payment.payment_gateway_reference,
        })),
      },
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get booking details'
      },
      { status: 500 }
    );
  }
}
