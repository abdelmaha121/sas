import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';
import { getTenantFromRequest } from '@/lib/middleware/tenant';

/* =========================
   GET: List Providers
========================= */
export const GET = async (request: NextRequest) => {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(searchParams.get('limit')) || 10);
    const offset = (page - 1) * limit;

    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const whereConditions: string[] = ['sp.tenant_id = ?'];
    const params: any[] = [tenant.id];

    if (status) {
      whereConditions.push('sp.verification_status = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push(`
        (
          sp.business_name LIKE ?
          OR sp.business_name_ar LIKE ?
          OR u.email LIKE ?
        )
      `);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // ⚠️ LIMIT و OFFSET بدون placeholders
    const providersSql = `
      SELECT sp.*, u.email, u.phone, u.first_name, u.last_name
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE ${whereClause}
      ORDER BY sp.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE ${whereClause}
    `;

    const [providers, countResult] = await Promise.all([
      query<any[]>(providersSql, params),
      query<any[]>(countSql, params),
    ]);

    return NextResponse.json({
      providers,
      pagination: {
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json(
      { error: 'Failed to get providers' },
      { status: 500 }
    );
  }
};

/* =========================
   POST: Create Provider
========================= */
export const POST = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const {
        userId,
        businessName,
        businessNameAr,
        description,
        commissionRate,
        mainActivity,
      } = body;

      if (!userId || !businessName) {
        return NextResponse.json(
          { error: 'User ID and business name are required' },
          { status: 400 }
        );
      }

      const users = await query<any[]>(
        'SELECT id, role FROM users WHERE id = ? AND tenant_id = ? LIMIT 1',
        [userId, request.user!.tenantId]
      );

      if (users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const { v4: uuidv4 } = await import('uuid');
      const providerId = uuidv4();

      await query(
        `INSERT INTO service_providers (
          id,
          tenant_id,
          user_id,
          business_name,
          business_name_ar,
          description,
          commission_rate,
          verification_status,
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          providerId,
          request.user!.tenantId,
          userId,
          businessName,
          businessNameAr || null,
          description || null,
          commissionRate || 15.0,
          'pending',
          true,
        ]
      );

      if (users[0].role !== 'provider') {
        await query(
          'UPDATE users SET role = ? WHERE id = ?',
          ['provider', userId]
        );
      }

      const clientInfo = extractClientInfo(request);

      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'admin.provider.create',
        resourceType: 'provider',
        resourceId: providerId,
        changes: { businessName, userId },
        ...clientInfo,
      });

      return NextResponse.json(
        { success: true, providerId },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create provider error:', error);
      return NextResponse.json(
        { error: 'Failed to create provider' },
        { status: 500 }
      );
    }
  }
);
