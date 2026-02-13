import { NextResponse } from 'next/server';
import { AISimulator } from '@/lib/services/ai-simulator';
import { getTenantFromRequest } from '@/lib/middleware/tenant';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const providerId = searchParams.get('providerId');

    if (!serviceId || !providerId) {
      return NextResponse.json(
        { error: 'Service ID and Provider ID are required' },
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

    const result = await AISimulator.suggestPricing({
      serviceId,
      providerId,
      tenantId: tenant.id
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to get pricing suggestion' },
      { status: 500 }
    );
  }
}
