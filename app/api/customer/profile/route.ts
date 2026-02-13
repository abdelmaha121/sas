import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';

export async function PUT(request: NextRequest) {
  try {
    const authUser = await authenticate(request);

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, address } = body;

    // Validation
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      return NextResponse.json(
        { error: 'First name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (lastName && (typeof lastName !== 'string' || lastName.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Last name must be a non-empty string if provided' },
        { status: 400 }
      );
    }

    if (phone && (typeof phone !== 'string' || !/^\+?[0-9\s\-\(\)]+$/.test(phone))) {
      return NextResponse.json(
        { error: 'Phone number must be a valid format' },
        { status: 400 }
      );
    }

    if (address && typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address must be a string' },
        { status: 400 }
      );
    }

    // Update user profile
    await query(
      `UPDATE users
       SET first_name = ?, last_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [
        firstName.trim(),
        lastName ? lastName.trim() : null,
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        authUser.userId,
        authUser.tenantId
      ]
    );

    return NextResponse.json({
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
