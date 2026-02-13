import { NextResponse } from 'next/server';
import { AISimulator } from '@/lib/services/ai-simulator';
import { getTenantFromRequest } from '@/lib/middleware/tenant';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Extract tenant from request
    const tenant = await getTenantFromRequest(request as any);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 400 }
      );
    }

    const result = await AISimulator.getRecommendations({
      userId,
      tenantId: tenant.id,
      limit
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
