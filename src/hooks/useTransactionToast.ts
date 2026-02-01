import { toast } from "sonner";
import { getExplorerTxUrl } from "@/config/chains";
import { useWalletStore } from "@/stores/walletStore";

type TransactionType = "transfer" | "mint" | "burn";

interface TransactionToastOptions {
  type: TransactionType;
  hash?: string;
  amount?: string;
  symbol?: string;
  to?: string;
}

export function useTransactionToast() {
  const chainId = useWalletStore((state) => state.chainId);

  const showPending = ({ type, amount, symbol }: TransactionToastOptions) => {
    const messages: Record<TransactionType, string> = {
      transfer: `Sending ${amount} ${symbol}...`,
      mint: `Minting ${amount} ${symbol}...`,
      burn: `Burning ${amount} ${symbol}...`,
    };

    return toast.loading(messages[type], {
      description: "Waiting for confirmation",
    });
  };

  const showSuccess = (
    toastId: string | number,
    { type, hash, amount, symbol, to }: TransactionToastOptions
  ) => {
    const explorerUrl = chainId && hash ? getExplorerTxUrl(chainId, hash) : "";
    
    const messages: Record<TransactionType, string> = {
      transfer: `Successfully sent ${amount} ${symbol}`,
      mint: `Successfully minted ${amount} ${symbol}`,
      burn: `Successfully burned ${amount} ${symbol}`,
    };

    toast.success(messages[type], {
      id: toastId,
      description: to ? `To: ${to.slice(0, 8)}...${to.slice(-6)}` : undefined,
      action: explorerUrl
        ? {
            label: "View on Explorer",
            onClick: () => window.open(explorerUrl, "_blank"),
          }
        : undefined,
      duration: 5000,
    });
  };

  const showError = (toastId: string | number, error: string) => {
    toast.error("Transaction Failed", {
      id: toastId,
      description: error.slice(0, 100),
      duration: 5000,
    });
  };

  const showApprovalNeeded = () => {
    return toast.info("Approval Required", {
      description: "Please confirm the transaction in your wallet",
    });
  };

  return {
    showPending,
    showSuccess,
    showError,
    showApprovalNeeded,
  };
}
