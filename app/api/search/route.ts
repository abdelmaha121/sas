import { NextResponse } from 'next/server';
import { AISimulator } from '@/lib/services/ai-simulator';
import { getTenantFromRequest } from '@/lib/middleware/tenant';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || undefined;
    const location = searchParams.get('location') || undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;

    if (!query) {
      return NextResponse.json({
        services: [],
        providers: [],
        explanation: 'No search query provided'
      });
    }

    // Extract tenant from request
    const tenant = await getTenantFromRequest(request as any);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 400 }
      );
    }

    const result = await AISimulator.smartSearch({
      query,
      category,
      location,
      minRating,
      maxPrice
    }, tenant.id);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
