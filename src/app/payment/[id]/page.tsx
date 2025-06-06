'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';

interface Payment {
  id: string;
  amount: string; // in wei
  to_wallet_address: string;
  from_wallet_address: string | null; // optional, used for verification
  status: 'pending' | 'confirmed' | 'unconfirmed' | 'completed';
  confirmations: number;
  txHash: string | null; // transaction hash after confirmation
  nounce: string ; // used for signature verification
}

interface PaymentPageProps {
  params: {
    id: string;
  };
}

export default function PaymentPageClient({ params }: PaymentPageProps) {
  const { id } = params;
  const router = useRouter();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch payment info on mount
  useEffect(() => {
    async function fetchPayment() {
      try {
        const res = await fetch(`/api/get-payment?id=${id}`);
        const data = await res.json();
        if (res.ok) {
          setPayment(data);
        } else {
          setError(data.error || 'Failed to fetch payment');
        }
      } catch {
        setError('Failed to fetch payment');
      }
    }
    fetchPayment();
  }, [id]);

  async function handlePayNow() {
    setError('');
    setLoading(true);

    if (!payment) {
      setError('Payment not loaded');
      setLoading(false);
      return;
    }

    if (!(window as any).ethereum) {
      setError('Please install MetaMask or compatible wallet');
      setLoading(false);
      return;
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const address = await signer.getAddress();

      // Optional: verify connected wallet matches expected wallet
      // if (address.toLowerCase() !== payment.walletAddress.toLowerCase()) {
      //   setError('Connected wallet does not match expected wallet');
      //   setLoading(false);
      //   return;
      // }

      // Step 1: Sign dummy nonce "123"
      const signature = await signer.signMessage(payment.nounce);

      // Step 2: Send transaction
      console.log('Sending transaction to:', payment.to_wallet_address);
      console.log('Amount in wei:', ethers.parseEther(payment.amount).toString());
      const tx = await signer.sendTransaction({
        to: payment.to_wallet_address,
        value:   BigInt(payment.amount.toString())
      });

      // Step 3: Wait for transaction to be mined (optional)
      await tx.wait();

      // Step 4: Submit to backend
      const res = await fetch('/api/complete-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          txHash: tx.hash,
          signature
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/payment-success/${id}`);
      } else {
        setError(data.error || 'Failed to complete payment');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 font-semibold">
        Error: {error}
      </div>
    );
  }

  if (!payment) {
    return <div className="p-4">Loading payment info...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">Payment for ID: {payment.id}</h1>

      {JSON.stringify(payment)}
      <button
        onClick={handlePayNow}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing Payment...' : 'Pay Now'}
      </button>
    </div>
  );
}
