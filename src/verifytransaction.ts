import { ethers ,JsonRpcProvider,FallbackProvider,Interface } from 'ethers';
import { supabase } from '@/lib/supabase';
import { SUPPORTED_NETWORKS } from './networkConfig';

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

interface VerificationResult {
  success: boolean;
  status: 'confirmed' | 'pending' | 'needs_review' | 'failed';
  error?: string;
  txDetails?: {
    blockNumber: number;
    confirmations: number;
    timestamp: Date;
    gasUsed?: string;
    effectiveGasPrice?: bigint;
    tokenTransfer?: {
      token: string;
      from: string;
      to: string;
      amount: string;
      decimals: number;
    };
  };
  flags?: string[];
}

interface TokenTransferDetails {
  tokenAddress: string;
  from: string;
  to: string;
  amount: bigint;
  decimals: number;
  symbol: string;
}

async function detectTokenTransfer(
  provider: JsonRpcProvider,
  txHash: string,
  expectedTokenAddress?: string,
  expectedRecipient?: string
): Promise<TokenTransferDetails | null> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      return null;
    }

    const erc20Interface = new Interface(ERC20_ABI);
    
    // Look for Transfer events in transaction logs
    for (const log of receipt.logs) {
      try {
        // Try to parse as ERC-20 Transfer event
        const parsedLog = erc20Interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        if (parsedLog?.name === 'Transfer') {
          const tokenAddress = log.address.toLowerCase();
          const from = parsedLog.args.from.toLowerCase();
          const to = parsedLog.args.to.toLowerCase();
          const amount = parsedLog.args.value;

          // If we're looking for a specific token, verify it matches
          console.log(expectedTokenAddress && tokenAddress !== expectedTokenAddress.toLowerCase())
          if (expectedTokenAddress && tokenAddress !== expectedTokenAddress.toLowerCase()) {
            continue;
          }

          // If we're looking for a specific recipient, verify it matches
          if (expectedRecipient && to !== expectedRecipient.toLowerCase()) {
            continue;
          }

          // Get token details
          const tokenContract = new ethers.Contract(log.address, ERC20_ABI, provider);
          
          try {
            const [decimals, symbol] = await Promise.all([
              tokenContract.decimals(),
              tokenContract.symbol()
            ]);

            return {
              tokenAddress,
              from,
              to,
              amount,
              decimals: Number(decimals),
              symbol
            };
          } catch (contractError) {
            console.warn(`Failed to get token details for ${log.address}:`, contractError);
            // Continue with basic info if contract calls fail
            return {
              tokenAddress,
              from,
              to,
              amount,
              decimals: 18, // Default assumption
              symbol: 'UNKNOWN'
            };
          }
        }
      } catch (parseError) {
        // Not an ERC-20 Transfer event, continue
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error detecting token transfer:', error);
    return null;
  }
}

function getRecommendedTokensForPayment(network: string): Array<{address: string, symbol: string, decimals: number}> {
  const networkConfig = SUPPORTED_NETWORKS[network];
  if (!networkConfig?.tokens) return [];
  
  return Object.values(networkConfig.tokens)
    .filter(token => token.recommended)
    .map(token => ({
      address: token.address.toLowerCase(),
      symbol: token.symbol,
      decimals: token.decimals
    }));
}

