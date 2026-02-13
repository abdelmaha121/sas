import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

/* =========================
   Helpers (API-level validation)
========================= */
const ALLOWED_VERIFICATION_STATUSES = [
  'pending',
  'verified',
  'rejected',
] as const;

type VerificationStatus =
  typeof ALLOWED_VERIFICATION_STATUSES[number];

function normalizeVerificationStatus(
  value: any
): VerificationStatus {
  if (typeof value !== 'string') return 'pending';

  const normalized = value.toLowerCase().trim();

  if (
    ALLOWED_VERIFICATION_STATUSES.includes(
      normalized as VerificationStatus
    )
  ) {
    return normalized as VerificationStatus;
  }

  return 'pending';
}

/* =========================
   GET Provider
========================= */
export const GET = requireRole(['admin', 'super_admin'])(
  async (
    request: AuthenticatedRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const providers = await query<any[]>(
        `SELECT sp.*, u.email, u.phone, u.first_name, u.last_name
         FROM service_providers sp
         JOIN users u ON sp.user_id = u.id
         WHERE sp.id = ? AND sp.tenant_id = ?
         LIMIT 1`,
        [params.id, request.user!.tenantId]
      );

      if (providers.length === 0) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ provider: providers[0] });
    } catch (error) {
      console.error('Get provider error:', error);
      return NextResponse.json(
        { error: 'Failed to get provider' },
        { status: 500 }
      );
    }
  }
);

/* =========================
   UPDATE Provider (FIXED)
========================= */
export const PUT = requireRole(['admin', 'super_admin'])(
  async (
    request: AuthenticatedRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const body = await request.json();
      const {
        businessName,
        businessNameAr,
        description,
        verificationStatus,
        commissionRate,
        isActive,
        featured,
      } = body;

      const updates: string[] = [];
      const values: any[] = [];

      if (businessName !== undefined) {
        updates.push('business_name = ?');
        values.push(businessName);
      }

      if (businessNameAr !== undefined) {
        updates.push('business_name_ar = ?');
        values.push(businessNameAr);
      }

      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }

      if (verificationStatus !== undefined) {
        updates.push('verification_status = ?');
        values.push(
          normalizeVerificationStatus(verificationStatus) // ✅ FIX
        );
      }

      if (commissionRate !== undefined) {
        updates.push('commission_rate = ?');
        values.push(Number(commissionRate));
      }

      if (isActive !== undefined) {
        updates.push('is_active = ?');
        values.push(Boolean(isActive));
      }

      if (featured !== undefined) {
        updates.push('featured = ?');
        values.push(Boolean(featured));
      }

      if (updates.length === 0) {
        return NextResponse.json({ success: true });
      }

      await query(
        `UPDATE service_providers
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = ? AND tenant_id = ?`,
        [...values, params.id, request.user!.tenantId]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'admin.provider.update',
        resourceType: 'provider',
        resourceId: params.id,
        changes: body,
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update provider error:', error);
      return NextResponse.json(
        { error: 'Failed to update provider' },
        { status: 500 }
      );
    }
  }
);

/* =========================
   DELETE Provider
========================= */
export const DELETE = requireRole(['admin', 'super_admin'])(
  async (
    request: AuthenticatedRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      await query(
        'DELETE FROM service_providers WHERE id = ? AND tenant_id = ?',
        [params.id, request.user!.tenantId]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'admin.provider.delete',
        resourceType: 'provider',
        resourceId: params.id,
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete provider error:', error);
      return NextResponse.json(
        { error: 'Failed to delete provider' },
        { status: 500 }
      );
    }
  }
);
