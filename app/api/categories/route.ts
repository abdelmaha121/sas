import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { getTenantFromRequest } from '@/lib/middleware/tenant';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 400 }
      );
    }

    // جلب جميع الفئات النشطة
    const categories = await query<any[]>(`
      SELECT 
        id,
        name,
        name_ar as nameAr,
        description,
        icon_url as iconUrl,
        display_order as displayOrder,
        is_active as isActive
      FROM service_categories
      WHERE tenant_id = ? AND is_active = TRUE
      ORDER BY display_order ASC, name ASC
    `, [tenant.id]);

    return NextResponse.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          nameAr: cat.nameAr,
          description: cat.description,
          iconUrl: cat.iconUrl,
          displayOrder: cat.displayOrder,
        })),
      },
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}