export async function verifyTransaction(
  paymentId: string
): Promise<VerificationResult> {
  const flags: string[] = [];

  let provider : JsonRpcProvider|null = null;

  
  try {
    // 1. Fetch payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        id, tx_hash, network, status, retry_count, last_verified_at, created_at,
        amount, to_wallet_address, tolerance_percentage , native_token , from_wallet_address
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return { success: false, status: 'failed', error: 'Payment not found' };
    }

    // 2. Only proceed if status allows verification
    if (!['unconfirmed','needs_review','confirmed'].includes(payment.status)) {
      return { 
        success: false, 
        status: payment.status as any,
        error: `Payment still in ${payment.status} state` 
      };
    }

    // 3. Implement exponential backoff instead of hard retry limits
    const retryCount = payment.retry_count || 0;
    const timeSinceCreated = Date.now() - new Date(payment.created_at).getTime();
    const hoursElapsed = timeSinceCreated / (1000 * 60 * 60);
    
    // Only mark as needs_review after 24 hours of trying
    if (hoursElapsed > 24 && retryCount > 100) {
      await supabase
        .from('payments')
        .update({ 
          status: 'needs_review',
          last_verified_at: new Date().toISOString(),
          flags: flags.concat(['long_pending', 'requires_manual_review'])
        })
        .eq('id', paymentId);
      
      return { 
        success: false, 
        status: 'needs_review', 
        error: 'Payment requires manual review after extended pending period',
        flags: ['long_pending']
      };
    }
   





    const rpcUrls = SUPPORTED_NETWORKS[payment.network].rpcUrl;

const randomRpcUrl = rpcUrls[Math.floor(Math.random() * rpcUrls.length)];

 provider = new JsonRpcProvider(randomRpcUrl);
 

if (!provider) {
  return {
    success: false,
    status: 'pending',
    error: 'Failed to create provider',
  };
}
    
    // 4. Get transaction details with better error handling
    let tx, receipt;
    try {
      [tx, receipt] = await Promise.all([
        provider.getTransaction(payment.tx_hash).catch(() => null),
        provider.getTransactionReceipt(payment.tx_hash).catch(() => null)
      ]);
    } catch (providerError) {
      // Provider issues shouldn't mark payment as failed
      await supabase
        .from('payments')
        .update({
          retry_count: retryCount + 1,
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

        provider.destroy()

      return { 
        success: false, 
        status: 'pending', 
        error: 'Provider temporarily unavailable' 
      };
    }

    if (!tx) {
      // Transaction not found - could be provider issue or invalid hash
      if (retryCount > 20) {
        flags.push('tx_not_found_multiple_attempts');
        await supabase
          .from('payments')
          .update({
            status: 'needs_review',
            retry_count: retryCount + 1,
            last_verified_at: new Date().toISOString(),
            flags: flags
          })
          .eq('id', paymentId);
        
          provider.destroy()

        return { 
          success: false, 
          status: 'needs_review', 
          error: 'Transaction not found after multiple attempts',
          flags
        };
      }

      console.log(retryCount)

      await supabase
        .from('payments')
        .update({
          retry_count: retryCount + 1,
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      provider.destroy()

      return { success: false, status: 'pending', error: 'Transaction not found' };
    }

    if (!tx.blockNumber || !receipt) {
      // Still pending - normal case
      await supabase
        .from('payments')
        .update({
          retry_count: retryCount + 1,
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      return { success: false, status: 'pending', error: 'Transaction not mined yet' };
    }

    // 5. Check transaction success status
    if (receipt.status !== 1) {
      // This is a definitive failure - transaction failed on-chain
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          last_verified_at: new Date().toISOString(),
          flags: ['blockchain_tx_failed']
        })
        .eq('id', paymentId);

      return { 
        success: false, 
        status: 'failed', 
        error: 'Transaction failed on blockchain' 
      };
    }

    // 6. Check confirmations
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - tx.blockNumber + 1;
    const requiredConfirmations = SUPPORTED_NETWORKS[payment.network].requiredConfirmations
    
    if (confirmations < requiredConfirmations) {
      await supabase
        .from('payments')
        .update({
          retry_count: retryCount + 1,
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      return { 
        success: false, 
        status: 'pending',
        error: `Waiting for confirmations: ${confirmations}/${requiredConfirmations}` 
      };
    }

    // 7. Get block timestamp
    const block = await provider.getBlock(tx.blockNumber);

    if (!block) {
      return {
        success: false,
        status: 'needs_review', 
        error: 'Block not found for transaction.',
      };
    }
    
    
    const txTimestamp = new Date(block.timestamp * 1000);
    
    // 8. RELAXED validation - use tolerance and flags instead of hard failures
    let tokenTransfer: TokenTransferDetails | null = null;
    let expectedAmount: bigint | null = null;
    let actualAmount: bigint | null = null;

    if (!payment.native_token || payment.native_token.trim() === '') {
      // ORIGINAL LOGIC: Native token (ETH, MATIC, etc.) - use tx.value
      expectedAmount = payment.amount ? BigInt(payment.amount) : null;
      actualAmount = tx.value;
      
      flags.push('native_token_transfer');
      
      console.log('Using native token verification - tx.value:', ethers.formatEther(tx.value));
      
    } else {
      // ERC-20 TOKEN LOGIC: Parse logs for token transfer
      const tokenSymbol = payment.native_token.trim().toUpperCase();
      flags.push('erc20_token_transfer');
      flags.push(`expected_token_${tokenSymbol.toLowerCase()}`);
      
      console.log(`Looking for ERC-20 token transfer: ${tokenSymbol}`);
      
      // Get expected token address from network config
      const networkTokens = SUPPORTED_NETWORKS[payment.network]?.tokens || {};
      const expectedTokenConfig = Object.values(networkTokens).find(
        token => token.symbol.toUpperCase() === tokenSymbol
      );
      
      if (!expectedTokenConfig) {
        flags.push('unsupported_token');
        flags.push(`token_${tokenSymbol}_not_configured`);
        
        // Still try to detect any token transfer to this address
        tokenTransfer = await detectTokenTransfer(
          provider,
          payment.tx_hash,
          undefined, // Don't filter by token address
          payment.to_wallet_address
        );
        
        if (!tokenTransfer) {
          await supabase
            .from('payments')
            .update({
              status: 'needs_review',
              last_verified_at: new Date().toISOString(),
              flags: flags.concat(['no_token_transfer_detected'])
            })
            .eq('id', paymentId);

          provider.destroy();
          return {
            success: false,
            status: 'needs_review',
            error: `${tokenSymbol} token not supported on ${payment.network} or transfer not detected`,
            flags
          };
        }
      } else {
        // Look for the specific expected token transfer
        tokenTransfer = await detectTokenTransfer(
          provider,
          payment.tx_hash,
          expectedTokenConfig.address,
          payment.to_wallet_address
        );
      }

      if (!tokenTransfer) {
        flags.push('no_token_transfer_detected');
        
        await supabase
          .from('payments')
          .update({
            status: 'needs_review',
            last_verified_at: new Date().toISOString(),
            flags: flags
          })
          .eq('id', paymentId);

        provider.destroy();
        return {
          success: false,
          status: 'needs_review',
          error: `Expected ${tokenSymbol} transfer not found in transaction logs`,
          flags
        };
      }

      // Token transfer detected - use token amount for verification
      expectedAmount = payment.amount ? BigInt(payment.amount) : null;
      actualAmount =  ethers.parseUnits(String(tokenTransfer.amount), tokenTransfer.decimals);
      
      console.log(`Token transfer detected: ${ethers.formatUnits(tokenTransfer.amount, tokenTransfer.decimals)} ${tokenTransfer.symbol}`);
      
      // Verify token symbol matches what we expected
      if (tokenTransfer.symbol.toUpperCase() !== tokenSymbol) {
        flags.push('token_symbol_mismatch');
        flags.push(`expected_${tokenSymbol}_got_${tokenTransfer.symbol}`);
      }
    }

    // 10. Amount validation with tolerance
    if (expectedAmount && actualAmount && payment.to_wallet_address) {
      const tolerance = payment.tolerance_percentage || 0.01; // 1% default tolerance
      const toleranceAmount = expectedAmount * BigInt(Math.floor(tolerance * 100)) / 100n;
      
      const amountDiff = actualAmount > expectedAmount ? 
        actualAmount - expectedAmount : expectedAmount - actualAmount;
      
      if (amountDiff > toleranceAmount) {
        flags.push('amount_mismatch');
        
        if (tokenTransfer) {
          const expectedFormatted = ethers.formatUnits(expectedAmount, tokenTransfer.decimals);
          const actualFormatted = ethers.formatUnits(actualAmount, tokenTransfer.decimals);
          flags.push(`expected_${expectedFormatted}_${tokenTransfer.symbol}_got_${actualFormatted}_${tokenTransfer.symbol}`);
        } else {
          flags.push(`expected_${ethers.formatEther(expectedAmount)}_got_${ethers.formatEther(actualAmount)}`);
        }
      }

      // Recipient validation
      const actualRecipient = tokenTransfer ? tokenTransfer.to : tx.to?.toLowerCase();
      const actualSender = tokenTransfer?tokenTransfer.from : tx.from.toLowerCase()
      console.log(actualRecipient,"check")
      
      if (actualRecipient !== payment.to_wallet_address.toLowerCase()) {
        flags.push('recipient_mismatch');
        flags.push(`expected_${payment.to_wallet_address}_got_${actualRecipient}`);
      }

      if (actualSender !== payment.from_wallet_address.toLowerCase()) {
        flags.push('Sender_mismatch');
        flags.push(`expected_${payment.from_wallet_address}_got_${actualSender}`);
      }
    }

    // 9. Session timing validation - use flags instead of hard failure
    const { data: session, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('created_at, expires_at')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (session && !sessionError) {
      const createdAt = new Date(session.created_at);
      const expiresAt = new Date(session.expires_at);
      
      // Add buffer time for network delays (5 minutes)
      const bufferTime = 0;
      const bufferedCreatedAt = new Date(createdAt.getTime() - bufferTime);
      const bufferedExpiresAt = new Date(expiresAt.getTime() + bufferTime);
      
      if (txTimestamp < bufferedCreatedAt || txTimestamp > bufferedExpiresAt) {
        flags.push('timestamp_outside_session');
        flags.push(`tx_time_${txTimestamp.toISOString()}`);
        flags.push(`session_${createdAt.toISOString()}_to_${expiresAt.toISOString()}`);
      }
    }


    
    let finalStatus: 'confirmed' | 'needs_review' | 'failed' = 'confirmed';

    if (flags.includes('recipient_mismatch')) {
      finalStatus = 'failed';
    } else if (flags.includes('timestamp_outside_session')) {
      finalStatus = 'needs_review';
    } else {
      const criticalFlags = flags.filter(flag =>
        flag.includes('amount_mismatch')
      );
      if (criticalFlags.length > 0) {
        finalStatus = 'needs_review';
      }
    }

    // 11. Update payment status
    const updateData = {
      status: finalStatus,
      confirmed_at: finalStatus === 'confirmed' ? new Date().toISOString() : null,
      block_number: tx.blockNumber,
      confirmations: confirmations,
      last_verified_at: new Date().toISOString(),
      gas_used: receipt.gasUsed?.toString(),
      flags: flags.length > 0 ? flags : null
    };

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);

    if (updateError) {
      console.log(updateError)
      return { 
        success: false, 
        status: 'pending', 
        error: 'Failed to update payment status' 
      };
    }

    return { 
      success: true, 
      status: finalStatus,
      txDetails: {
        blockNumber: tx.blockNumber,
        confirmations,
        timestamp: txTimestamp,
        gasUsed: receipt.gasUsed?.toString(),
      },
      flags: flags.length > 0 ? flags : undefined
    };

  } catch (err) {
    console.error('verifyTransaction error:', err);
    
    // Even on errors, don't mark as failed - just retry
    try {
      const { data: currentPayment } = await supabase
        .from('payments')
        .select('retry_count')
        .eq('id', paymentId)
        .single();

      if (currentPayment) {
        await supabase
          .from('payments')
          .update({
            retry_count: (currentPayment.retry_count || 0) + 1,
            last_verified_at: new Date().toISOString(),
          })
          .eq('id', paymentId);
      }
    } catch (retryUpdateError) {
      console.error('Failed to update retry count:', retryUpdateError);
    }

    return { success: false, status: 'pending', error: 'Internal server error' };
  } finally{
    if(provider){
      provider.destroy()
    }
    
  }
}