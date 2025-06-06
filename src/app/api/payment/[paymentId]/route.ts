import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const { paymentId } = await params;

    // Validate UUID format (basic)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID format' }, { status: 400 });
    }

    // Fetch payment from DB
    console.log(paymentId)
    const { data: payment, error } = await supabase
      .from('payments')
      .select('amount, network, native_symbol, to_wallet_address, status, expires_at')
      .eq('id', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // no rows
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      console.error('Supabase error:', error.message);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment is expired
    const now = new Date();
    const expiresAt = new Date(payment.expires_at);
    const isExpired = expiresAt <= now;

    // Check if status is pending
    if (payment.status !== 'pending' || isExpired) {
      return NextResponse.json({ error: 'Payment is not valid or expired' }, { status: 400 });
    }

    // Calculate time remaining in seconds
    const timeRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

    return NextResponse.json({
      amount: payment.amount,
      network: payment.network,
      nativeSymbol: payment.native_symbol,
      toWalletAddress: payment.to_wallet_address,
      isValid: true,
      timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
    });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
