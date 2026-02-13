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
      const providerId = await getProviderId(request.user!.userId, request.user!.tenantId);

      if (!providerId) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }

      const { searchParams } = new URL(request.url);
      const includeInactive = searchParams.get('include_inactive') === 'true';

      let whereClause = 's.provider_id = ? AND s.tenant_id = ?';
      if (!includeInactive) {
        whereClause += ' AND s.is_active = TRUE';
      }

      console.log( [providerId, request.user!.tenantId])
      const services = await query<any[]>(
        `SELECT s.*, sc.name as category_name, sc.name_ar as category_name_ar
         FROM services s
         JOIN service_categories sc ON s.category_id = sc.id
         WHERE ${whereClause}
         ORDER BY s.created_at DESC`,
        [providerId, request.user!.tenantId]
      );

      return NextResponse.json({ services });
    } catch (error) {
      console.error('Get provider services error:', error);
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
      const providerId = await getProviderId(request.user!.userId, request.user!.tenantId);

      if (!providerId) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }

      const body = await request.json();
      const {
        categoryId,
        name,
        nameAr,
        description,
        descriptionAr,
        basePrice,
        currency,
        durationMinutes,
        pricingType,
        images,
        paymentMethods,
        isActive
      } = body;

      if (!categoryId || !name || !basePrice) {
        return NextResponse.json(
          { error: 'Category, name, and base price are required' },
          { status: 400 }
        );
      }

      // Validate payment methods
      const allowedPaymentMethods = ['instant', 'cash_on_delivery'];
      if (paymentMethods && Array.isArray(paymentMethods)) {
        const invalidMethods = paymentMethods.filter((method: string) => !allowedPaymentMethods.includes(method));
        if (invalidMethods.length > 0) {
          return NextResponse.json(
            { error: `Invalid payment methods: ${invalidMethods.join(', ')}. Allowed: ${allowedPaymentMethods.join(', ')}` },
            { status: 400 }
          );
        }
      }

      const { v4: uuidv4 } = await import('uuid');
      const serviceId = uuidv4();

      await query(
        `INSERT INTO services (
          id, tenant_id, provider_id, category_id, name, name_ar,
          description, description_ar, base_price, currency,
          duration_minutes, pricing_type, images, payment_methods, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          currency || 'SAR',
          durationMinutes || null,
          pricingType || 'fixed',
          images ? JSON.stringify(images) : null,
          paymentMethods ? JSON.stringify(paymentMethods) : JSON.stringify(['instant']),
          isActive !== false,
        ]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'provider.service.create',
        resourceType: 'service',
        resourceId: serviceId,
        changes: { name, basePrice, categoryId },
        ...clientInfo,
      });

      return NextResponse.json(
        { success: true, serviceId },
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
