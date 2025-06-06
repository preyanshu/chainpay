import { NextResponse } from 'next/server';
import { randomUUID, randomBytes } from 'crypto';
import { supabase } from '@/lib/supabase';
import {SUPPORTED_NETWORKS} from "@/networkConfig"

type ExpirationKey = '1_hour' | '24_hours' | '7_days' | '30_days' | 'custom';


import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.string().refine(val => !isNaN(Number(val)), {
    message: "Amount must be a valid number string",
  }),
  toWalletAddress: z.string().min(1),
  freelancerId: z.string().min(1),
  freelancerEmail: z.string().email(),
  clientEmail: z.string().email(),
  network: z.enum(["ethereum", "polygon", "optimism", "arbitrum"]),
  nativeSymbol: z.string().min(1),
  expiresIn: z.enum(['1_hour', '24_hours', '7_days', '30_days', 'custom']).optional(),
  customExpiration: z.number().optional(),
  native_token : z.enum(["USDT","USDC"])
});


const EXPIRATION_PERIODS: Record<ExpirationKey, number> = {
  '1_hour': 1 * 60 * 60 * 1000,
  '24_hours': 24 * 60 * 60 * 1000,
  '7_days': 7 * 24 * 60 * 60 * 1000,
  '30_days': 30 * 24 * 60 * 60 * 1000,
  'custom': 0,
};

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = paymentSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const {
      amount,
      toWalletAddress,
      freelancerId,
      freelancerEmail,
      clientEmail,
      network,
      nativeSymbol,
      expiresIn = '24_hours',
      customExpiration,
      native_token
    } = parsed.data;

    
    const expirationMs =
      expiresIn === 'custom'
        ? customExpiration || 0
        : EXPIRATION_PERIODS[expiresIn];

    
    const now = new Date()

    const expiresAt = new Date(Date.now() + expirationMs);

    const id = randomUUID();
    const nounce = randomBytes(16).toString('hex');


    const { error: insertError } = await supabase.from('payments').insert([
      {
        id,
        amount,
        to_wallet_address: toWalletAddress,
        from_wallet_address: null,
        tx_hash: null,
        status: 'pending',
        confirmations: 0,
        nounce,
        network,
        chain_id:  SUPPORTED_NETWORKS[network].chainId ,
        native_symbol: nativeSymbol,
        freelancer_id: freelancerId,
        freelancer_email: freelancerEmail,
        client_email: clientEmail,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        native_token
      },
    ]);

    if (insertError) {
      console.error('Insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
    }

    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${id}`;
    return NextResponse.json({ id, paymentLink });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
