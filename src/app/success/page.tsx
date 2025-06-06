// app/success/page.tsx

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/checkout_sessions/${sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch session');
        const data = await res.json();
        setPaymentDetails(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) return <p>Loading payment details...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
      <h1>Payment Successful!</h1>
      <p>Thank you for your payment.</p>

      {paymentDetails && (
        <>
          <p><strong>Payment ID:</strong> {paymentDetails.id}</p>
          <p><strong>Amount:</strong> ${(paymentDetails.amount_total / 100).toFixed(2)}</p>
          <p><strong>Status:</strong> {paymentDetails.payment_status}</p>
        </>
      )}

      <button onClick={() => router.push('/')}>Go to Home</button>
    </div>
  );
}
