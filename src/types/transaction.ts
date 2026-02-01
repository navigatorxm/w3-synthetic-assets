import { z } from "zod";
import { TokenSymbol, ethereumAddressSchema, tokenSymbolSchema } from "./token";

// Transaction types
export const TransactionType = {
  MINT: "mint",
  BURN: "burn",
  TRANSFER: "transfer",
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const transactionTypeSchema = z.enum(["mint", "burn", "transfer"]);

// Transaction status
export const TransactionStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  FAILED: "failed",
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

// Blockchain transaction
export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  tokenSymbol: TokenSymbol;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  gasUsed?: string;
  gasPrice?: string;
}

// Database transaction record
export interface TransactionRecord {
  id: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  fromAddress: string;
  toAddress: string;
  tokenSymbol: TokenSymbol;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  expiryTimestamp?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction filter schema
export const transactionFilterSchema = z.object({
  tokenSymbol: tokenSymbolSchema.optional(),
  type: transactionTypeSchema.optional(),
  address: ethereumAddressSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

// Pending transaction (in-app tracking)
export interface PendingTransaction {
  id: string;
  hash?: string;
  type: TransactionType;
  tokenSymbol: TokenSymbol;
  amount: string;
  to?: string;
  status: "preparing" | "awaiting_signature" | "submitted" | "confirming";
  submittedAt?: Date;
  error?: string;
}

// Event logs from blockchain
export interface TokenMintedEvent {
  to: string;
  amount: string;
  expiry: number;
  txHash: string;
  blockNumber: number;
}

export interface TokenBurnedEvent {
  from: string;
  amount: string;
  txHash: string;
  blockNumber: number;
}

export interface TransferEvent {
  from: string;
  to: string;
  amount: string;
  txHash: string;
  blockNumber: number;
}
