// app/api/verify-transaction/route.ts
import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/verifytransaction';

export async function POST(req: Request) {
  const body = await req.json();
  const paymentId = body.paymentId;

  try {
    const result = await verifyTransaction(paymentId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'failed',
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
