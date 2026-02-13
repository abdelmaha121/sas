import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import pool, { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';
import { v4 as uuidv4 } from 'uuid';

/* =====================================================
   PUT /api/bookings/[id] - Update booking status
===================================================== */
export const PUT = requireAuth(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const bookingId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status || !['completed', 'cancelled'].includes(status)) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Invalid status. Must be "completed" or "cancelled"' },
        { status: 400 }
      );
    }

    // Get booking details with FOR UPDATE
    const [bookings]: any[] = await connection.execute(
      `SELECT b.*, sp.user_id as provider_user_id
       FROM bookings b
       JOIN service_providers sp ON b.provider_id = sp.id
       WHERE b.id = ? AND b.tenant_id = ?
       FOR UPDATE`,
      [bookingId, request.user!.tenantId]
    );

    if (bookings.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = bookings[0];

    // Check permissions: customer can cancel, provider/admin can complete or cancel
    const isProvider = booking.provider_user_id === request.user!.userId;
    const isAdmin = ['admin', 'super_admin'].includes(request.user!.role);
    const isCustomer = booking.customer_id === request.user!.userId;

    if (status === 'completed' && !isProvider && !isAdmin) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Only provider or admin can mark booking as completed' },
        { status: 403 }
      );
    }

    if (status === 'cancelled' && !isCustomer && !isProvider && !isAdmin) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Unauthorized to cancel this booking' },
        { status: 403 }
      );
    }

    // Update booking status
    await connection.execute(
      `UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, bookingId]
    );

    // If completing a cash_on_delivery booking, deduct commission from provider's wallet
    if (status === 'completed' && booking.payment_type === 'cash_on_delivery' && booking.commission_amount > 0) {
      // Get or create provider's wallet
      const [wallets]: any[] = await connection.execute(
        `SELECT * FROM wallets WHERE user_id = ? AND tenant_id = ? FOR UPDATE`,
        [booking.provider_user_id, request.user!.tenantId]
      );

      let wallet;
      if (wallets.length === 0) {
        const walletId = uuidv4();
        await connection.execute(
          `INSERT INTO wallets (id, tenant_id, user_id, balance, currency_id)
           VALUES (?, ?, ?, ?, ?)`,
          [walletId, request.user!.tenantId, booking.provider_user_id, 0.00, 'SAR']
        );
        wallet = { id: walletId, balance: 0.00 };
      } else {
        wallet = wallets[0];
      }

      // Deduct commission (allow negative balance)
      const newBalance = parseFloat(wallet.balance) - parseFloat(booking.commission_amount);

      await connection.execute(
        `UPDATE wallets SET balance = ? WHERE id = ?`,
        [newBalance, wallet.id]
      );

      // Add transaction
      const transactionId = uuidv4();
      await connection.execute(
        `INSERT INTO wallet_transactions (id, wallet_id, type, amount, balance_after, reference_type, reference_id, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          wallet.id,
          'debit',
          booking.commission_amount,
          newBalance,
          'booking',
          bookingId,
          `Commission deduction for completed booking ${bookingId}`
        ]
      );
    }

    await connection.commit();

    // Audit log
    const clientInfo = extractClientInfo(request);
    await createAuditLog({
      tenantId: request.user!.tenantId,
      userId: request.user!.userId,
      action: `booking.${status}`,
      resourceType: 'booking',
      resourceId: bookingId,
      changes: { status },
      ...clientInfo,
    });

    return NextResponse.json({
      success: true,
      message: `Booking ${status} successfully`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
});
