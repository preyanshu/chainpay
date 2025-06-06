import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const submitPaymentSchema = z.object({
  sessionId: z.string().uuid(),
  signature: z.string().min(1),
  txHash: z.string().regex(/^0x([A-Fa-f0-9]{64})$/, 'Invalid transaction hash format'),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const parseResult = submitPaymentSchema.safeParse(json);
    if (!parseResult.success) {
      // Extract formatted errors from Zod
      return NextResponse.json(
        { error: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { sessionId, signature, txHash } = parseResult.data;

    // 1. Check session exists and not expired
    const { data: session, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('session_id, payment_id, nonce, expires_at')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 404 });
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 400 });
    }

    // 2. Verify signature against stored nonce
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(session.nonce, signature);
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

        // 3. Fetch the payment and check if status is 'pending'
        const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('id, status')
        .eq('id', session.payment_id)
        .single();
  
      if (paymentError || !payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
  
      if (payment.status !== 'pending') {
        return NextResponse.json(
          { error: `Payment status is '${payment.status}'. Only 'pending' payments can be submitted.` },
          { status: 400 }
        );
      }

    // 3. Update payment record:
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'unconfirmed',
        from_wallet_address: recoveredAddress,
        tx_hash: txHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.payment_id);

    if (updateError) {
        console.log(updateError)
      return NextResponse.json({ error:'Failed to update payment record' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Payment submitted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Submit payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
