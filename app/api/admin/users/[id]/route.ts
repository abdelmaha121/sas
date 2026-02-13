import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';
import { User } from '@/lib/types/database';

export const GET = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const users = await query<User[]>(
        `SELECT id, tenant_id, email, phone, first_name, last_name, role, status,
                avatar_url, preferences, last_login_at, created_at, updated_at
         FROM users
         WHERE id = ? AND tenant_id = ?
         LIMIT 1`,
        [params.id, request.user!.tenantId]
      );

      if (users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ user: users[0] });
    } catch (error) {
      console.error('Get user error:', error);
      return NextResponse.json(
        { error: 'Failed to get user' },
        { status: 500 }
      );
    }
  }
);

export const PUT = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const body = await request.json();
      const { firstName, lastName, phone, role, status, preferences } = body;

      const users = await query<User[]>(
        'SELECT * FROM users WHERE id = ? AND tenant_id = ? LIMIT 1',
        [params.id, request.user!.tenantId]
      );

      if (users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (firstName !== undefined) {
        updates.push('first_name = ?');
        values.push(firstName);
      }
      if (lastName !== undefined) {
        updates.push('last_name = ?');
        values.push(lastName);
      }
      if (phone !== undefined) {
        updates.push('phone = ?');
        values.push(phone);
      }
      if (role !== undefined) {
        updates.push('role = ?');
        values.push(role);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }
      if (preferences !== undefined) {
        updates.push('preferences = ?');
        values.push(JSON.stringify(preferences));
      }

      if (updates.length > 0) {
        await query(
          `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND tenant_id = ?`,
          [...values, params.id, request.user!.tenantId]
        );

        const clientInfo = extractClientInfo(request);
        await createAuditLog({
          tenantId: request.user!.tenantId,
          userId: request.user!.userId,
          action: 'admin.user.update',
          resourceType: 'user',
          resourceId: params.id,
          changes: body,
          ...clientInfo,
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update user error:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      if (params.id === request.user!.userId) {
        return NextResponse.json(
          { error: 'Cannot delete your own account' },
          { status: 400 }
        );
      }

      await query(
        'DELETE FROM users WHERE id = ? AND tenant_id = ?',
        [params.id, request.user!.tenantId]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'admin.user.delete',
        resourceType: 'user',
        resourceId: params.id,
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete user error:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  }
);
