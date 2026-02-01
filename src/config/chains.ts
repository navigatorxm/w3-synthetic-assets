import type { NetworkConfig } from "@/types";

// Supported chain IDs
export const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  SEPOLIA: 11155111,
  POLYGON_MAINNET: 137,
  POLYGON_AMOY: 80002,
  LOCALHOST: 31337,
} as const;

// Network configurations
export const NETWORKS: Record<number, NetworkConfig> = {
  [CHAIN_IDS.POLYGON_MAINNET]: {
    chainId: CHAIN_IDS.POLYGON_MAINNET,
    name: "Polygon Mainnet",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorerUrl: "https://polygonscan.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    isTestnet: false,
  },
  [CHAIN_IDS.POLYGON_AMOY]: {
    chainId: CHAIN_IDS.POLYGON_AMOY,
    name: "Polygon Amoy Testnet",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorerUrl: "https://amoy.polygonscan.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    isTestnet: true,
  },
  [CHAIN_IDS.ETHEREUM_MAINNET]: {
    chainId: CHAIN_IDS.ETHEREUM_MAINNET,
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth.llamarpc.com",
    blockExplorerUrl: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: false,
  },
  [CHAIN_IDS.SEPOLIA]: {
    chainId: CHAIN_IDS.SEPOLIA,
    name: "Sepolia Testnet",
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia ETH",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: true,
  },
  [CHAIN_IDS.LOCALHOST]: {
    chainId: CHAIN_IDS.LOCALHOST,
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorerUrl: "",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: true,
  },
};

// Default network for production - Polygon for low gas fees
export const DEFAULT_CHAIN_ID = CHAIN_IDS.POLYGON_MAINNET;

// Supported chains for the app
export const SUPPORTED_CHAIN_IDS = [
  CHAIN_IDS.POLYGON_MAINNET,
  CHAIN_IDS.POLYGON_AMOY,
  CHAIN_IDS.ETHEREUM_MAINNET,
  CHAIN_IDS.SEPOLIA,
] as const;

// Get network by chain ID
export function getNetwork(chainId: number): NetworkConfig | undefined {
  return NETWORKS[chainId];
}

// Check if chain is supported
export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId as typeof SUPPORTED_CHAIN_IDS[number]);
}

// Get block explorer URL for transaction
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const network = NETWORKS[chainId];
  if (!network?.blockExplorerUrl) return "";
  return `${network.blockExplorerUrl}/tx/${txHash}`;
}

// Get block explorer URL for address
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const network = NETWORKS[chainId];
  if (!network?.blockExplorerUrl) return "";
  return `${network.blockExplorerUrl}/address/${address}`;
}
