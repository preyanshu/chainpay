// components/CheckoutForm.tsx
import { useState, FormEvent } from 'react';
import getStripe from '@/utils/get-stripejs';

const CheckoutForm = () => {
  const [amount, setAmount] = useState(1000); // in cents (i.e. $10)
  const [interval, setInterval] = useState<'one_time' | 'subscription'>('one_time');
  const [description, setDescription] = useState('Freelance Project');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/checkout_sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, interval, description }),
    });

    const session = await response.json();

    const stripe = await getStripe();
    const { error } = await stripe!.redirectToCheckout({
      sessionId: session.id,
    });

    if (error) console.error(error.message);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Payment Link</h2>
      <label>
        Description:
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        Amount (USD):
        <input
          type="number"
          value={amount / 100}
          onChange={(e) => setAmount(Number(e.target.value) * 100)}
        />
      </label>
      <label>
        Payment Type:
        <select value={interval} onChange={(e) => setInterval(e.target.value as any)}>
          <option value="one_time">One-Time</option>
          <option value="subscription">Subscription</option>
        </select>
      </label>
      <button type="submit">Generate Payment Link</button>
    </form>
  );
};

export default CheckoutForm;
