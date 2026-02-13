import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';



export const GET = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const tenantId = request.user?.tenantId;
      const providerId = request.user?.providerId;

      if (!tenantId || !providerId) {
        return NextResponse.json({ error: 'Missing tenantId or providerId' }, { status: 400 });
      }

      const staff = await query<any[]>(
        `SELECT ps.*, u.email, u.phone, u.first_name, u.last_name
         FROM provider_staff ps
         JOIN users u ON ps.user_id = u.id
         WHERE ps.tenant_id = ? AND ps.provider_id = ?`,
        [tenantId, providerId]
      );

      return NextResponse.json({ staff });
    } catch (error) {
      console.error('Get provider staff error:', error);
      return NextResponse.json({ error: 'Failed to fetch provider staff' }, { status: 500 });
    }
  }
);


export const GET_AVAILABLE_USERS = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const tenantId = request.user?.tenantId;
      const providerId = request.user?.providerId;

      if (!tenantId || !providerId) {
        return NextResponse.json({ error: 'Missing tenantId or providerId' }, { status: 400 });
      }

      const users = await query<any[]>(
        `SELECT id, email, first_name, last_name, phone
         FROM users
         WHERE tenant_id = ?
         AND role = 'provider_staff'
         AND id NOT IN (SELECT user_id FROM provider_staff WHERE provider_id = ? AND tenant_id = ?)`,
        [tenantId, providerId, tenantId]
      );

      return NextResponse.json({ users });
    } catch (error) {
      console.error('Get available users error:', error);
      return NextResponse.json({ error: 'Failed to fetch available users' }, { status: 500 });
    }
  }
);



export const POST = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { userId, role, permissions, isActive } = body;

      const tenantId = request.user?.tenantId;
      const providerId = request.user?.providerId;
      const currentUserId = request.user?.userId;

      if (!tenantId || !providerId || !currentUserId) {
        return NextResponse.json({ error: 'Missing tenantId, providerId, or userId' }, { status: 400 });
      }

      if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
      }

      // تحقق أن المستخدم غير موجود بالفعل في الفريق
      const existing = await query<any[]>(
        `SELECT 1 FROM provider_staff WHERE tenant_id = ? AND provider_id = ? AND user_id = ?`,
        [tenantId, providerId, userId]
      );

      if (existing.length > 0) {
        return NextResponse.json({ error: 'User already in provider staff' }, { status: 400 });
      }

      const result = await query<any>(
        `INSERT INTO provider_staff
         (tenant_id, provider_id, user_id, role, permissions, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          providerId,
          userId,
          role ?? null,
          permissions ? JSON.stringify(permissions) : null,
          isActive ?? 1,
        ]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId,
        userId: currentUserId,
        action: 'provider.staff.create',
        resourceType: 'provider_staff',
        resourceId: result.insertId,
        changes: body,
        ...clientInfo,
      });

      return NextResponse.json({ success: true, id: result.insertId });
    } catch (error) {
      console.error('Create provider staff error:', error);
      return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
    }
  }
);



export const PUT = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { id, role, permissions, isActive } = body;

      const tenantId = request.user?.tenantId;
      const providerId = request.user?.providerId;
      const currentUserId = request.user?.userId;

      if (!tenantId || !providerId || !currentUserId) {
        return NextResponse.json({ error: 'Missing tenantId, providerId, or userId' }, { status: 400 });
      }

      if (!id) {
        return NextResponse.json({ error: 'Staff id is required' }, { status: 400 });
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (role !== undefined) {
        updates.push('role = ?');
        values.push(role ?? null);
      }

      if (permissions !== undefined) {
        updates.push('permissions = ?');
        values.push(permissions ? JSON.stringify(permissions) : null);
      }

      if (isActive !== undefined) {
        updates.push('is_active = ?');
        values.push(isActive ?? 1);
      }

      if (updates.length === 0) {
        return NextResponse.json({ success: true });
      }

      await query(
        `UPDATE provider_staff
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = ? AND tenant_id = ? AND provider_id = ?`,
        [...values, id, tenantId, providerId]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId,
        userId: currentUserId,
        action: 'provider.staff.update',
        resourceType: 'provider_staff',
        resourceId: id,
        changes: body,
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update provider staff error:', error);
      return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
    }
  }
);


export const DELETE = requireRole(['provider', 'admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { ids } = body; // مصفوفة IDs

      const tenantId = request.user?.tenantId;
      const providerId = request.user?.providerId;
      const currentUserId = request.user?.userId;

      if (!tenantId || !providerId || !currentUserId) {
        return NextResponse.json({ error: 'Missing tenantId, providerId, or userId' }, { status: 400 });
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
      }

      const filteredIds = ids.filter(Boolean);
      if (filteredIds.length === 0) {
        return NextResponse.json({ error: 'No valid IDs provided' }, { status: 400 });
      }

      await query(
        `DELETE FROM provider_staff
         WHERE id IN (${filteredIds.map(() => '?').join(',')})
         AND tenant_id = ?
         AND provider_id = ?`,
        [...filteredIds, tenantId, providerId]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId,
        userId: currentUserId,
        action: 'provider.staff.delete',
        resourceType: 'provider_staff',
        resourceId: filteredIds.join(','),
        changes: { ids: filteredIds },
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete provider staff error:', error);
      return NextResponse.json({ error: 'Failed to delete staff members' }, { status: 500 });
    }
  }
);
