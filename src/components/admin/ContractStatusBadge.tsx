import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonRpcProvider } from "ethers";
import { NETWORKS } from "@/config/chains";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContractStatusBadgeProps {
  contractAddress: string;
  chainId: number;
  showRefresh?: boolean;
}

type DeploymentStatus = "loading" | "deployed" | "not-deployed" | "error";

export function ContractStatusBadge({
  contractAddress,
  chainId,
  showRefresh = true,
}: ContractStatusBadgeProps) {
  const [status, setStatus] = useState<DeploymentStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const checkDeployment = async () => {
    setStatus("loading");
    setError(null);

    try {
      const network = NETWORKS[chainId];
      if (!network) {
        setStatus("error");
        setError("Unsupported network");
        return;
      }

      const provider = new JsonRpcProvider(network.rpcUrl);
      const bytecode = await provider.getCode(contractAddress);

      const isDeployed =
        bytecode !== "0x" &&
        bytecode !== "0x0" &&
        !!bytecode &&
        bytecode.length > 2;

      setStatus(isDeployed ? "deployed" : "not-deployed");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to check");
    }
  };

  useEffect(() => {
    checkDeployment();
  }, [contractAddress, chainId]);

  const renderBadge = () => {
    switch (status) {
      case "loading":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking
          </Badge>
        );
      case "deployed":
        return (
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Deployed
          </Badge>
        );
      case "not-deployed":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Not Deployed
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>No contract bytecode found at this address on this network.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deploy your contract or verify the address.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "error":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
                  <XCircle className="h-3 w-3" />
                  Error
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{error || "Failed to verify contract"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
    }
  };

  return (
    <div className="flex items-center gap-1">
      {renderBadge()}
      {showRefresh && status !== "loading" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            checkDeployment();
          }}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
