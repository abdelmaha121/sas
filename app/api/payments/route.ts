import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query, transaction } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';
import { v4 as uuidv4 } from 'uuid';

// Test cards for sandbox mode
const TEST_CARDS = {
  success: '4111111111111111',
  declined: '4000000000000002',
};

const isTestMode = process.env.NODE_ENV === 'development' || process.env.PAYMENT_MODE === 'sandbox';

export const POST = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_JSON' }, { status: 400 });
    }

    const { bookingId, amount, currency = 'USD', paymentMethod, cardData } = body;

    const validationErrors: string[] = [];

    if (!bookingId || typeof bookingId !== 'string' || bookingId.trim() === '') {
      validationErrors.push('Booking ID is required');
    }

    if (!amount) {
      validationErrors.push('Amount is required');
    } else if (typeof amount !== 'number' || amount <= 0) {
      validationErrors.push('Amount must be a positive number');
    }

    if (!currency || !/^[A-Z]{3}$/.test(currency)) {
      validationErrors.push('Currency must be a 3-letter code');
    }

    if (!paymentMethod || !['card', 'wallet', 'bank_transfer', 'cash'].includes(paymentMethod)) {
      validationErrors.push('Invalid payment method');
    }

    if (paymentMethod === 'card') {
      if (!cardData || typeof cardData !== 'object') {
        validationErrors.push('Card data is required for card payments');
      } else {
        const { cardNumber, cardHolder, expiryMonth, expiryYear, cvv } = cardData;
        if (!cardNumber || !/^\d{13,19}$/.test(cardNumber.toString().replace(/\s/g, ''))) {
          validationErrors.push('Card number must be 13-19 digits');
        }
        if (!cardHolder || cardHolder.trim() === '') validationErrors.push('Card holder name is required');
        const month = parseInt(expiryMonth);
        if (!expiryMonth || isNaN(month) || month < 1 || month > 12) validationErrors.push('Expiry month must be 01-12');
        const year = parseInt(expiryYear);
        if (!expiryYear || isNaN(year) || !(expiryYear.toString().length === 2 || expiryYear.toString().length === 4)) {
          validationErrors.push('Expiry year must be 2 or 4 digits');
        }
        if (!cvv || !/^\d{3,4}$/.test(cvv.toString())) validationErrors.push('CVV must be 3 or 4 digits');
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: validationErrors }, { status: 400 });
    }

    // Verify booking exists
    const bookings = await query<any[]>(
      `SELECT id, total_amount, currency, customer_id, status 
       FROM bookings 
       WHERE id = ? AND customer_id = ? AND tenant_id = ? LIMIT 1`,
      [bookingId, request.user!.userId, request.user!.tenantId]
    );

    if (bookings.length === 0) {
      return NextResponse.json({ error: 'Booking not found', code: 'BOOKING_NOT_FOUND' }, { status: 404 });
    }

    const booking = bookings[0];

    // Verify amount matches booking total_amount
    if (Math.abs(parseFloat(booking.total_amount) - amount) > 0.01) {
      return NextResponse.json({ error: 'Payment amount does not match booking total', code: 'AMOUNT_MISMATCH' }, { status: 400 });
    }

    // Check for existing payment
    const existingPayments = await query<any[]>(
      'SELECT id FROM payments WHERE booking_id = ? AND status IN ("completed","pending") LIMIT 1',
      [bookingId]
    );
    if (existingPayments.length > 0) {
      return NextResponse.json({ error: 'Payment already exists for this booking', code: 'DUPLICATE_PAYMENT' }, { status: 409 });
    }

    const paymentId = uuidv4();
    let paymentStatus: 'completed' | 'pending' | 'failed' = 'failed';
    let gatewayReference = '';
    const metadata: any = { paymentMethod, testMode: isTestMode };

    // Process payment
    if (paymentMethod === 'card' && cardData) {
      const cleanCard = cardData.cardNumber.replace(/\s/g, '');
      if (isTestMode) {
        if (cleanCard === TEST_CARDS.success) {
          paymentStatus = 'completed';
          gatewayReference = `TEST_${paymentId.substring(0, 12).toUpperCase()}`;
          metadata.cardLastFour = cleanCard.slice(-4);
        } else if (cleanCard === TEST_CARDS.declined) {
          return NextResponse.json({ error: 'Card declined (test)', code: 'PAYMENT_FAILED' }, { status: 400 });
        } else {
          paymentStatus = 'completed';
          gatewayReference = `TEST_${paymentId.substring(0, 12).toUpperCase()}`;
          metadata.cardLastFour = cleanCard.slice(-4);
        }
      } else {
        // TODO: Integrate real payment gateway here
        paymentStatus = 'pending';
        gatewayReference = `PROD_${paymentId.substring(0, 12).toUpperCase()}`;
        metadata.cardLastFour = cleanCard.slice(-4);
      }
    } else if (paymentMethod === 'cash') {
      paymentStatus = 'completed';
    } else {
      paymentStatus = 'pending';
    }

    // Save payment and update booking
    await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO payments (
          id, tenant_id, booking_id, user_id, amount, currency, payment_method, payment_gateway_reference, status, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [paymentId, request.user!.tenantId, bookingId, request.user!.userId, amount, currency, paymentMethod, gatewayReference, paymentStatus, JSON.stringify(metadata)]
      );

      if (paymentStatus === 'completed') {
        await conn.execute(
          `UPDATE bookings SET payment_status = 'paid', status = 'confirmed', updated_at = NOW() WHERE id = ? AND tenant_id = ?`,
          [bookingId, request.user!.tenantId]
        );
      }
    });

    const clientInfo = extractClientInfo(request);
    await createAuditLog({
      tenantId: request.user!.tenantId,
      userId: request.user!.userId,
      action: 'payment.create',
      resourceType: 'payment',
      resourceId: paymentId,
      changes: { bookingId, amount, currency, paymentMethod, status: paymentStatus },
      ...clientInfo,
    });

    return NextResponse.json({
      success: true,
      paymentId,
      transactionRef: gatewayReference,
      status: paymentStatus,
      message: 'Payment processed successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ error: 'Failed to process payment', code: 'PAYMENT_ERROR' }, { status: 500 });
  }
});
