import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

async function getProviderId(userId: string, tenantId: string): Promise<string | null> {
  const providers = await query<any[]>(
    'SELECT id FROM service_providers WHERE user_id = ? AND tenant_id = ? LIMIT 1',
    [userId, tenantId]
  );
  return providers.length > 0 ? providers[0].id : null;
}

export const GET = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const includeInactive = searchParams.get('include_inactive') === 'true';

      let whereClause = 's.tenant_id = ?';
      const params: any[] = [request.user!.tenantId];

      // If not admin or super_admin, filter by provider
      if (request.user!.role !== 'admin' && request.user!.role !== 'super_admin') {
        const providerId = await getProviderId(request.user!.userId, request.user!.tenantId);

        if (!providerId) {
          return NextResponse.json(
            { error: 'Provider not found' },
            { status: 404 }
          );
        }

        whereClause += ' AND s.provider_id = ?';
        params.push(providerId);
      }

      if (!includeInactive) {
        whereClause += ' AND s.is_active = TRUE';
      }

      const services = await query<any[]>(
        `SELECT
          s.id, s.tenant_id, s.provider_id, s.category_id,
          s.name, s.name_ar, s.description, s.description_ar,
          s.base_price, s.currency, s.duration_minutes, s.pricing_type,
          s.is_active, s.images, s.metadata, s.created_at, s.updated_at,
          s.payment_methods, s.booking_type, s.allow_recurring, s.allow_urgent,
          s.urgent_fee, s.min_advance_hours, s.free_cancellation_hours,
          s.cancellation_type, s.cancellation_value, s.availability,
          sc.name as category_name, sc.name_ar as category_name_ar,
          sp.business_name as provider_name
         FROM services s
         LEFT JOIN service_categories sc ON s.category_id = sc.id
         LEFT JOIN service_providers sp ON s.provider_id = sp.id
         WHERE ${whereClause}
         ORDER BY s.created_at DESC`,
        params
      );

      return NextResponse.json({
        success: true,
        data: { services }
      });
    } catch (error) {
      console.error('Get services error:', error);
      return NextResponse.json(
        { error: 'Failed to get services' },
        { status: 500 }
      );
    }
  }
);

export const POST = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      let providerId: string;

      const body = await request.json();
      const {
        providerId: bodyProviderId, categoryId, name, nameAr, description, descriptionAr,
        basePrice, currency, durationMinutes, pricingType, images, isActive, metadata,
        paymentMethods, bookingType, allowRecurring, allowUrgent, urgentFee,
        minAdvanceHours, freeCancellationHours, cancellationType, cancellationValue, availability
      } = body;

      if (!categoryId || !name || !basePrice) {
        return NextResponse.json(
          { error: 'Category, name, and base price are required' },
          { status: 400 }
        );
      }

      // If admin or super_admin, use providerId from body, else get from user
      if (request.user!.role === 'admin' || request.user!.role === 'super_admin') {
        if (!bodyProviderId) {
          return NextResponse.json(
            { error: 'Provider is required for admin users' },
            { status: 400 }
          );
        }
        providerId = bodyProviderId;
      } else {
        const providerIdResult = await getProviderId(request.user!.userId, request.user!.tenantId);

        if (!providerIdResult) {
          return NextResponse.json(
            { error: 'Provider not found' },
            { status: 404 }
          );
        }

        providerId = providerIdResult;
      }

      // Validate pricing_type enum
      const validPricingTypes = ['fixed', 'hourly', 'custom'];
      if (pricingType && !validPricingTypes.includes(pricingType)) {
        return NextResponse.json(
          { error: 'Invalid pricing type. Must be one of: fixed, hourly, custom' },
          { status: 400 }
        );
      }

      const { v4: uuidv4 } = await import('uuid');
      const serviceId = uuidv4();

      await query(
        `INSERT INTO services (
          id, tenant_id, provider_id, category_id, name, name_ar,
          description, description_ar, base_price, currency,
          duration_minutes, pricing_type, images, metadata, is_active,
          payment_methods, booking_type, allow_recurring, allow_urgent,
          urgent_fee, min_advance_hours, free_cancellation_hours,
          cancellation_type, cancellation_value, availability
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serviceId,
          request.user!.tenantId,
          providerId,
          categoryId,
          name,
          nameAr || null,
          description || null,
          descriptionAr || null,
          basePrice,
          currency || 'OMR',
          durationMinutes || null,
          pricingType || 'fixed',
          images ? JSON.stringify(images) : null,
          metadata ? JSON.stringify(metadata) : null,
          isActive !== false ? 1 : 0,
          paymentMethods ? JSON.stringify(paymentMethods) : JSON.stringify(['instant', 'cash_on_delivery']),
          bookingType || 'instant',
          allowRecurring ? 1 : 0,
          allowUrgent ? 1 : 0,
          urgentFee || null,
          minAdvanceHours || 24,
          freeCancellationHours || 24,
          cancellationType || 'percentage',
          cancellationValue || 20,
          availability ? JSON.stringify(availability) : null,
        ]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: request.user!.role === 'admin' || request.user!.role === 'super_admin' ? 'admin.service.create' : 'provider.service.create',
        resourceType: 'service',
        resourceId: serviceId,
        changes: { name, nameAr, basePrice, categoryId, pricingType },
        ...clientInfo,
      });

      return NextResponse.json(
        { success: true, data: { serviceId } },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create service error:', error);
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      );
    }
  }
);
