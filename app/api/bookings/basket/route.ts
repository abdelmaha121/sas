import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import pool from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/bookings/basket
 * Creates multiple bookings from basket items in a single transaction.
 */
export const POST = requireAuth(async (request: AuthenticatedRequest) => {
  const connection = await pool.getConnection();

  try {
    const body = await request.json();
    const { items, generalNotes, paymentType = 'cash_on_delivery' } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Basket items are required' },
        { status: 400 }
      );
    }

    const allowedPaymentTypes = ['instant', 'cash_on_delivery'];
    if (!allowedPaymentTypes.includes(paymentType)) {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const bookingResults: Array<{
      bookingId: string;
      serviceId: string;
      serviceName: string;
      totalAmount: number;
    }> = [];

    for (const item of items) {
      const {
        serviceId, providerId, scheduledAt, notes,
        addons, isUrgent, recurringType,
      } = item;

      if (!serviceId || !providerId || !scheduledAt) {
        await connection.rollback();
        return NextResponse.json(
          { error: `Missing required fields for service ${serviceId}` },
          { status: 400 }
        );
      }

      const formattedScheduledAt = scheduledAt.replace('T', ' ').slice(0, 19);

      // Fetch service with lock
      const [services]: any[] = await connection.execute(
        `SELECT s.*, sp.commission_rate
         FROM services s
         JOIN service_providers sp ON s.provider_id = sp.id
         WHERE s.id = ? AND s.provider_id = ? AND s.tenant_id = ? AND s.is_active = TRUE
         LIMIT 1
         FOR UPDATE`,
        [serviceId, providerId, request.user!.tenantId]
      );

      if (services.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: `Service ${serviceId} not found or not available` },
          { status: 404 }
        );
      }

      const service = services[0];

      // Validate payment method
      const allowedPaymentMethods = service.payment_methods
        ? (typeof service.payment_methods === 'string' ? JSON.parse(service.payment_methods) : service.payment_methods)
        : ['instant', 'cash_on_delivery'];

      if (!allowedPaymentMethods.includes(paymentType)) {
        await connection.rollback();
        return NextResponse.json(
          { error: `Payment type '${paymentType}' not allowed for service: ${service.name}` },
          { status: 400 }
        );
      }

      // Check time conflicts
      const requestedDuration = service.duration_minutes || 60;
      const [conflicts]: any[] = await connection.execute(
        `SELECT b.id FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE b.provider_id = ? AND b.tenant_id = ?
           AND b.status NOT IN ('pending', 'cancelled', 'refunded')
           AND (? < DATE_ADD(b.scheduled_at, INTERVAL COALESCE(s.duration_minutes, 60) MINUTE)
                AND DATE_ADD(?, INTERVAL ? MINUTE) > b.scheduled_at)
         FOR UPDATE`,
        [providerId, request.user!.tenantId, formattedScheduledAt, formattedScheduledAt, requestedDuration]
      );

      if (conflicts.length > 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: `Time slot not available for service: ${service.name}` },
          { status: 409 }
        );
      }

      // Calculate price
      let totalAmount = parseFloat(service.base_price);

      // Add urgent fee
      if (isUrgent && service.allow_urgent) {
        totalAmount += parseFloat(service.urgent_fee || 0);
      }

      // Add addons
      let addonIds: string[] = [];
      if (Array.isArray(addons) && addons.length > 0) {
        addonIds = addons;
        const placeholders = addonIds.map(() => '?').join(',');
        const [addonsList]: any[] = await connection.execute(
          `SELECT * FROM service_addons WHERE service_id = ? AND id IN (${placeholders})`,
          [serviceId, ...addonIds]
        );
        for (const addon of addonsList) {
          totalAmount += parseFloat(addon.price);
        }
      }

      const commissionAmount = (totalAmount * service.commission_rate) / 100;
      const bookingId = uuidv4();

      // Determine booking type
      let bookingType = 'one_time';
      if (isUrgent) bookingType = 'emergency';
      else if (recurringType && recurringType !== 'none') bookingType = 'recurring';

      const recurrence = recurringType && recurringType !== 'none'
        ? JSON.stringify({ type: recurringType })
        : null;

      // Create booking
      await connection.execute(
        `INSERT INTO bookings (
          id, tenant_id, customer_id, provider_id, service_id,
          booking_type, allow_urgent, min_advance_hours, status, scheduled_at,
          total_amount, urgent_fee, commission_amount, currency_id,
          payment_status, payment_type, customer_address, notes,
          cancellation_type, cancellation_value, free_cancellation_hours,
          recurrence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingId,
          request.user!.tenantId,
          request.user!.userId,
          providerId,
          serviceId,
          bookingType,
          isUrgent ? 1 : 0,
          service.min_advance_hours || 0,
          'pending',
          formattedScheduledAt,
          totalAmount,
          isUrgent ? parseFloat(service.urgent_fee || 0) : 0,
          commissionAmount,
          service.currency || 'OMR',
          'pending',
          paymentType,
          request.user!.userId ? JSON.stringify(item.customerAddress || null) : null,
          (notes || '') + (generalNotes ? `\n${generalNotes}` : ''),
          service.cancellation_type || null,
          service.cancellation_value || null,
          service.free_cancellation_hours || 0,
          recurrence,
        ]
      );

      // Link addons
      if (addonIds.length > 0) {
        const placeholders = addonIds.map(() => '?').join(',');
        const [addonsList]: any[] = await connection.execute(
          `SELECT * FROM service_addons WHERE service_id = ? AND id IN (${placeholders})`,
          [serviceId, ...addonIds]
        );
        for (const addon of addonsList) {
          await connection.execute(
            `INSERT INTO booking_addons (booking_id, addon_id, price) VALUES (?, ?, ?)`,
            [bookingId, addon.id, addon.price]
          );
        }
      }

      bookingResults.push({
        bookingId,
        serviceId,
        serviceName: service.name,
        totalAmount,
      });
    }

    await connection.commit();

    // Audit logs
    const clientInfo = extractClientInfo(request);
    for (const result of bookingResults) {
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'customer.booking.create',
        resourceType: 'booking',
        resourceId: result.bookingId,
        changes: {
          serviceId: result.serviceId,
          totalAmount: result.totalAmount,
          paymentType,
          batchBooking: true,
        },
        ...clientInfo,
      });
    }

    const grandTotal = bookingResults.reduce((sum, r) => sum + r.totalAmount, 0);

    return NextResponse.json(
      {
        success: true,
        bookings: bookingResults,
        totalBookings: bookingResults.length,
        grandTotal,
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    console.error('Basket booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create bookings' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
});
