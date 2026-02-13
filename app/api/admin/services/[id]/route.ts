import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

export const PUT = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const serviceId = params.id;
      const body = await request.json();
      const {
        name, nameAr, description, descriptionAr,
        basePrice, currency, durationMinutes, pricingType, isActive,
        paymentMethods, bookingType, allowRecurring, allowUrgent, urgentFee,
        minAdvanceHours, freeCancellationHours, cancellationType, cancellationValue, availability
      } = body;

      if (!name || !basePrice) {
        return NextResponse.json(
          { error: 'Name and base price are required' },
          { status: 400 }
        );
      }

      // Check if service exists and belongs to tenant
      const existingService = await query<any[]>(
        'SELECT * FROM services WHERE id = ? AND tenant_id = ?',
        [serviceId, request.user!.tenantId]
      );

      if (existingService.length === 0) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }

      await query(
        `UPDATE services SET
          name = ?, name_ar = ?, description = ?, description_ar = ?,
          base_price = ?, currency = ?, duration_minutes = ?,
          pricing_type = ?, is_active = ?, payment_methods = ?, booking_type = ?,
          allow_recurring = ?, allow_urgent = ?, urgent_fee = ?, min_advance_hours = ?,
          free_cancellation_hours = ?, cancellation_type = ?, cancellation_value = ?,
          availability = ?, updated_at = NOW()
         WHERE id = ? AND tenant_id = ?`,
        [
          name,
          nameAr || null,
          description || null,
          descriptionAr || null,
          basePrice,
          currency || 'OMR',
          durationMinutes || null,
          pricingType || 'fixed',
          isActive !== false,
          paymentMethods ? JSON.stringify(paymentMethods) : null,
          bookingType || 'instant',
          allowRecurring ? 1 : 0,
          allowUrgent ? 1 : 0,
          urgentFee || null,
          minAdvanceHours || 24,
          freeCancellationHours || 24,
          cancellationType || 'percentage',
          cancellationValue || 20,
          availability ? JSON.stringify(availability) : null,
          serviceId,
          request.user!.tenantId,
        ]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'admin.service.update',
        resourceType: 'service',
        resourceId: serviceId,
        changes: { name, basePrice, isActive },
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update admin service error:', error);
      return NextResponse.json(
        { error: 'Failed to update service' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const serviceId = params.id;

      // Check if service exists and belongs to tenant
      const existingService = await query<any[]>(
        'SELECT * FROM services WHERE id = ? AND tenant_id = ?',
        [serviceId, request.user!.tenantId]
      );

      if (existingService.length === 0) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }

      await query(
        'DELETE FROM services WHERE id = ? AND tenant_id = ?',
        [serviceId, request.user!.tenantId]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'admin.service.delete',
        resourceType: 'service',
        resourceId: serviceId,
        changes: { deleted: true },
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete admin service error:', error);
      return NextResponse.json(
        { error: 'Failed to delete service' },
        { status: 500 }
      );
    }
  }
);
