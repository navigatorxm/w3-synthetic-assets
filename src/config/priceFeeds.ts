import { CHAIN_IDS } from "./chains";
import type { TokenSymbol } from "@/types";

// Chainlink Price Feed Addresses
// https://docs.chain.link/data-feeds/price-feeds/addresses
export const CHAINLINK_PRICE_FEEDS: Record<number, Record<TokenSymbol, string>> = {
  [CHAIN_IDS.ETHEREUM_MAINNET]: {
    // ETH/USD
    ETH: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    // BTC/USD
    BTC: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    // USDT/USD
    USDT: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
  },
  [CHAIN_IDS.SEPOLIA]: {
    // ETH/USD on Sepolia
    ETH: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    // BTC/USD on Sepolia
    BTC: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    // There's no official USDT/USD on Sepolia, using mock address
    USDT: "0x0000000000000000000000000000000000000000",
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
