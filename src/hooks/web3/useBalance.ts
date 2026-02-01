import { useQuery } from "@tanstack/react-query";
import { useTokenContract } from "./useContract";
import { useWalletStore } from "@/stores/walletStore";
import { formatTokenAmount } from "@/lib/validation";
import { QUERY_KEYS, BALANCE_POLL_INTERVAL } from "@/config/constants";
import { ALL_TOKEN_SYMBOLS, TOKEN_METADATA, getTokenAddress } from "@/config/contracts";
import type { TokenBalance, TokenSymbol } from "@/types";

// Fetch balance for a single token
async function fetchTokenBalance(
  contract: ReturnType<typeof useTokenContract>["contract"],
  address: string,
  symbol: TokenSymbol,
  chainId: number
): Promise<TokenBalance | null> {
  if (!contract || !address) return null;

  try {
    const [balance, expiry] = await Promise.all([
      contract.balanceOf(address) as Promise<bigint>,
      contract.expiryOf(address) as Promise<bigint>,
    ]);

    const expiryTimestamp = Number(expiry);
    const now = Math.floor(Date.now() / 1000);

    return {
      symbol,
      balance: balance.toString(),
      balanceFormatted: formatTokenAmount(balance, symbol),
      expiryTimestamp,
      isExpired: expiryTimestamp > 0 && expiryTimestamp < now,
      contractAddress: getTokenAddress(chainId, symbol),
    };
  } catch (error) {
    console.error(`Failed to fetch ${symbol} balance:`, error);
    return null;
  }
}

// Hook to fetch balance for a specific token
export function useTokenBalance(symbol: TokenSymbol) {
  const { contract, isReady } = useTokenContract(symbol);
  const address = useWalletStore((state) => state.address);
  const chainId = useWalletStore((state) => state.chainId);

  return useQuery({
    queryKey: [QUERY_KEYS.BALANCES, symbol, address, chainId],
    queryFn: () => fetchTokenBalance(contract, address!, symbol, chainId!),
    enabled: isReady && !!address && !!chainId,
    refetchInterval: BALANCE_POLL_INTERVAL,
    staleTime: BALANCE_POLL_INTERVAL / 2,
  });
}

// Hook to fetch all token balances
export function useAllBalances() {
  const address = useWalletStore((state) => state.address);
  const chainId = useWalletStore((state) => state.chainId);
  const isConnected = useWalletStore((state) => state.isConnected);

  return useQuery({
    queryKey: [QUERY_KEYS.BALANCES, "all", address, chainId],
    queryFn: async (): Promise<TokenBalance[]> => {
      if (!address || !chainId) return [];

      // For now, return mock data since contracts aren't deployed
      // Replace with actual contract calls once deployed
      const mockBalances: TokenBalance[] = ALL_TOKEN_SYMBOLS.map((symbol) => ({
        symbol,
        balance: "0",
        balanceFormatted: "0",
        expiryTimestamp: 0,
        isExpired: false,
        contractAddress: getTokenAddress(chainId, symbol),
      }));

      return mockBalances;
    },
    enabled: isConnected && !!address && !!chainId,
    refetchInterval: BALANCE_POLL_INTERVAL,
    staleTime: BALANCE_POLL_INTERVAL / 2,
  });
}

// Get token display info (icon, name, etc.)
export function useTokenInfo(symbol: TokenSymbol) {
  const chainId = useWalletStore((state) => state.chainId);
  
  return {
    ...TOKEN_METADATA[symbol],
    contractAddress: chainId ? getTokenAddress(chainId, symbol) : "",
  };
}
