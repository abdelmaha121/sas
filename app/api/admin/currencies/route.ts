import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export async function GET() {
  try {
    const currencies = await query(
      'SELECT id, tenant_id, code, name, symbol, is_default, is_active, created_at, updated_at FROM currencies ORDER BY is_default DESC, code ASC'
    );

    return NextResponse.json(currencies);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, symbol, isDefault, isActive, tenantId = 'demo-tenant-001' } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await query(
        'UPDATE currencies SET is_default = 0 WHERE tenant_id = ?',
        [tenantId]
      );
    }

    const result = await query(
      'INSERT INTO currencies (tenant_id, code, name, symbol, is_default, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [tenantId, code, name, symbol, isDefault ? 1 : 0, isActive ? 1 : 0]
    );

    return NextResponse.json({
      message: 'Currency created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating currency:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
