// Token types
export * from "./token";
export * from "./transaction";

// Wallet types
export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isAdmin: boolean;
}

// Network types
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}

// Analytics types
export interface DailyVolume {
  date: string;
  volume: string;
  transactionCount: number;
}

export interface HolderDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  totalVolume24h: string;
  totalTransactions24h: number;
  activeHolders: number;
  avgHoldingPeriod: number;
  topHolders: Array<{
    address: string;
    balance: string;
    percentage: number;
  }>;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Form states
export interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}
