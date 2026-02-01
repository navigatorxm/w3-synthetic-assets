import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useWalletStore } from "@/stores/walletStore";
import { isChainSupported, DEFAULT_CHAIN_ID, NETWORKS } from "@/config/chains";
import { toast } from "sonner";

// Extend window for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

interface Web3ContextValue {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  isMetaMaskInstalled: boolean;
}

const Web3Context = createContext<Web3ContextValue | null>(null);

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within Web3Provider");
  }
  return context;
}

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  
  const { setWallet, setConnecting, disconnect: disconnectStore } = useWalletStore();
  
  const isMetaMaskInstalled = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;

  // Initialize provider from MetaMask
  const initializeProvider = useCallback(async () => {
    if (!window.ethereum) return null;
    
    const browserProvider = new BrowserProvider(window.ethereum);
    setProvider(browserProvider);
    
    return browserProvider;
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask to connect");
      return;
    }

    setConnecting(true);

    try {
      const browserProvider = await initializeProvider();
      if (!browserProvider) throw new Error("Failed to initialize provider");

      // Request accounts
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const address = accounts[0];
      const network = await browserProvider.getNetwork();
      const chainId = Number(network.chainId);

      // Check if network is supported
      if (!isChainSupported(chainId)) {
        toast.warning("Please switch to a supported network");
        await switchNetwork(DEFAULT_CHAIN_ID);
        return;
      }

      const walletSigner = await browserProvider.getSigner();
      setSigner(walletSigner);
      setWallet(address, chainId);
      
      toast.success("Wallet connected successfully");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      const message = error instanceof Error ? error.message : "Failed to connect";
      toast.error(message);
    } finally {
      setConnecting(false);
    }
  }, [initializeProvider, setConnecting, setWallet]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    disconnectStore();
    toast.info("Wallet disconnected");
  }, [disconnectStore]);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    if (!window.ethereum) return;

    const network = NETWORKS[chainId];
    if (!network) {
      toast.error("Unsupported network");
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      // Chain not added, try to add it
      if ((switchError as { code?: number })?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: network.blockExplorerUrl
                  ? [network.blockExplorerUrl]
                  : undefined,
                nativeCurrency: network.nativeCurrency,
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
          toast.error("Failed to add network");
        }
      } else {
        console.error("Failed to switch network:", switchError);
        toast.error("Failed to switch network");
      }
    }
  }, []);

  // Listen to wallet events
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountList = accounts as string[];
      if (accountList.length === 0) {
        disconnect();
      } else {
        setWallet(accountList[0], useWalletStore.getState().chainId);
      }
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      const chainId = parseInt(chainIdHex as string, 16);
      
      if (!isChainSupported(chainId)) {
        toast.warning("Unsupported network. Please switch to Ethereum Mainnet or Sepolia.");
      }
      
      setWallet(useWalletStore.getState().address, chainId);
      // Reinitialize provider
      initializeProvider();
    };

    const handleDisconnect = () => {
      disconnect();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
      window.ethereum?.removeListener("disconnect", handleDisconnect);
    };
  }, [disconnect, initializeProvider, setWallet]);

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const { address } = useWalletStore.getState();
    
    if (address && window.ethereum) {
      initializeProvider().then(async (browserProvider) => {
        if (browserProvider) {
          try {
            const walletSigner = await browserProvider.getSigner();
            setSigner(walletSigner);
          } catch {
            // User may need to reconnect
            console.log("Auto-reconnect failed, user may need to reconnect");
          }
        }
      });
    }
  }, [initializeProvider]);

  const value: Web3ContextValue = {
    provider,
    signer,
    connect,
    disconnect,
    switchNetwork,
    isMetaMaskInstalled,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}
