import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { extractClientInfo } from '@/lib/services/audit';

/**
 * GET: جلب سجل تدقيق مفرد بالـ ID
 */
export const GET = requireRole(['admin', 'super_admin'])(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
        const { id } = params;

        const logs = await query<any[]>(
            `SELECT * FROM audit_logs WHERE id = ? AND tenant_id = ? LIMIT 1`,
            [id, request.user!.tenantId]
        );

        if (logs.length === 0) {
            return NextResponse.json({ error: 'Audit log not found' }, { status: 404 });
        }

        return NextResponse.json({ auditLog: logs[0] });
    } catch (error) {
        console.error('Get audit log by ID error:', error);
        return NextResponse.json({ error: 'Failed to get audit log' }, { status: 500 });
    }
});

/**
 * PUT: تحديث سجل (عادة غير شائع، لكن ممكن)
 */
export const PUT = requireRole(['admin', 'super_admin'])(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
        const { id } = params;
        const body = await request.json();

        const updates: string[] = [];
        const values: any[] = [];

        if (body.action !== undefined) { updates.push('action = ?'); values.push(body.action); }
        if (body.resourceType !== undefined) { updates.push('resource_type = ?'); values.push(body.resourceType); }
        if (body.resourceId !== undefined) { updates.push('resource_id = ?'); values.push(body.resourceId); }
        if (body.changes !== undefined) { updates.push('changes = ?'); values.push(JSON.stringify(body.changes)); }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        await query(
            `UPDATE audit_logs SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
            [...values, id, request.user!.tenantId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update audit log error:', error);
        return NextResponse.json({ error: 'Failed to update audit log' }, { status: 500 });
    }
});

/**
 * DELETE: حذف سجل مفرد
 */
export const DELETE = requireRole(['admin', 'super_admin'])(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
        const { id } = params;

        await query(
            `DELETE FROM audit_logs WHERE id = ? AND tenant_id = ?`,
            [id, request.user!.tenantId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete audit log by ID error:', error);
        return NextResponse.json({ error: 'Failed to delete audit log' }, { status: 500 });
    }
});
