// Admin Configuration
// This file manages admin wallet addresses and custom token configurations

import { STORAGE_KEYS } from "./constants";

// Admin wallet addresses - add your wallet address here
// These addresses have full access to mint, burn, and transfer tokens
export const DEFAULT_ADMIN_ADDRESSES: string[] = [
  // Add your wallet address here, e.g.:
  // "0x742d35Cc6634C0532925a3b844Bc9e7595f00000",
];

// Load admin addresses from localStorage (allows runtime configuration)
export function getAdminAddresses(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_ADDRESSES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return [...new Set([...DEFAULT_ADMIN_ADDRESSES, ...parsed])];
      }
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_ADMIN_ADDRESSES;
}

// Add an admin address (persists to localStorage)
export function addAdminAddress(address: string): void {
  const normalized = address.toLowerCase();
  const current = getAdminAddresses();
  
  if (!current.some(a => a.toLowerCase() === normalized)) {
    const custom = getCustomAdminAddresses();
    custom.push(address);
    localStorage.setItem(STORAGE_KEYS.ADMIN_ADDRESSES, JSON.stringify(custom));
  }
}

// Remove an admin address
export function removeAdminAddress(address: string): void {
  const normalized = address.toLowerCase();
  const custom = getCustomAdminAddresses().filter(
    a => a.toLowerCase() !== normalized
  );
  localStorage.setItem(STORAGE_KEYS.ADMIN_ADDRESSES, JSON.stringify(custom));
}

// Get only custom (non-default) admin addresses
export function getCustomAdminAddresses(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_ADDRESSES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

// Check if address is admin
export function isAdminAddress(address: string | null): boolean {
  if (!address) return false;
  const normalized = address.toLowerCase();
  return getAdminAddresses().some(a => a.toLowerCase() === normalized);
}

// Custom Token Configuration
export interface CustomToken {
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  contractAddress: string;
  chainId: number;
}

// Load custom tokens from localStorage
export function getCustomTokens(): CustomToken[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_TOKENS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

// Save a custom token
export function saveCustomToken(token: CustomToken): void {
  const tokens = getCustomTokens();
  const existingIndex = tokens.findIndex(
    t => t.symbol === token.symbol && t.chainId === token.chainId
  );
  
  if (existingIndex >= 0) {
    tokens[existingIndex] = token;
  } else {
    tokens.push(token);
  }
  
  localStorage.setItem(STORAGE_KEYS.CUSTOM_TOKENS, JSON.stringify(tokens));
}

// Remove a custom token
export function removeCustomToken(symbol: string, chainId: number): void {
  const tokens = getCustomTokens().filter(
    t => !(t.symbol === symbol && t.chainId === chainId)
  );
  localStorage.setItem(STORAGE_KEYS.CUSTOM_TOKENS, JSON.stringify(tokens));
}

// Get all tokens (built-in + custom) for a chain
export function getAllTokensForChain(chainId: number): CustomToken[] {
  const custom = getCustomTokens().filter(t => t.chainId === chainId);
  return custom;
}
