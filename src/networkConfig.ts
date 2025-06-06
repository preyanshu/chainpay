export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  coingeckoId?: string;
  isNative?: boolean; // True if issued natively on this chain
  liquidity?: 'high' | 'medium' | 'low'; // Liquidity indicator
  recommended?: boolean; // Recommended for payments
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  nativeSymbol: string;
  rpcUrl: string | string[];
  requiredConfirmations: number;
  testnet?: boolean;
  tokens?: Record<string, TokenConfig>;
  recommendedStablecoin?: string; // Primary stablecoin for this network
}

// Verified contract addresses (as of 2024/2025)
export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    nativeSymbol: "ETH",
    rpcUrl: [
      process.env.ETH_RPC_1 ||  "https://eth-sepolia.public.blastapi.io",
    ],
    testnet: false,
    requiredConfirmations: 12,
    recommendedStablecoin: 'usdc', // USDC is more established on Ethereum
    tokens: {
      usdt: {
        symbol: "USDT",
        name: "Tether USD",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        decimals: 6,
        isNative: true,
        liquidity: 'high',
        recommended: true,
        coingeckoId: "tether"
      },
      usdc: {
        symbol: "USDC",
        name: "USD Coin",
        address: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
        decimals: 6,
        isNative: true,
        liquidity: 'high',
        recommended: true,
        coingeckoId: "usd-coin"
      }
    }
  },

  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    nativeSymbol: "ETH",
    rpcUrl: [
      "https://eth-sepolia.public.blastapi.io"
    ],
    testnet: true,
    requiredConfirmations: 3,
    recommendedStablecoin: 'usdc',
    tokens: {
      usdt: {
        symbol: "USDT",
        name: "Tether USD (Testnet)",
        address: "0x863aE464D7E8e6F95b845FD3AF0f9A2B2034D6dD", // Example testnet USDT
        decimals: 6,
        isNative: true,
        liquidity: 'high',
        recommended: true,
        coingeckoId: "tether"
      },
      usdc: {
        symbol: "USDC",
        name: "USD Coin (Testnet)",
        address: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238", // Example testnet USDC
        decimals: 6,
        isNative: true,
        liquidity: 'high',
        recommended: true,
        coingeckoId: "usd-coin"
      }
    }
  },
  polygon: {
    name: "Polygon",
    chainId: 137,
    nativeSymbol: "MATIC",
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    testnet: false,
    requiredConfirmations: 64,
    recommendedStablecoin: 'usdt', // USDT has higher adoption on Polygon
    tokens: {
      usdt: {
        symbol: "USDT",
        name: "Tether USD (PoS)",
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        decimals: 6,
        isNative: false, // Bridged from Ethereum
        liquidity: 'high',
        recommended: true,
        coingeckoId: "tether"
      },
      usdc: {
        symbol: "USDC.e",
        name: "USD Coin (PoS) - Bridged",
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        decimals: 6,
        isNative: false, // This is USDC.e (bridged)
        liquidity: 'medium',
        recommended: false, // Not recommended due to bridged nature
        coingeckoId: "usd-coin"
      }
    }
  },
  arbitrum: {
    name: "Arbitrum",
    chainId: 42161,
    nativeSymbol: "ETH",
    rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
    testnet: false,
    requiredConfirmations: 1,
    recommendedStablecoin: 'usdc', // Native USDC available
    tokens: {
      usdt: {
        symbol: "USDT",
        name: "Tether USD",
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        decimals: 6,
        isNative: false,
        liquidity: 'high',
        recommended: true,
        coingeckoId: "tether"
      },
      usdc: {
        symbol: "USDC",
        name: "USD Coin (Native)",
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        decimals: 6,
        isNative: true, // Native USDC on Arbitrum
        liquidity: 'high',
        recommended: true,
        coingeckoId: "usd-coin"
      }
    }
  },
  optimism: {
    name: "Optimism",
    chainId: 10,
    nativeSymbol: "ETH",
    rpcUrl: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
    testnet: false,
    requiredConfirmations: 1,
    recommendedStablecoin: 'usdc', // Native USDC available
    tokens: {
      usdt: {
        symbol: "USDT",
        name: "Tether USD",
        address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
        decimals: 6,
        isNative: false,
        liquidity: 'medium',
        recommended: false, // Lower liquidity on Optimism
        coingeckoId: "tether"
      },
      usdc: {
        symbol: "USDC",
        name: "USD Coin (Native)",
        address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        decimals: 6,
        isNative: true, // Native USDC on Optimism
        liquidity: 'high',
        recommended: true,
        coingeckoId: "usd-coin"
      }
    }
  },
  base: {
    name: "Base",
    chainId: 8453,
    nativeSymbol: "ETH",
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    testnet: false,
    requiredConfirmations: 1,
    recommendedStablecoin: 'usdc', // Base is a Coinbase chain, USDC is primary
    tokens: {
      // Note: USDT has very low adoption on Base
      usdc: {
        symbol: "USDC",
        name: "USD Coin",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
        isNative: true, // Native USDC on Base
        liquidity: 'high',
        recommended: true,
        coingeckoId: "usd-coin"
      }
    }
  }
};

