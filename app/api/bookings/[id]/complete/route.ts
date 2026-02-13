import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

export const PUT = requireAuth(async (request: any, { params }: any) => {
  try {
    const bookingId = params.id;

    // Only providers can complete services
    if (request.user.role !== 'provider' && request.user.role !== 'provider_staff') {
      return NextResponse.json(
        { error: 'Unauthorized to complete services' },
        { status: 403 }
      );
    }

    const bookings = await query<any[]>(
      `SELECT b.*, sp.user_id as provider_user_id
       FROM bookings b
       JOIN service_providers sp ON b.provider_id = sp.id
       WHERE b.id = ? AND b.tenant_id = ?
       LIMIT 1`,
      [bookingId, request.user.tenantId]
    );

    if (!bookings.length) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    // Check if provider owns this booking
    if (booking.provider_user_id !== request.user.userId) {
      return NextResponse.json(
        { error: 'You can only complete your own bookings' },
        { status: 403 }
      );
    }

    if (booking.status !== 'confirmed' && booking.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Booking must be confirmed or in progress to complete' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE bookings
       SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [bookingId, request.user.tenantId]
    );

    const clientInfo = extractClientInfo(request);
    await createAuditLog({
      tenantId: request.user.tenantId,
      userId: request.user.userId,
      action: 'provider.booking.complete',
      resourceType: 'booking',
      resourceId: bookingId,
      changes: { status: 'completed' },
      ...clientInfo,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to complete booking' },
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
