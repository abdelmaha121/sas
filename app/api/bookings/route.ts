import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import pool, { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';
import { v4 as uuidv4 } from 'uuid';

/* =====================================================
   GET /api/bookings
===================================================== */
export const GET = requireAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const customerId = searchParams.get('customer_id');

      // Verify user can only view their own bookings
      if (customerId && customerId !== request.user!.userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const bookings = await query<any[]>(
        `SELECT 
          b.*,
          sp.business_name as provider_name,
          sp.business_name_ar as provider_name_ar,
          s.name as service_name,
          s.name_ar as service_name_ar,
          s.description as service_description,
          CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review
         FROM bookings b
         LEFT JOIN service_providers sp ON b.provider_id = sp.id
         LEFT JOIN services s ON b.service_id = s.id
         LEFT JOIN reviews r ON b.id = r.booking_id
         WHERE b.customer_id = ? AND b.tenant_id = ?
         ORDER BY b.scheduled_at DESC`,
        [request.user!.userId, request.user!.tenantId]
      );

      return NextResponse.json({
        success: true,
        data: { bookings }
      });
    } catch (error) {
      console.error('Get bookings list error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }
  }
);

/* =====================================================
   POST /api/bookings
   Transaction + Row-level Locking
===================================================== */
export const POST = requireAuth(async (request: AuthenticatedRequest) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const body = await request.json();
    const { serviceId, providerId, scheduledAt, customerAddress, notes, addons, paymentType = 'instant' } = body;

    // Validate payment type
    const allowedPaymentTypes = ['instant', 'cash_on_delivery'];
    if (!allowedPaymentTypes.includes(paymentType)) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Invalid payment type. Must be either "instant" or "cash_on_delivery"' },
        { status: 400 }
      );
    }

    if (!serviceId || !providerId || !scheduledAt) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Service ID, Provider ID, and scheduled time are required' },
        { status: 400 }
      );
    }

    const formattedScheduledAt = scheduledAt.replace('T', ' ').slice(0, 19);

    /* =========================
       جلب الخدمة + FOR UPDATE
    ========================= */
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
        { error: 'Service not found or not available' },
        { status: 404 }
      );
    }

    const service = services[0];

    // Validate payment type against service's allowed payment methods
    const allowedPaymentMethods = service.payment_methods ? (typeof service.payment_methods === 'string' ? JSON.parse(service.payment_methods) : service.payment_methods) : ['instant'];
    if (!allowedPaymentMethods.includes(paymentType)) {
      await connection.rollback();
      return NextResponse.json(
        { error: `Payment type '${paymentType}' is not allowed for this service. Allowed methods: ${allowedPaymentMethods.join(', ')}` },
        { status: 400 }
      );
    }
    const requestedDuration = service.duration_minutes || 60;

    /* =========================
       التحقق من التعارض + FOR UPDATE
    ========================= */
    const [conflicts]: any[] = await connection.execute(
      `SELECT b.id
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.provider_id = ?
         AND b.tenant_id = ?
         AND b.status NOT IN ('pending', 'cancelled', 'refunded')
         AND (
           ? < DATE_ADD(b.scheduled_at, INTERVAL COALESCE(s.duration_minutes, 60) MINUTE)
           AND DATE_ADD(?, INTERVAL ? MINUTE) > b.scheduled_at
         )
       FOR UPDATE`,
      [providerId, request.user!.tenantId, formattedScheduledAt, formattedScheduledAt, requestedDuration]
    );

    if (conflicts.length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: 'Selected time slot is not available' },
        { status: 409 }
      );
    }

    /* =========================
       حساب السعر + الإضافات
    ========================= */
    let totalAmount = parseFloat(service.base_price);
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

    /* =========================
       إنشاء الحجز
    ========================= */
    const bookingId = uuidv4();

    await connection.execute(
      `INSERT INTO bookings (
        id, tenant_id, customer_id, provider_id, service_id,
        booking_type, status, scheduled_at, total_amount, commission_amount,
        currency, payment_status, payment_type, customer_address, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        request.user!.tenantId,
        request.user!.userId,
        providerId,
        serviceId,
        'one_time',
        'pending',
        formattedScheduledAt,
        totalAmount,
        commissionAmount,
        service.currency,
        'pending',
        paymentType,
        customerAddress ? JSON.stringify(customerAddress) : null,
        notes || null,
      ]
    );

    /* =========================
       ربط الإضافات
    ========================= */
    if (addonIds.length > 0) {
      const placeholders = addonIds.map(() => '?').join(',');

      const [addonsList]: any[] = await connection.execute(
        `SELECT * FROM service_addons WHERE service_id = ? AND id IN (${placeholders})`,
        [serviceId, ...addonIds]
      );

      for (const addon of addonsList) {
        await connection.execute(
          `INSERT INTO booking_addons (booking_id, addon_id, price)
           VALUES (?, ?, ?)`,
          [bookingId, addon.id, addon.price]
        );
      }
    }

    await connection.commit();

    /* =========================
       Audit Log
    ========================= */
    const clientInfo = extractClientInfo(request);
    await createAuditLog({
      tenantId: request.user!.tenantId,
      userId: request.user!.userId,
      action: 'customer.booking.create',
      resourceType: 'booking',
      resourceId: bookingId,
      changes: { serviceId, providerId, totalAmount, paymentType },
      ...clientInfo,
    });

    return NextResponse.json(
      {
        success: true,
        bookingId,
        totalAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
});
