import type { TokenMetadata, TokenSymbol } from "@/types";
import { CHAIN_IDS } from "./chains";

// Contract addresses per network
// NOTE: Replace with actual deployed addresses after deployment
export const CONTRACT_ADDRESSES: Record<number, Record<TokenSymbol, string>> = {
  [CHAIN_IDS.POLYGON_MAINNET]: {
    FLA: "0x0000000000000000000000000000000000000000",
    FLB: "0x0000000000000000000000000000000000000000",
    FLC: "0x0000000000000000000000000000000000000000",
    FLD: "0x0000000000000000000000000000000000000000",
  },
  [CHAIN_IDS.POLYGON_AMOY]: {
    FLA: "0x0000000000000000000000000000000000000000",
    FLB: "0x0000000000000000000000000000000000000000",
    FLC: "0x0000000000000000000000000000000000000000",
    FLD: "0x0000000000000000000000000000000000000000",
  },
  [CHAIN_IDS.ETHEREUM_MAINNET]: {
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

// Factory contract addresses
export const FACTORY_ADDRESSES: Record<number, string> = {
  [CHAIN_IDS.POLYGON_MAINNET]: "0x0000000000000000000000000000000000000000",
  [CHAIN_IDS.POLYGON_AMOY]: "0x0000000000000000000000000000000000000000",
  [CHAIN_IDS.ETHEREUM_MAINNET]: "0x0000000000000000000000000000000000000000",
  [CHAIN_IDS.SEPOLIA]: "0x0000000000000000000000000000000000000000",
  [CHAIN_IDS.BSC_MAINNET]: "0x0000000000000000000000000000000000000000",
  [CHAIN_IDS.BSC_TESTNET]: "0x0000000000000000000000000000000000000000",
};

// Token metadata (neutral naming - no reference to real assets)
export const TOKEN_METADATA: Record<TokenSymbol, Omit<TokenMetadata, "contractAddress">> = {
  FLA: {
    symbol: "FLA",
    name: "Flash Asset Alpha",
    decimals: 18,
    icon: "🔷",
  },
  FLB: {
    symbol: "FLB",
    name: "Flash Asset Beta",
    decimals: 18,
    icon: "🔶",
  },
  FLC: {
    symbol: "FLC",
    name: "Flash Asset Gamma",
    decimals: 18,
    icon: "🔹",
  },
  FLD: {
    symbol: "FLD",
    name: "Flash Asset Delta",
    decimals: 18,
    icon: "🔸",
  },
};

// Get contract address for token on chain
export function getTokenAddress(chainId: number, symbol: TokenSymbol): string {
  return CONTRACT_ADDRESSES[chainId]?.[symbol] || "";
}

// Get factory address for chain
export function getFactoryAddress(chainId: number): string {
  return FACTORY_ADDRESSES[chainId] || "";
}

// Get full token metadata with address
export function getTokenMetadata(chainId: number, symbol: TokenSymbol): TokenMetadata {
  const metadata = TOKEN_METADATA[symbol];
  return {
    ...metadata,
    contractAddress: getTokenAddress(chainId, symbol),
  };
}

// All token symbols
export const ALL_TOKEN_SYMBOLS: TokenSymbol[] = ["FLA", "FLB", "FLC", "FLD"];

// ABI for FlashToken contract (BEP-20 compatible, no expiry)
export const FLASH_TOKEN_ABI = [
  // BEP-20 / ERC-20 Standard
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // FlashToken Extensions
  "function mint(address to, uint256 amount)",
  "function burn(address account, uint256 amount)",
  "function batchMint(address[] recipients, uint256[] amounts)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function ADMIN_ROLE() view returns (bytes32)",
  "function MINTER_ROLE() view returns (bytes32)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event TokenMinted(address indexed to, uint256 amount)",
  "event TokenBurned(address indexed from, uint256 amount)",
] as const;

// ABI for FlashFactory contract
export const FLASH_FACTORY_ABI = [
  "function createToken(string name, string symbol, uint8 decimals) returns (address)",
  "function getToken(string symbol) view returns (address)",
  "function getAllTokens() view returns (address[])",
  "function owner() view returns (address)",
  
  "event TokenCreated(address indexed tokenAddress, string name, string symbol)",
] as const;
