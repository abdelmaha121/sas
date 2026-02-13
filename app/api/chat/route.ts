import { NextResponse } from 'next/server';
import { AISimulator } from '@/lib/services/ai-simulator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, userId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await AISimulator.handleChat({
      message,
      userId
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
