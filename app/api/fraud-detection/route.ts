import { NextResponse } from 'next/server';
import { AISimulator } from '@/lib/services/ai-simulator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, actions } = body;

    if (!userId || !actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'User ID and actions array are required' },
        { status: 400 }
      );
    }

    // TODO: Extract tenantId from request headers or auth
    const tenantId = 'demo-tenant-001'; // Placeholder

    const result = await AISimulator.analyzeFraud({
      userId,
      tenantId,
      actions
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Fraud detection error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze fraud' },
      { status: 500 }
    );
  }
}
