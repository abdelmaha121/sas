import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/mysql';

export interface AuditLogData {
  tenantId: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  const id = uuidv4();

  await query(
    `INSERT INTO audit_logs (
      id, tenant_id, user_id, action, resource_type, resource_id,
      changes, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.tenantId,
      data.userId || null,
      data.action,
      data.resourceType || null,
      data.resourceId || null,
      data.changes ? JSON.stringify(data.changes) : null,
      data.ipAddress || null,
      data.userAgent || null,
    ]
  );
}

export function extractClientInfo(request: Request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}
