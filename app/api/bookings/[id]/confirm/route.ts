import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { v4 as uuidv4 } from 'uuid';

export const PUT = requireAuth(async (request: any, { params }: any) => {
  try {
    const bookingId = params.id;

    const bookings = await query<any[]>(
      `SELECT * FROM bookings WHERE id = ? AND tenant_id = ? LIMIT 1`,
      [bookingId, request.user.tenantId]
    );

    if (!bookings.length) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    // For immediate payment, check if payment is completed
    if (booking.payment_type === 'immediate' && booking.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    if (booking.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Booking already confirmed' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE bookings SET status = 'confirmed' WHERE id = ?`,
      [bookingId]
    );

    await query(
      `INSERT INTO notifications (
        id, tenant_id, user_id, type,
        title, title_ar, message, message_ar,
        data, is_read
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        booking.tenant_id,
        booking.provider_id,
        'new_booking',
        'New booking',
        'حجز جديد',
        'You have received a new booking',
        'لديك حجز جديد',
        JSON.stringify({ booking_id: bookingId }),
        false,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to confirm booking' },
      { status: 500 }
    );
  }
});

export const OPTIONS = () => new NextResponse(null, {
  status: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
});
