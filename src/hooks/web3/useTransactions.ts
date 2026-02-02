import { useState, useCallback } from "react";
import { parseUnits } from "ethers";
import { createTokenContract } from "./useContract";
import { useWalletStore } from "@/stores/walletStore";
import { useWeb3 } from "@/providers/Web3Provider";
import { useQueryClient } from "@tanstack/react-query";
import { TOKEN_METADATA } from "@/config/contracts";
import { QUERY_KEYS, TX_CONFIRMATION_BLOCKS } from "@/config/constants";
import { toast } from "sonner";
import type { TokenSymbol, TransactionType } from "@/types";
import type { Contract } from "ethers";

interface TransactionOptions {
  symbol: TokenSymbol;
  amount: string;
  to?: string;
}

interface UseTransactionsReturn {
  mint: (opts: TransactionOptions) => Promise<string | null>;
  transfer: (opts: TransactionOptions) => Promise<string | null>;
  burn: (opts: TransactionOptions) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useTransactions(): UseTransactionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { signer } = useWeb3();
  const chainId = useWalletStore((state) => state.chainId);
  const { addPendingTransaction, updatePendingTransaction, removePendingTransaction } =
    useWalletStore();

  // Helper to wait for transaction confirmation
  const waitForConfirmation = async (
    contract: Contract,
    txHash: string,
    txId: string
  ) => {
    if (!contract?.runner?.provider) return;

    const provider = contract.runner.provider;
    const receipt = await provider.waitForTransaction(txHash, TX_CONFIRMATION_BLOCKS);

    if (receipt?.status === 1) {
      updatePendingTransaction(txId, { status: "confirming" });
      toast.success("Transaction confirmed!");
    } else {
      updatePendingTransaction(txId, {
        status: "confirming",
        error: "Transaction failed",
      });
      toast.error("Transaction failed");
    }

    // Invalidate balances cache
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BALANCES] });

    // Remove from pending after a delay
    setTimeout(() => removePendingTransaction(txId), 5000);
  };

  // Mint tokens (admin only) - no expiry, standard BEP-20
  const mint = useCallback(
    async ({ symbol, amount, to }: TransactionOptions) => {
      // Create contract using utility function (not a hook)
      const contract = createTokenContract(chainId, symbol, signer);
      
      if (!contract || !to) {
        toast.error("Contract not available or recipient missing");
        return null;
      }

      setIsLoading(true);
      setError(null);

      const txId = addPendingTransaction({
        type: "mint" as TransactionType,
        tokenSymbol: symbol,
        amount,
        to,
        status: "preparing",
      });

      try {
        const decimals = TOKEN_METADATA[symbol].decimals;
        const amountWei = parseUnits(amount, decimals);

        updatePendingTransaction(txId, { status: "awaiting_signature" });

        // Mint without expiry parameter
        const tx = await contract.mint(to, amountWei);
        const txHash = tx.hash;

        updatePendingTransaction(txId, { hash: txHash, status: "submitted" });
        toast.info("Transaction submitted, waiting for confirmation...");

        // Wait for confirmation in background
        waitForConfirmation(contract, txHash, txId);

        return txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Mint failed";
        setError(message);
        updatePendingTransaction(txId, { error: message });
        toast.error(message);
        removePendingTransaction(txId);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [chainId, signer, addPendingTransaction, updatePendingTransaction, removePendingTransaction, queryClient]
  );

  // Transfer tokens
  const transfer = useCallback(
    async ({ symbol, amount, to }: TransactionOptions) => {
      // Create contract using utility function (not a hook)
      const contract = createTokenContract(chainId, symbol, signer);
      
      if (!contract || !to) {
        toast.error("Contract not available or recipient missing");
        return null;
      }

      setIsLoading(true);
      setError(null);

      const txId = addPendingTransaction({
        type: "transfer" as TransactionType,
        tokenSymbol: symbol,
        amount,
        to,
        status: "preparing",
      });

      try {
        const decimals = TOKEN_METADATA[symbol].decimals;
        const amountWei = parseUnits(amount, decimals);

        updatePendingTransaction(txId, { status: "awaiting_signature" });

        const tx = await contract.transfer(to, amountWei);
        const txHash = tx.hash;

        updatePendingTransaction(txId, { hash: txHash, status: "submitted" });
        toast.info("Transaction submitted, waiting for confirmation...");

        waitForConfirmation(contract, txHash, txId);

        return txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transfer failed";
        setError(message);
        updatePendingTransaction(txId, { error: message });
        toast.error(message);
        removePendingTransaction(txId);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [chainId, signer, addPendingTransaction, updatePendingTransaction, removePendingTransaction, queryClient]
  );

  // Burn tokens (admin only)
  const burn = useCallback(
    async ({ symbol, amount, to }: TransactionOptions) => {
      // Create contract using utility function (not a hook)
      const contract = createTokenContract(chainId, symbol, signer);
      const targetAddress = to || useWalletStore.getState().address;
      
      if (!contract || !targetAddress) {
        toast.error("Contract not available or address missing");
        return null;
      }

      setIsLoading(true);
      setError(null);

      const txId = addPendingTransaction({
        type: "burn" as TransactionType,
        tokenSymbol: symbol,
        amount,
        status: "preparing",
      });

      try {
        const decimals = TOKEN_METADATA[symbol].decimals;
        const amountWei = parseUnits(amount, decimals);

        updatePendingTransaction(txId, { status: "awaiting_signature" });

        const tx = await contract.burn(targetAddress, amountWei);
        const txHash = tx.hash;

        updatePendingTransaction(txId, { hash: txHash, status: "submitted" });
        toast.info("Transaction submitted, waiting for confirmation...");

        waitForConfirmation(contract, txHash, txId);

        return txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Burn failed";
        setError(message);
        updatePendingTransaction(txId, { error: message });
        toast.error(message);
        removePendingTransaction(txId);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [chainId, signer, addPendingTransaction, updatePendingTransaction, removePendingTransaction, queryClient]
  );

  return {
    mint,
    transfer,
    burn,
    isLoading,
    error,
  };
}