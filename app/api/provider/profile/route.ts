import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

export const GET = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const providers = await query<any[]>(
        `SELECT sp.*, u.email, u.phone, u.first_name, u.last_name
         FROM service_providers sp
         JOIN users u ON sp.user_id = u.id
         WHERE sp.user_id = ? AND sp.tenant_id = ?
         LIMIT 1`,
        [request.user!.userId, request.user!.tenantId]
      );

      if (providers.length === 0) {
        return NextResponse.json(
          { error: 'Provider profile not found' },
          { status: 404 }
        );
      }

      const provider = providers[0];

      return NextResponse.json({
        provider: {
          ...provider,

          // 🔴 حل المشكلة هنا
          rating: Number(provider.rating) || 0,
          totalReviews: Number(provider.total_reviews) || 0,
        },
      });
    } catch (error) {
      console.error('Get provider profile error:', error);
      return NextResponse.json(
        { error: 'Failed to get provider profile' },
        { status: 500 }
      );
    }
  }
);

export const PUT = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { businessName, businessNameAr, description, kycDocuments } = body;

      const providers = await query<any[]>(
        'SELECT id FROM service_providers WHERE user_id = ? AND tenant_id = ? LIMIT 1',
        [request.user!.userId, request.user!.tenantId]
      );

      if (providers.length === 0) {
        return NextResponse.json(
          { error: 'Provider profile not found' },
          { status: 404 }
        );
      }

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
      if (kycDocuments !== undefined) {
        updates.push('kyc_documents = ?');
        values.push(JSON.stringify(kycDocuments));
      }

      if (updates.length > 0) {
        await query(
          `UPDATE service_providers
           SET ${updates.join(', ')}, updated_at = NOW()
           WHERE id = ? AND tenant_id = ?`,
          [...values, providers[0].id, request.user!.tenantId]
        );

        const clientInfo = extractClientInfo(request);
        await createAuditLog({
          tenantId: request.user!.tenantId,
          userId: request.user!.userId,
          action: 'provider.profile.update',
          resourceType: 'provider',
          resourceId: providers[0].id,
          changes: body,
          ...clientInfo,
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update provider profile error:', error);
      return NextResponse.json(
        { error: 'Failed to update provider profile' },
        { status: 500 }
      );
    }
  }
);
