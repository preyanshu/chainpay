import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import{ supabase} from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend('re_LEbhkB4p_3ze4NJ4H8Q59GRxgdQxHCT6V');



const provider = new ethers.JsonRpcProvider("https://devnet.dplabs-internal.com");

interface Payment {
  id: string;
  amount: string; // in wei (string)
  to_wallet_address: string;
  from_wallet_address: string | null;
  status: 'pending' | 'confirmed' | 'unconfirmed' | 'completed';
  confirmations: number;
  txHash: string | null;
  nounce: string;
}

async function getTxDetails(txHash: string): Promise<{
  confirmations: number;
  from: string | null;
  to : string | null;
  value: string | null;
}> {
  try {
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!tx || !receipt || !receipt.blockNumber) {
      return { confirmations: 0, from: null,to:null, value: null };
    }

    const latestBlock = await provider.getBlockNumber();
    const confirmations = latestBlock - receipt.blockNumber + 1;

    return {
      confirmations,
      from: tx.from,
      to : tx.to,
      value: tx.value.toString(),

    };
  } catch (err) {
    console.error(err);
    return { confirmations: 0, from: null, to:null, value: null };
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
    }

    // Fetch payment from Supabase
    const { data: payment, error: fetchError } = await supabase
      .from<Payment>('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // ✅ Early return if already confirmed
    if (payment.status === 'confirmed') {
      return NextResponse.json({
        id: payment.id,
        amount: payment.amount,
        walletAddress: payment.from_wallet_address,
        status: payment.status,
        confirmations: payment.confirmations,
      });
    }

    if (!payment.tx_hash) {
      return NextResponse.json({
        id: payment.id,
        amount: payment.amount,
        walletAddress: payment.from_wallet_address,
        status: payment.status,
        confirmations: 0,
      });
    }

    const { confirmations, from,to, value } = await getTxDetails(payment.tx_hash);

    // Validate sender
    if (from?.toLowerCase() !== payment.from_wallet_address?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Transaction was not sent from the expected wallet' },
        { status: 400 }
      );
    }

    // Validate amount
    if (value !== payment.amount) {
      return NextResponse.json(
        { error: 'Transaction amount does not match expected payment' },
        { status: 400 }
      );
    }

    //validate receiver 
    if(to?.toLowerCase() !== payment.to_wallet_address?.toLowerCase()){
      return NextResponse.json(
        { error: 'Transaction was not sent to the expected wallet' },
        { status: 400 }
      );
    }

    // Determine new status
    let newStatus: Payment['status'] = 'unconfirmed';
    if (confirmations >= 2) {
      newStatus = 'confirmed';

      // Send confirmation email
      resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'mishrapreyanshu@gmail.com',
        subject: 'Hello World',
        html: '<p>Congrats on sending your <strong>Payment SuccesFul</strong>!</p>'
      });
    } else if (confirmations > 0) {
      newStatus = 'pending';
    }

    // Update Supabase
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        confirmations,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: payment.id,
      amount: payment.amount,
      walletAddress: payment.from_wallet_address,
      status: newStatus,
      confirmations,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

