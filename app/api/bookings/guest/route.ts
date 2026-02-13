import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      service_id,
      scheduled_at,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      notes,
      total_amount,
    } = body;

    if (!service_id || !scheduled_at || !customer_name || !customer_email || !customer_phone || !customer_address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const services = await query<any[]>(
      `SELECT s.*, sp.id as provider_id, sp.commission_rate, sp.business_name
       FROM services s
       JOIN service_providers sp ON s.provider_id = sp.id
       WHERE s.id = ? AND s.is_active = TRUE
       LIMIT 1`,
      [service_id]
    );

    if (services.length === 0) {
      return NextResponse.json(
        { error: 'Service not found or not available' },
        { status: 404 }
      );
    }

    const service = services[0];
    const bookingAmount = total_amount || parseFloat(service.base_price);
    const commissionAmount = (bookingAmount * service.commission_rate) / 100;

    const tenantId = service.tenant_id || '00000000-0000-0000-0000-000000000001';

    const bookingId = uuidv4();
    const customerAddressData = {
      address: customer_address,
      name: customer_name,
      phone: customer_phone,
      email: customer_email,
    };

    await query(
      `INSERT INTO bookings (
        id, tenant_id, customer_id, provider_id, service_id,
        booking_type, status, scheduled_at, total_amount, commission_amount,
        currency, payment_status, customer_address, notes, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        tenantId,
        null,
        service.provider_id,
        service_id,
        'one_time',
        'pending',
        scheduled_at,
        bookingAmount,
        commissionAmount,
        service.currency || 'SAR',
        'pending',
        JSON.stringify(customerAddressData),
        notes || null,
        JSON.stringify({
          guest_booking: true,
          customer_name,
          customer_email,
          customer_phone,
          addon_ids: body.addon_ids || [],
        }),
      ]
    );

    if (body.addon_ids && Array.isArray(body.addon_ids) && body.addon_ids.length > 0) {
      const addons = await query<any[]>(
        `SELECT id, price FROM service_addons WHERE id IN (${body.addon_ids.map(() => '?').join(',')}) AND service_id = ?`,
        [...body.addon_ids, service_id]
      );

      for (const addon of addons) {
        await query(
          `INSERT INTO booking_addons (booking_id, addon_id, price) VALUES (?, ?, ?)`,
          [bookingId, addon.id, addon.price]
        );
      }
    }

    const bookings = await query<any[]>(
      `SELECT b.*,
              sp.business_name as provider_name,
              s.name as service_name
       FROM bookings b
       JOIN service_providers sp ON b.provider_id = sp.id
       JOIN services s ON b.service_id = s.id
       WHERE b.id = ?
       LIMIT 1`,
      [bookingId]
    );

    return NextResponse.json(
      {
        success: true,
        booking: bookings[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create guest booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
