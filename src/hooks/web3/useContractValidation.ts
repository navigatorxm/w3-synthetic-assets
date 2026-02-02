import { useState, useCallback } from "react";
import { JsonRpcProvider } from "ethers";
import { NETWORKS } from "@/config/chains";

export interface ContractValidationResult {
  isDeployed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useContractValidation() {
  const [validationCache, setValidationCache] = useState<
    Record<string, ContractValidationResult>
  >({});

  /**
   * Check if a contract is deployed at the given address on the specified chain
   */
  const validateContract = useCallback(
    async (
      contractAddress: string,
      chainId: number
    ): Promise<ContractValidationResult> => {
      const cacheKey = `${contractAddress.toLowerCase()}-${chainId}`;

      // Return cached result if available
      if (validationCache[cacheKey] && !validationCache[cacheKey].isLoading) {
        return validationCache[cacheKey];
      }

      // Set loading state
      setValidationCache((prev) => ({
        ...prev,
        [cacheKey]: { isDeployed: false, isLoading: true, error: null },
      }));

      try {
        const network = NETWORKS[chainId];
        if (!network) {
          const result: ContractValidationResult = {
            isDeployed: false,
            isLoading: false,
            error: "Unsupported network",
          };
          setValidationCache((prev) => ({ ...prev, [cacheKey]: result }));
          return result;
        }

        const provider = new JsonRpcProvider(network.rpcUrl);
        const bytecode = await provider.getCode(contractAddress);

        const isDeployed =
          bytecode !== "0x" &&
          bytecode !== "0x0" &&
          !!bytecode &&
          bytecode.length > 2;

        const result: ContractValidationResult = {
          isDeployed,
          isLoading: false,
          error: isDeployed ? null : "No contract deployed at this address",
        };

        setValidationCache((prev) => ({ ...prev, [cacheKey]: result }));
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to validate contract";
        const result: ContractValidationResult = {
          isDeployed: false,
          isLoading: false,
          error: errorMessage,
        };
        setValidationCache((prev) => ({ ...prev, [cacheKey]: result }));
        return result;
      }
    },
    [validationCache]
  );

  /**
   * Clear cache for a specific contract or all contracts
   */
  const clearCache = useCallback((contractAddress?: string, chainId?: number) => {
    if (contractAddress && chainId !== undefined) {
      const cacheKey = `${contractAddress.toLowerCase()}-${chainId}`;
      setValidationCache((prev) => {
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
    } else {
      setValidationCache({});
    }
  }, []);

  /**
   * Get cached validation result
   */
  const getCachedResult = useCallback(
    (contractAddress: string, chainId: number): ContractValidationResult | null => {
      const cacheKey = `${contractAddress.toLowerCase()}-${chainId}`;
      return validationCache[cacheKey] || null;
    },
    [validationCache]
  );

  return {
    validateContract,
    clearCache,
    getCachedResult,
    validationCache,
  };
}
