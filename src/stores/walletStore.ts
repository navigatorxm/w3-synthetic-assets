import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WalletState, PendingTransaction } from "@/types";
import { STORAGE_KEYS } from "@/config/constants";
import { isAdminAddress } from "@/config/adminConfig";

interface WalletStore extends WalletState {
  // Pending transactions
  pendingTransactions: PendingTransaction[];
  
  // Actions
  setWallet: (address: string | null, chainId: number | null) => void;
  setConnecting: (isConnecting: boolean) => void;
  disconnect: () => void;
  
  // Transaction management
  addPendingTransaction: (tx: Omit<PendingTransaction, "id">) => string;
  updatePendingTransaction: (id: string, updates: Partial<PendingTransaction>) => void;
  removePendingTransaction: (id: string) => void;
  clearPendingTransactions: () => void;
}

function generateId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function checkIsAdmin(address: string | null): boolean {
  return isAdminAddress(address);
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      // Initial state
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      isAdmin: false,
      pendingTransactions: [],

      // Set wallet connection
      setWallet: (address, chainId) =>
        set({
          address,
          chainId,
          isConnected: !!address,
          isAdmin: checkIsAdmin(address),
        }),

      // Set connecting state
      setConnecting: (isConnecting) => set({ isConnecting }),

      // Disconnect wallet
      disconnect: () =>
        set({
          address: null,
          chainId: null,
          isConnected: false,
          isConnecting: false,
          isAdmin: false,
          pendingTransactions: [],
        }),

      // Add pending transaction
      addPendingTransaction: (tx) => {
        const id = generateId();
        set((state) => ({
          pendingTransactions: [
            ...state.pendingTransactions,
            { ...tx, id },
          ],
        }));
        return id;
      },

      // Update pending transaction
      updatePendingTransaction: (id, updates) =>
        set((state) => ({
          pendingTransactions: state.pendingTransactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
        })),

      // Remove pending transaction
      removePendingTransaction: (id) =>
        set((state) => ({
          pendingTransactions: state.pendingTransactions.filter(
            (tx) => tx.id !== id
          ),
        })),

      // Clear all pending transactions
      clearPendingTransactions: () => set({ pendingTransactions: [] }),
    }),
    {
      name: STORAGE_KEYS.WALLET_CONNECTOR,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        address: state.address,
        chainId: state.chainId,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const selectAddress = (state: WalletStore) => state.address;
export const selectChainId = (state: WalletStore) => state.chainId;
export const selectIsConnected = (state: WalletStore) => state.isConnected;
export const selectIsAdmin = (state: WalletStore) => state.isAdmin;
export const selectPendingTransactions = (state: WalletStore) =>
  state.pendingTransactions;
