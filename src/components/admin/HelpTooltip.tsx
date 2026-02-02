import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function HelpTooltip({ content, className, side = "top" }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full hover:bg-muted transition-colors",
            className
          )}
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

// Predefined help content for common fields
export const helpContent = {
  adminAddress: (
    <div className="space-y-1">
      <p className="font-medium">Admin Wallet Address</p>
      <p className="text-xs">
        Add wallet addresses that have permission to mint, burn, and configure tokens. 
        These addresses must also be granted the MINTER_ROLE on the smart contract.
      </p>
    </div>
  ),
  tokenSymbol: (
    <div className="space-y-1">
      <p className="font-medium">Token Symbol</p>
      <p className="text-xs">
        Short identifier for your token (e.g., USDT, BTC, ETH). 
        This should match the symbol used in your deployed contract.
      </p>
    </div>
  ),
  tokenDecimals: (
    <div className="space-y-1">
      <p className="font-medium">Decimals</p>
      <p className="text-xs">
        Number of decimal places for the token:
      </p>
      <ul className="text-xs list-disc list-inside">
        <li><strong>6</strong> - For stablecoins (USDT, USDC)</li>
        <li><strong>8</strong> - For Bitcoin-like tokens</li>
        <li><strong>18</strong> - For ETH-like tokens</li>
      </ul>
    </div>
  ),
  contractAddress: (
    <div className="space-y-1">
      <p className="font-medium">Contract Address</p>
      <p className="text-xs">
        The deployed FlashToken contract address on the selected network. 
        You can find this in your deployment output or on a block explorer.
      </p>
    </div>
  ),
  expiryDays: (
    <div className="space-y-1">
      <p className="font-medium">Token Expiry</p>
      <p className="text-xs">
        Tokens become non-transferable after this period expires. 
        The holder can still see and hold the tokens, but cannot transfer them to others.
      </p>
    </div>
  ),
  mintRecipient: (
    <div className="space-y-1">
      <p className="font-medium">Recipient Address</p>
      <p className="text-xs">
        The wallet address that will receive the newly minted tokens. 
        Click "Self" to use your connected wallet address.
      </p>
    </div>
  ),
  mintAmount: (
    <div className="space-y-1">
      <p className="font-medium">Amount</p>
      <p className="text-xs">
        The number of tokens to mint. This will be converted using the token's decimal places 
        (e.g., 1000 USDT with 6 decimals = 1,000,000,000 base units).
      </p>
    </div>
  ),
  network: (
    <div className="space-y-1">
      <p className="font-medium">Network</p>
      <p className="text-xs">
        Select the blockchain network where your token contract is deployed. 
        Make sure your wallet is connected to the same network.
      </p>
    </div>
  ),
};
