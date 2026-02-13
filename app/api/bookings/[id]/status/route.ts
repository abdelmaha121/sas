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
        b.id,
        b.status,
        b.payment_status,
        b.scheduled_at,
        b.completed_at,
        b.updated_at,
        b.total_amount,
        b.currency,
        b.customer_address,
        b.notes,
        s.name as service_name,
        s.name_ar as service_name_ar,
        s.description as service_description,
        sp.business_name as provider_name,
        sp.business_name_ar as provider_name_ar,
        sp.rating as provider_rating,
        u.phone as provider_phone
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

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        payment_status: booking.payment_status,
        scheduled_at: booking.scheduled_at,
        completed_at: booking.completed_at,
        updated_at: booking.updated_at,
        total_amount: parseFloat(booking.total_amount),
        currency: booking.currency,
        customer_address: booking.customer_address,
        notes: booking.notes,
        service: {
          name: booking.service_name,
          name_ar: booking.service_name_ar,
          description: booking.service_description,
        },
        provider: {
          name: booking.provider_name,
          name_ar: booking.provider_name_ar,
          rating: booking.provider_rating ? parseFloat(booking.provider_rating) : null,
          phone: booking.provider_phone,
        },
        addons: addons.map(addon => ({
          id: addon.id,
          name: addon.name,
          nameAr: addon.name_ar,
          price: parseFloat(addon.price),
        })),
      },
    });
  } catch (error) {
    console.error('Get booking status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get booking status'
      },
      { status: 500 }
    );
  }
}
