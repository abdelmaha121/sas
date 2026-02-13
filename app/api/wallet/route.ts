import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { v4 as uuidv4 } from 'uuid';

export const GET = requireAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const wallets = await query<any[]>(
        `SELECT * FROM wallets
         WHERE user_id = ? AND tenant_id = ?
         LIMIT 1`,
        [request.user!.userId, request.user!.tenantId]
      );

      let wallet;
      if (wallets.length === 0) {
        const walletId = uuidv4();
        await query(
          `INSERT INTO wallets (id, tenant_id, user_id, balance, currency)
           VALUES (?, ?, ?, ?, ?)`,
          [walletId, request.user!.tenantId, request.user!.userId, 0.00, 'SAR']
        );

        wallet = {
          id: walletId,
          tenant_id: request.user!.tenantId,
          user_id: request.user!.userId,
          balance: 0.00,
          currency: 'SAR',
        };
      } else {
        wallet = wallets[0];
      }

      const transactions = await query<any[]>(
        `SELECT * FROM wallet_transactions
         WHERE wallet_id = ?
         ORDER BY created_at DESC
         LIMIT 10`,
        [wallet.id]
      );

      return NextResponse.json({
        wallet,
        transactions,
      });
    } catch (error) {
      console.error('Get wallet error:', error);
      return NextResponse.json(
        { error: 'Failed to get wallet' },
        { status: 500 }
      );
    }
  }
);
