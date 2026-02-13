import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { getTenantFromRequest } from '@/lib/middleware/tenant';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const providerId = searchParams.get('providerId');
    const date = searchParams.get('date');

    if (!serviceId || !providerId || !date) {
      return NextResponse.json(
        { error: 'Service ID, Provider ID, and date are required' },
        { status: 400 }
      );
    }

    // Get service duration
    const serviceRows = await query<any[]>(
      'SELECT duration_minutes FROM services WHERE id = ? AND tenant_id = ?',
      [serviceId, tenant.id]
    );

    if (serviceRows.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const duration = serviceRows[0].duration_minutes || 60;

    // Get existing bookings for the date
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const bookings = await query<any[]>(
      `SELECT b.scheduled_at, s.duration_minutes
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.provider_id = ?
         AND b.tenant_id = ?
         AND b.status NOT IN ('cancelled', 'refunded')
         AND b.scheduled_at BETWEEN ? AND ?
       ORDER BY b.scheduled_at`,
      [providerId, tenant.id, startOfDay, endOfDay]
    );

    // Generate available time slots (assuming 9 AM to 6 PM working hours)
    const availableSlots: string[] = [];
    const startHour = 9;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotDateTime = `${date} ${slotTime}:00`;

        // Check if this slot conflicts with existing bookings
        let isAvailable = true;
        for (const booking of bookings) {
          const bookingStart = new Date(booking.scheduled_at);
          const bookingEnd = new Date(bookingStart.getTime() + (booking.duration_minutes || 60) * 60000);
          const slotStart = new Date(slotDateTime);
          const slotEnd = new Date(slotStart.getTime() + duration * 60000);

          // Check for overlap
          if (slotStart < bookingEnd && slotEnd > bookingStart) {
            isAvailable = false;
            break;
          }
        }

        if (isAvailable) {
          availableSlots.push(slotTime);
        }
      }
    }

    return NextResponse.json({
      success: true,
      availableSlots,
      duration
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    return NextResponse.json(
      { error: 'Failed to get available slots' },
      { status: 500 }
    );
  }
}
