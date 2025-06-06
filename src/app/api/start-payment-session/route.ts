import { NextResponse } from 'next/server';
import { randomUUID , randomBytes} from 'crypto';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();


    if (!paymentId) {
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }



    // Validate UUID format for paymentId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paymentId)) {
      return NextResponse.json({ error: 'Invalid paymentId format' }, { status: 400 });
    }

    console.log(paymentId);
    // Fetch payment details
    const { data: paymentData, error } = await supabase
      .from('payments')
      .select('amount, network, native_symbol, to_wallet_address, status, expires_at, chain_id')
      .eq('id', paymentId)
      .single();

      console.log(paymentData)
      if (error) {
        if (error.code === 'PGRST116') { // no rows
          return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }
        console.error('Supabase error:', error.message);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
  
      if (!paymentData) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

    const now = new Date();
    if (paymentData.status !== 'pending') {
      return NextResponse.json({ error: 'Payment is not pending' }, { status: 400 });
    }

    if (new Date(paymentData.expires_at) < now) {
      return NextResponse.json({ error: 'Payment link expired' }, { status: 400 });
    }
    

    const { error: deleteError } = await supabase
  .from('payment_sessions')
  .delete()
  .eq('payment_id', paymentId)
  .gt('expires_at', now.toISOString());

if (deleteError) {
  console.error('Failed to delete old session:', deleteError.message);
  return NextResponse.json({ error: 'Failed to reset existing session' }, { status: 500 });
}

    // Create a new payment session with 5-minute expiry
    const sessionId = randomUUID();
    // const nonce = paymentData.nonce; // reuse payment nonce for signing
    //create new nonce
    const nonce = randomBytes(16).toString('hex');
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    const { error: insertError } = await supabase.from('payment_sessions').insert([
        {
          session_id: sessionId,
          payment_id: paymentId,
          nonce,
          expires_at: expiresAt.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
      ]);

    if (insertError) {
      console.error('Failed to create payment session:', insertError.message);
      return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 });
    }

    return NextResponse.json({
      sessionId,
      nonce,
      sessionExpiresAt: expiresAt.toISOString(),
      toWalletAddress: paymentData.to_wallet_address,
      amount: paymentData.amount,
      network: paymentData.network,
      chainId:paymentData.chain_id
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
