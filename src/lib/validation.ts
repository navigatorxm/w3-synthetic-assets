import { z } from "zod";
import { parseUnits, formatUnits } from "ethers";
import { TOKEN_METADATA } from "@/config/contracts";
import type { TokenSymbol } from "@/types";

// Ethereum address regex
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Transaction hash regex
const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

// Ethereum address validation
export const addressSchema = z
  .string()
  .trim()
  .refine((val) => ETH_ADDRESS_REGEX.test(val), {
    message: "Invalid Ethereum address",
  });

// Transaction hash validation
export const txHashSchema = z
  .string()
  .trim()
  .refine((val) => TX_HASH_REGEX.test(val), {
    message: "Invalid transaction hash",
  });

// Token amount validation (as string for precision)
export const amountSchema = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Amount must be a positive number" }
  )
  .refine(
    (val) => {
      // Check for excessive decimal places
      const parts = val.split(".");
      return parts.length === 1 || parts[1].length <= 18;
    },
    { message: "Too many decimal places" }
  );

// Validate amount against token decimals
export function validateAmountForToken(
  amount: string,
  symbol: TokenSymbol
): { valid: boolean; error?: string; wei?: bigint } {
  try {
    const decimals = TOKEN_METADATA[symbol].decimals;
    const parts = amount.split(".");
    
    if (parts.length > 1 && parts[1].length > decimals) {
      return {
        valid: false,
        error: `${symbol} only supports ${decimals} decimal places`,
      };
    }
    
    const wei = parseUnits(amount, decimals);
    
    if (wei <= 0n) {
      return { valid: false, error: "Amount must be greater than 0" };
    }
    
    return { valid: true, wei };
  } catch {
    return { valid: false, error: "Invalid amount format" };
  }
}

// Format wei amount to human readable
export function formatTokenAmount(
  wei: string | bigint,
  symbol: TokenSymbol
): string {
  const decimals = TOKEN_METADATA[symbol].decimals;
  const formatted = formatUnits(wei.toString(), decimals);
  
  // Remove trailing zeros after decimal
  const parts = formatted.split(".");
  if (parts.length === 2) {
    const trimmed = parts[1].replace(/0+$/, "");
    return trimmed ? `${parts[0]}.${trimmed}` : parts[0];
  }
  
  return formatted;
}

// Expiry date validation
export const expiryDaysSchema = z
  .number()
  .min(1, "Minimum expiry is 1 day")
  .max(365, "Maximum expiry is 365 days");

// Calculate expiry timestamp from days
export function calculateExpiryTimestamp(days: number): number {
  const now = Math.floor(Date.now() / 1000);
  return now + days * 24 * 60 * 60;
}

// Check if timestamp is expired
export function isTimestampExpired(timestamp: number): boolean {
  return timestamp < Math.floor(Date.now() / 1000);
}

// Format remaining time until expiry
export function formatTimeUntilExpiry(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  
  if (diff <= 0) return "Expired";
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Batch validation schemas
export const batchAddressesSchema = z
  .array(addressSchema)
  .min(1, "At least one address required")
  .max(100, "Maximum 100 addresses per batch");

// CSV line parser for batch operations
export function parseBatchLine(line: string): { address: string; amount: string } | null {
  const parts = line.split(",").map((s) => s.trim());
  
  if (parts.length < 2) return null;
  
  const [address, amount] = parts;
  
  if (!ETH_ADDRESS_REGEX.test(address)) return null;
  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return null;
  
  return { address, amount };
}

// Validate batch CSV content
export function validateBatchCSV(
  content: string,
  symbol: TokenSymbol
): {
  valid: boolean;
  entries: Array<{ address: string; amount: string }>;
  errors: string[];
} {
  const lines = content.split("\n").filter((l) => l.trim());
  const entries: Array<{ address: string; amount: string }> = [];
  const errors: string[] = [];
  
  lines.forEach((line, index) => {
    const parsed = parseBatchLine(line);
    
    if (!parsed) {
      errors.push(`Line ${index + 1}: Invalid format`);
      return;
    }
    
    const amountValidation = validateAmountForToken(parsed.amount, symbol);
    if (!amountValidation.valid) {
      errors.push(`Line ${index + 1}: ${amountValidation.error}`);
      return;
    }
    
    entries.push(parsed);
  });
  
  return {
    valid: errors.length === 0 && entries.length > 0,
    entries,
    errors,
  };
}

// Shorten address for display
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Validate if address is checksummed (EIP-55)
export function isChecksummedAddress(address: string): boolean {
  // Basic check - in production, use ethers.getAddress()
  return ETH_ADDRESS_REGEX.test(address);
}
