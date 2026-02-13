import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      booking_id,
      amount,
      payment_method,
      card_last_4,
      card_holder_name,
    } = body;

    if (!booking_id || !amount || !payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bookings = await query<any[]>(
      `SELECT * FROM bookings WHERE id = ? LIMIT 1`,
      [booking_id]
    );

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = bookings[0];

    if (booking.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Booking already paid' },
        { status: 400 }
      );
    }

    const paymentId = uuidv4();
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    await query(
      `INSERT INTO payments (
        id, tenant_id, booking_id, user_id, amount, currency,
        payment_method, payment_gateway_reference, status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        booking.tenant_id,
        booking_id,
        booking.customer_id || null,
        amount,
        booking.currency || 'SAR',
        payment_method,
        transactionId,
        'completed',
        JSON.stringify({
          card_last_4: card_last_4 || null,
          card_holder_name: card_holder_name || null,
          payment_gateway: 'demo',
          processed_at: new Date().toISOString(),
        }),
      ]
    );

    await query(
      `UPDATE bookings
       SET payment_status = ?, updated_at = NOW()
       WHERE id = ?`,
      ['paid', booking_id]
    );

    const payments = await query<any[]>(
      `SELECT * FROM payments WHERE id = ? LIMIT 1`,
      [paymentId]
    );

    return NextResponse.json(
      {
        success: true,
        payment: payments[0],
        transaction_id: transactionId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Process guest payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
