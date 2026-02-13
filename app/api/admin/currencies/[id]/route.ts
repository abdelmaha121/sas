import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db/mysql';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, symbol, isDefault, isActive, tenantId = session.user.tenantId } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await query(
        'UPDATE currencies SET is_default = 0 WHERE tenant_id = ? AND id != ?',
        [tenantId, params.id]
      );
    }

    await query(
      'UPDATE currencies SET name = ?, symbol = ?, is_default = ?, is_active = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
      [name, symbol, isDefault ? 1 : 0, isActive ? 1 : 0, params.id, tenantId]
    );

    return NextResponse.json({ message: 'Currency updated successfully' });
  } catch (error) {
    console.error('Error updating currency:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if currency is in use
    const [bookingsCount] = await query(
      'SELECT COUNT(*) as count FROM bookings WHERE currency_id = ?',
      [params.id]
    );

    const [paymentsCount] = await query(
      'SELECT COUNT(*) as count FROM payments WHERE currency_id = ?',
      [params.id]
    );

    const [walletsCount] = await query(
      'SELECT COUNT(*) as count FROM wallets WHERE currency_id = ?',
      [params.id]
    );

    if (bookingsCount.count > 0 || paymentsCount.count > 0 || walletsCount.count > 0) {
      return NextResponse.json({
        error: 'Cannot delete currency that is in use'
      }, { status: 400 });
    }

    await query('DELETE FROM currencies WHERE id = ?', [params.id]);

    return NextResponse.json({ message: 'Currency deleted successfully' });
  } catch (error) {
    console.error('Error deleting currency:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
