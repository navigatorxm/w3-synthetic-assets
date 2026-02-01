import { useWeb3 } from "@/providers/Web3Provider";
import { useWalletStore } from "@/stores/walletStore";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/validation";
import { getNetwork, isChainSupported, DEFAULT_CHAIN_ID } from "@/config/chains";
import { Wallet, ChevronDown, LogOut, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function ConnectButton() {
  const { connect, disconnect, switchNetwork, isMetaMaskInstalled } = useWeb3();
  const { address, chainId, isConnected, isConnecting, isAdmin } = useWalletStore();

  const network = chainId ? getNetwork(chainId) : null;
  const isValidNetwork = chainId ? isChainSupported(chainId) : false;

  if (!isMetaMaskInstalled) {
    return (
      <Button
        variant="outline"
        onClick={() => window.open("https://metamask.io/download/", "_blank")}
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        Install MetaMask
        <ExternalLink className="h-3 w-3" />
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <Button onClick={connect} disabled={isConnecting} className="gap-2">
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Network Badge */}
      {!isValidNetwork ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => switchNetwork(DEFAULT_CHAIN_ID)}
        >
          Wrong Network
        </Button>
      ) : (
        <Badge variant="secondary" className="px-3 py-1">
          {network?.name || "Unknown"}
        </Badge>
      )}

      {/* Admin Badge */}
      {isAdmin && (
        <Badge className="bg-primary text-primary-foreground">Admin</Badge>
      )}

      {/* Account Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            {shortenAddress(address || "")}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm text-muted-foreground">Connected</p>
            <p className="font-mono text-xs">{address}</p>
          </div>
          <DropdownMenuSeparator />
          {network?.blockExplorerUrl && (
            <DropdownMenuItem
              onClick={() =>
                window.open(`${network.blockExplorerUrl}/address/${address}`, "_blank")
              }
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnect} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
