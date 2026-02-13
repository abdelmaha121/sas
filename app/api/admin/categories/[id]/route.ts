import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

export const GET = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const categories = await query<any[]>(
        'SELECT * FROM service_categories WHERE id = ? AND tenant_id = ? LIMIT 1',
        [params.id, request.user!.tenantId]
      );

      if (categories.length === 0) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ category: categories[0] });
    } catch (error) {
      console.error('Get category error:', error);
      return NextResponse.json(
        { error: 'Failed to get category' },
        { status: 500 }
      );
    }
  }
);

export const PUT = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const body = await request.json();
      const { name, nameAr, description, iconUrl, parentId, displayOrder, isActive } = body;

      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (nameAr !== undefined) {
        updates.push('name_ar = ?');
        values.push(nameAr);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (iconUrl !== undefined) {
        updates.push('icon_url = ?');
        values.push(iconUrl);
      }
      if (parentId !== undefined) {
        updates.push('parent_id = ?');
        values.push(parentId);
      }
      if (displayOrder !== undefined) {
        updates.push('display_order = ?');
        values.push(displayOrder);
      }
      if (isActive !== undefined) {
        updates.push('is_active = ?');
        values.push(isActive);
      }

      if (updates.length > 0) {
        await query(
          `UPDATE service_categories
           SET ${updates.join(', ')}, updated_at = NOW()
           WHERE id = ? AND tenant_id = ?`,
          [...values, params.id, request.user!.tenantId]
        );

        const clientInfo = extractClientInfo(request);
        await createAuditLog({
          tenantId: request.user!.tenantId,
          userId: request.user!.userId,
          action: 'admin.category.update',
          resourceType: 'category',
          resourceId: params.id,
          changes: body,
          ...clientInfo,
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update category error:', error);
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      await query(
        'DELETE FROM service_categories WHERE id = ? AND tenant_id = ?',
        [params.id, request.user!.tenantId]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'admin.category.delete',
        resourceType: 'category',
        resourceId: params.id,
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete category error:', error);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }
  }
);