// Helper functions with payment-focused logic
export function getRecommendedToken(networkKey: string): TokenConfig | undefined {
  const network = SUPPORTED_NETWORKS[networkKey];
  if (!network?.tokens || !network.recommendedStablecoin) return undefined;
  
  return network.tokens[network.recommendedStablecoin];
}

export function getTokenConfig(networkKey: string, tokenSymbol: string): TokenConfig | undefined {
  const network = SUPPORTED_NETWORKS[networkKey];
  if (!network?.tokens) return undefined;
  
  return network.tokens[tokenSymbol.toLowerCase()];
}

export function getPaymentRecommendedTokens(networkKey: string): TokenConfig[] {
  const network = SUPPORTED_NETWORKS[networkKey];
  if (!network?.tokens) return [];
  
  return Object.values(network.tokens).filter(token => token.recommended);
}

export function getAllSupportedTokens(networkKey: string): TokenConfig[] {
  const network = SUPPORTED_NETWORKS[networkKey];
  if (!network?.tokens) return [];
  
  return Object.values(network.tokens);
}

export function isTokenSupported(networkKey: string, tokenSymbol: string): boolean {
  return getTokenConfig(networkKey, tokenSymbol) !== undefined;
}

// Get best networks for a specific token (high liquidity + recommended)
export function getBestNetworksForToken(tokenSymbol: string): Array<{network: string, config: TokenConfig}> {
  const results: Array<{network: string, config: TokenConfig}> = [];
  
  Object.entries(SUPPORTED_NETWORKS).forEach(([networkKey, networkConfig]) => {
    const tokenConfig = getTokenConfig(networkKey, tokenSymbol);
    if (tokenConfig && tokenConfig.recommended && tokenConfig.liquidity === 'high') {
      results.push({ network: networkKey, config: tokenConfig });
    }
  });
  
  return results;
}

// Payment validation helper
export function validatePaymentToken(networkKey: string, tokenSymbol: string): {
  isValid: boolean;
  warnings: string[];
  recommendation?: string;
} {
  const tokenConfig = getTokenConfig(networkKey, tokenSymbol);
  const network = SUPPORTED_NETWORKS[networkKey];
  
  if (!tokenConfig) {
    return {
      isValid: false,
      warnings: [`${tokenSymbol} is not supported on ${network.name}`],
    };
  }
  
  const warnings: string[] = [];
  
  if (!tokenConfig.recommended) {
    warnings.push(`${tokenSymbol} is not recommended for payments on ${network.name}`);
  }
  
  if (tokenConfig.liquidity === 'low') {
    warnings.push(`${tokenSymbol} has low liquidity on ${network.name}`);
  }
  
  if (!tokenConfig.isNative) {
    warnings.push(`${tokenSymbol} is bridged on ${network.name}, not native`);
  }
  
  let recommendation;
  if (warnings.length > 0) {
    const recommended = getRecommendedToken(networkKey);
    if (recommended) {
      recommendation = `Consider using ${recommended.symbol} instead`;
    }
  }
  
  return {
    isValid: true,
    warnings,
    recommendation
  };
}

// Usage examples:
console.log("=== Payment Token Validation Examples ===");
console.log(validatePaymentToken('base', 'usdt')); // Will show warnings
console.log(validatePaymentToken('polygon', 'usdt')); // Good choice
console.log(validatePaymentToken('arbitrum', 'usdc')); // Excellent choice