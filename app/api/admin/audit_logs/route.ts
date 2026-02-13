import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { v4 as uuidv4 } from 'uuid';
import { extractClientInfo } from '@/lib/services/audit';

/**
 * GET: جلب سجلات التدقيق مع فلاتر وتصفح
 */
export const GET = requireRole(['admin', 'super_admin'])(async (request: AuthenticatedRequest) => {
    try {
        const { searchParams } = new URL(request.url);

        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
        const limit = Math.max(parseInt(searchParams.get('limit') || '20', 10), 1);
        const offset = (page - 1) * limit;

        const action = searchParams.get('action');
        const resourceType = searchParams.get('resource_type');
        const userId = searchParams.get('user_id');
        const search = searchParams.get('search')?.trim();

        let whereConditions = ['tenant_id = ?'];
        const params: any[] = [request.user!.tenantId];

        if (action) { whereConditions.push('action = ?'); params.push(action); }
        if (resourceType) { whereConditions.push('resource_type = ?'); params.push(resourceType); }
        if (userId) { whereConditions.push('user_id = ?'); params.push(userId); }
        if (search) {
            whereConditions.push('(resource_id LIKE ? OR JSON_EXTRACT(changes, "$") LIKE ?)');
            const pattern = `%${search}%`;
            params.push(pattern, pattern);
        }

        const whereClause = whereConditions.join(' AND ');

        const logsQuery = `
      SELECT *
      FROM audit_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

        const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs
      WHERE ${whereClause}
    `;

        const [logs, countResult] = await Promise.all([
            query<any[]>(logsQuery, params),
            query<any[]>(countQuery, params),
        ]);

        return NextResponse.json({
            auditLogs: logs,
            pagination: {
                total: countResult[0].total,
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit),
            },
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        return NextResponse.json({ error: 'Failed to get audit logs' }, { status: 500 });
    }
});

/**
 * POST: إضافة سجل تدقيق جديد
 */
export const POST = requireRole(['admin', 'super_admin'])(async (request: AuthenticatedRequest) => {
    try {
        const body = await request.json();
        const { action, resourceType, resourceId, changes } = body;

        const clientInfo = extractClientInfo(request);

        await query(
            `
      INSERT INTO audit_logs 
      (id, tenant_id, user_id, action, resource_type, resource_id, changes, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
            [
                uuidv4(),
                request.user!.tenantId,
                request.user!.userId,
                action,
                resourceType,
                resourceId,
                JSON.stringify(changes || {}),
                clientInfo.ipAddress,
                clientInfo.userAgent,
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Create audit log error:', error);
        return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
    }
});

/**
 * DELETE: حذف سجل واحد بالـ ID
 */
export const DELETE = requireRole(['admin', 'super_admin'])(async (request: AuthenticatedRequest) => {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await query(
            `DELETE FROM audit_logs WHERE id = ? AND tenant_id = ?`,
            [id, request.user!.tenantId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete audit log error:', error);
        return NextResponse.json({ error: 'Failed to delete audit log' }, { status: 500 });
    }
});

/**
 * DELETE_MULTIPLE: حذف سجلات متعددة بناءً على قائمة IDs
 * تستقبل body: { ids: string[] }
 */
export const DELETE_MULTIPLE = requireRole(['admin', 'super_admin'])(async (request: AuthenticatedRequest) => {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
        }

        const placeholders = ids.map(() => '?').join(',');
        await query(
            `DELETE FROM audit_logs WHERE id IN (${placeholders}) AND tenant_id = ?`,
            [...ids, request.user!.tenantId]
        );

        return NextResponse.json({ success: true, deletedCount: ids.length });
    } catch (error) {
        console.error('Delete multiple audit logs error:', error);
        return NextResponse.json({ error: 'Failed to delete multiple audit logs' }, { status: 500 });
    }
});
