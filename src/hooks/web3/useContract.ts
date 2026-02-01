import { Contract } from "ethers";
import { useWeb3 } from "@/providers/Web3Provider";
import { useWalletStore } from "@/stores/walletStore";
import { FLASH_TOKEN_ABI, getTokenAddress } from "@/config/contracts";
import type { TokenSymbol } from "@/types";
import { useMemo } from "react";

interface UseContractReturn {
  contract: Contract | null;
  isReady: boolean;
}

// Hook to get a token contract instance
export function useTokenContract(symbol: TokenSymbol): UseContractReturn {
  const { signer, provider } = useWeb3();
  const chainId = useWalletStore((state) => state.chainId);

  const contract = useMemo(() => {
    if (!chainId) return null;
    
    const address = getTokenAddress(chainId, symbol);
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    // Use signer if available, otherwise provider for read-only
    const signerOrProvider = signer || provider;
    if (!signerOrProvider) return null;

    return new Contract(address, FLASH_TOKEN_ABI, signerOrProvider);
  }, [chainId, symbol, signer, provider]);

  return {
    contract,
    isReady: !!contract,
  };
}

// Hook to get all token contracts
export function useAllTokenContracts(): Record<TokenSymbol, Contract | null> {
  const usdt = useTokenContract("USDT");
  const btc = useTokenContract("BTC");
  const eth = useTokenContract("ETH");

  return {
    USDT: usdt.contract,
    BTC: btc.contract,
    ETH: eth.contract,
  };
}
