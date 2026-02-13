import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

export const GET = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const parentId = searchParams.get('parent_id');
      const includeInactive = searchParams.get('include_inactive') === 'true';

      let whereConditions = ['tenant_id = ?'];
      const params: any[] = [request.user!.tenantId];

      if (parentId) {
        whereConditions.push('parent_id = ?');
        params.push(parentId);
      } else if (parentId === null) {
        whereConditions.push('parent_id IS NULL');
      }

      if (!includeInactive) {
        whereConditions.push('is_active = TRUE');
      }

      const whereClause = whereConditions.join(' AND ');

      const categories = await query<any[]>(
        `SELECT * FROM service_categories
         WHERE ${whereClause}
         ORDER BY display_order ASC, name ASC`,
        params
      );

      return NextResponse.json({ categories });
    } catch (error) {
      console.error('Get categories error:', error);
      return NextResponse.json(
        { error: 'Failed to get categories' },
        { status: 500 }
      );
    }
  }
);

export const POST = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { name, nameAr, description, iconUrl, parentId, displayOrder, isActive } = body;

      if (!name) {
        return NextResponse.json(
          { error: 'Category name is required' },
          { status: 400 }
        );
      }

      const { v4: uuidv4 } = await import('uuid');
      const categoryId = uuidv4();

      await query(
        `INSERT INTO service_categories (
          id, tenant_id, name, name_ar, description, icon_url,
          parent_id, display_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          categoryId,
          request.user!.tenantId,
          name,
          nameAr || null,
          description || null,
          iconUrl || null,
          parentId || null,
          displayOrder || 0,
          isActive !== false,
        ]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'admin.category.create',
        resourceType: 'category',
        resourceId: categoryId,
        changes: { name, nameAr },
        ...clientInfo,
      });

      return NextResponse.json(
        { success: true, categoryId },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create category error:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }
  }
);
