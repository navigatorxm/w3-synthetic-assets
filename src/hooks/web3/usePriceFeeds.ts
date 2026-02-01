import { useQuery } from "@tanstack/react-query";
import { Contract } from "ethers";
import { useWeb3 } from "@/providers/Web3Provider";
import { useWalletStore } from "@/stores/walletStore";
import {
  CHAINLINK_AGGREGATOR_ABI,
  getPriceFeedAddress,
  isPriceStale,
  type PriceData,
} from "@/config/priceFeeds";
import { ALL_TOKEN_SYMBOLS } from "@/config/contracts";
import type { TokenSymbol } from "@/types";

// Hook to fetch a single token price from Chainlink
export function useTokenPrice(symbol: TokenSymbol) {
  const { provider } = useWeb3();
  const chainId = useWalletStore((state) => state.chainId);

  return useQuery({
    queryKey: ["tokenPrice", chainId, symbol],
    queryFn: async (): Promise<PriceData | null> => {
      if (!provider || !chainId) return null;

      const feedAddress = getPriceFeedAddress(chainId, symbol);
      if (!feedAddress || feedAddress === "0x0000000000000000000000000000000000000000") {
        // Return mock price for tokens without feeds
        return {
          symbol,
          price: symbol === "USDT" ? 1.0 : 0,
          priceFormatted: symbol === "USDT" ? "$1.00" : "N/A",
          decimals: 8,
          updatedAt: new Date(),
          isStale: false,
        };
      }

      try {
        const contract = new Contract(feedAddress, CHAINLINK_AGGREGATOR_ABI, provider);
        
        const [roundData, decimals] = await Promise.all([
          contract.latestRoundData(),
          contract.decimals(),
        ]);

        const price = Number(roundData.answer) / Math.pow(10, decimals);
        const updatedAt = new Date(Number(roundData.updatedAt) * 1000);

        return {
          symbol,
          price,
          priceFormatted: formatPrice(price),
          decimals,
          updatedAt,
          isStale: isPriceStale(updatedAt),
        };
      } catch (error) {
        console.error(`Error fetching ${symbol} price:`, error);
        return null;
      }
    },
    enabled: !!provider && !!chainId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook to fetch all token prices
export function useAllPrices() {
  const { provider } = useWeb3();
  const chainId = useWalletStore((state) => state.chainId);

  return useQuery({
    queryKey: ["allTokenPrices", chainId],
    queryFn: async (): Promise<PriceData[]> => {
      if (!provider || !chainId) return [];

      const prices: PriceData[] = [];

      for (const symbol of ALL_TOKEN_SYMBOLS) {
        const feedAddress = getPriceFeedAddress(chainId, symbol);
        
        if (!feedAddress || feedAddress === "0x0000000000000000000000000000000000000000") {
          // Mock price for USDT (stablecoin)
          if (symbol === "USDT") {
            prices.push({
              symbol,
              price: 1.0,
              priceFormatted: "$1.00",
              decimals: 8,
              updatedAt: new Date(),
              isStale: false,
            });
          }
          continue;
        }

        try {
          const contract = new Contract(feedAddress, CHAINLINK_AGGREGATOR_ABI, provider);
          
          const [roundData, decimals] = await Promise.all([
            contract.latestRoundData(),
            contract.decimals(),
          ]);

          const price = Number(roundData.answer) / Math.pow(10, decimals);
          const updatedAt = new Date(Number(roundData.updatedAt) * 1000);

          prices.push({
            symbol,
            price,
            priceFormatted: formatPrice(price),
            decimals,
            updatedAt,
            isStale: isPriceStale(updatedAt),
          });
        } catch (error) {
          console.error(`Error fetching ${symbol} price:`, error);
        }
      }

      return prices;
    },
    enabled: !!provider && !!chainId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

// Format price with appropriate decimals
function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(6)}`;
  }
}

// Calculate portfolio value
export function usePortfolioValue() {
  const { data: prices } = useAllPrices();
  const { useAllBalances } = require("@/hooks/web3/useBalance");
  const { data: balances } = useAllBalances();

  if (!prices || !balances) return null;

  let totalValue = 0;

  for (const balance of balances) {
    const price = prices.find((p) => p.symbol === balance.symbol);
    if (price && !balance.isExpired) {
      totalValue += parseFloat(balance.balanceFormatted) * price.price;
    }
  }

  return {
    totalValue,
    totalValueFormatted: formatPrice(totalValue),
  };
}
