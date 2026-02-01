// Application constants

// App info
export const APP_NAME = "FlashAsset";
export const APP_DESCRIPTION = "Expiring Mock Token Platform for Trading Communities";
export const APP_VERSION = "1.0.0";

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// Transaction settings
export const TX_CONFIRMATION_BLOCKS = 2;
export const TX_TIMEOUT_MS = 120_000; // 2 minutes

// Token defaults
export const DEFAULT_EXPIRY_DAYS = 30;
export const MIN_EXPIRY_DAYS = 1;
export const MAX_EXPIRY_DAYS = 365;

// Batch limits
export const MAX_BATCH_MINT_SIZE = 100;

// Polling intervals
export const BALANCE_POLL_INTERVAL = 30_000; // 30 seconds
export const ANALYTICS_POLL_INTERVAL = 60_000; // 1 minute
export const TRANSACTION_POLL_INTERVAL = 10_000; // 10 seconds

// Cache durations
export const CACHE_DURATION = {
  BALANCES: 30_000,
  ANALYTICS: 60_000,
  TRANSACTIONS: 15_000,
} as const;

// Admin addresses (replace with actual admin wallets)
export const ADMIN_ADDRESSES: string[] = [
  // Add admin wallet addresses here after deployment
];

// Rate limits
export const RATE_LIMITS = {
  MINT_PER_DAY: 1000,
  TRANSFER_PER_MINUTE: 10,
  BURN_PER_DAY: 500,
} as const;

// UI Constants
export const TOAST_DURATION = 5000;
export const ANIMATION_DURATION = 200;

// Format options
export const DATE_FORMAT = "MMM dd, yyyy";
export const TIME_FORMAT = "HH:mm:ss";
export const DATETIME_FORMAT = "MMM dd, yyyy HH:mm";

// Local storage keys
export const STORAGE_KEYS = {
  WALLET_CONNECTOR: "flashasset_wallet_connector",
  THEME: "flashasset_theme",
  LAST_NETWORK: "flashasset_last_network",
  ADMIN_ADDRESSES: "flashasset_admin_addresses",
  CUSTOM_TOKENS: "flashasset_custom_tokens",
} as const;

// Query keys for TanStack Query
export const QUERY_KEYS = {
  BALANCES: "balances",
  TRANSACTIONS: "transactions",
  ANALYTICS: "analytics",
  TOKEN_STATS: "token_stats",
  HOLDERS: "holders",
} as const;
