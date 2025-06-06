export interface Payment {
  id: string;
  amount: string; // in wei
  toWalletAddress: string;
  fromWalletAddress: string | null; // optional, used for verification
  status: 'pending' | 'confirmed' | 'unconfirmed' | 'completed';
  confirmations: number;
  txHash: string | null; // transaction hash after confirmation
  nounce: string ; // used for signature verification
}

  
  if (!globalThis.payments) {
    globalThis.payments = new Map<string, Payment>();
  }
  
  export const payments: Map<string, Payment> = globalThis.payments;
  