import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth/jwt';
import { authenticate } from '@/lib/middleware/auth';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);

    if (user) {
      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: user.tenantId,
        userId: user.userId,
        action: 'user.logout',
        resourceType: 'user',
        resourceId: user.userId,
        ...clientInfo,
      });
    }

    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', clearAuthCookie());

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
