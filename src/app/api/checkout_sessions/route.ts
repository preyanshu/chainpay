// src/app/api/checkout_sessions/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil', // Or omit
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, name, description } = body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // Change to 'payment' for one-time payments
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name : name || 'Freelance Project',
              description : description || 'Payment for freelance services',
            },
            unit_amount: amount || 100000, // cents
          },
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/cancel`,
    });

    return NextResponse.json({ id: session.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
