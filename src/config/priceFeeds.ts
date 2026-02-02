import { CHAIN_IDS } from "./chains";
import type { TokenSymbol } from "@/types";

// Chainlink Price Feed Addresses
// Note: These are for reference only - FlashAsset tokens are synthetic 
// and don't have external price feeds
export const CHAINLINK_PRICE_FEEDS: Record<number, Partial<Record<TokenSymbol, string>>> = {
  [CHAIN_IDS.ETHEREUM_MAINNET]: {
    // No price feeds for synthetic FlashAsset tokens
    FLA: "0x0000000000000000000000000000000000000000",
    FLB: "0x0000000000000000000000000000000000000000",
    FLC: "0x0000000000000000000000000000000000000000",
    FLD: "0x0000000000000000000000000000000000000000",
  },
  [CHAIN_IDS.SEPOLIA]: {
    FLA: "0x0000000000000000000000000000000000000000",
    FLB: "0x0000000000000000000000000000000000000000",
    FLC: "0x0000000000000000000000000000000000000000",
    FLD: "0x0000000000000000000000000000000000000000",
  },
  [CHAIN_IDS.BSC_MAINNET]: {
    FLA: "0x0000000000000000000000000000000000000000",
    FLB: "0x0000000000000000000000000000000000000000",
    FLC: "0x0000000000000000000000000000000000000000",
    FLD: "0x0000000000000000000000000000000000000000",
  },
  [CHAIN_IDS.BSC_TESTNET]: {
    FLA: "0x0000000000000000000000000000000000000000",
    FLB: "0x0000000000000000000000000000000000000000",
    FLC: "0x0000000000000000000000000000000000000000",
    FLD: "0x0000000000000000000000000000000000000000",
  },
};

// Chainlink Aggregator V3 ABI (minimal)
export const CHAINLINK_AGGREGATOR_ABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() external view returns (uint8)",
  "function description() external view returns (string)",
] as const;

// Get price feed address for token on chain
export function getPriceFeedAddress(chainId: number, symbol: TokenSymbol): string {
  return CHAINLINK_PRICE_FEEDS[chainId]?.[symbol] || "";
}

// Price data interface
export interface PriceData {
  symbol: TokenSymbol;
  price: number;
  priceFormatted: string;
  decimals: number;
  updatedAt: Date;
  isStale: boolean;
}

// Check if price is stale (older than 1 hour)
export function isPriceStale(updatedAt: Date): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return updatedAt < oneHourAgo;
}