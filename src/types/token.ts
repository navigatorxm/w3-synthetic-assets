import { z } from "zod";

// Ethereum address validation
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

// Token symbols supported (neutral naming)
export const TokenSymbol = {
  FLA: "FLA",
  FLB: "FLB",
  FLC: "FLC",
  FLD: "FLD",
} as const;

export type TokenSymbol = (typeof TokenSymbol)[keyof typeof TokenSymbol];

export const tokenSymbolSchema = z.enum(["FLA", "FLB", "FLC", "FLD"]);

// Token metadata
export interface TokenMetadata {
  symbol: TokenSymbol;
  name: string;
  decimals: number;
  icon: string;
  contractAddress: string;
}

// Token balance
export interface TokenBalance {
  symbol: TokenSymbol;
  balance: string;
  balanceFormatted: string;
  contractAddress: string;
}

// Mint request schema
export const mintRequestSchema = z.object({
  recipient: ethereumAddressSchema,
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  tokenSymbol: tokenSymbolSchema,
});

export type MintRequest = z.infer<typeof mintRequestSchema>;

// Batch mint request
export const batchMintRequestSchema = z.object({
  recipients: z.array(ethereumAddressSchema).min(1, "At least one recipient required"),
  amounts: z.array(z.string()).min(1),
  tokenSymbol: tokenSymbolSchema,
});

export type BatchMintRequest = z.infer<typeof batchMintRequestSchema>;

// Transfer request schema
export const transferRequestSchema = z.object({
  to: ethereumAddressSchema,
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  tokenSymbol: tokenSymbolSchema,
});

export type TransferRequest = z.infer<typeof transferRequestSchema>;

// Token holder info
export interface TokenHolder {
  address: string;
  balance: string;
  lastActivity: Date;
}

// Token statistics
export interface TokenStats {
  symbol: TokenSymbol;
  totalSupply: string;
  totalHolders: number;
  volume24h: string;
  transactions24h: number;
}
