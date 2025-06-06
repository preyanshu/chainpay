'use client';

import { useEffect, useState } from 'react';


interface PaymentStatusResponse {
  id: string;
  amount: string;
  walletAddress: string;
  status: 'pending' | 'confirmed' | 'unconfirmed' | 'completed';
  confirmations: number;
}

interface Props {
  paymentId: string;
}

const PaymentSuccessPage: React.FC<Props> = ({ params }) => {

  const { id } = params;
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/payment-status?id=${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to fetch payment status');

        setStatus(data);
        if (data.status === 'confirmed' || data.status === 'completed') {
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        setLoading(false);
      }
    };

    poll();
    const interval = setInterval(poll, 5000); // poll every 5 seconds

    return () => clearInterval(interval);
  }, [id]);

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (loading || !status) {
    return <div className="text-gray-600">Checking payment status...</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow-md rounded-md text-center">
      <h2 className="text-2xl font-bold mb-4">Payment Status</h2>
      <p><strong>Payment ID:</strong> {status.id}</p>
      <p><strong>Amount:</strong> {status.amount} wei</p>
      <p><strong>Wallet Address:</strong> {status.walletAddress}</p>
      <p><strong>Status:</strong> <span className="font-semibold">{status.status}</span></p>
      <p><strong>Confirmations:</strong> {status.confirmations}</p>

      {status.status === 'confirmed' && (
        <div className="mt-4 text-green-600 font-bold">✅ Payment Confirmed!</div>
      )}
    </div>
  );
};

export default PaymentSuccessPage;
