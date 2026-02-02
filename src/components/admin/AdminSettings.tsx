import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAdminAddresses,
  addAdminAddress,
  removeAdminAddress,
  getCustomTokens,
  saveCustomToken,
  removeCustomToken,
  DEFAULT_ADMIN_ADDRESSES,
  type CustomToken,
} from "@/config/adminConfig";
import { CHAIN_IDS, NETWORKS } from "@/config/chains";
import { ethereumAddressSchema } from "@/types";
import { Settings, Plus, Trash2, Shield, Coins, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TokenIconUpload } from "./TokenIconUpload";
import { HelpTooltip, helpContent } from "./HelpTooltip";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { JsonRpcProvider } from "ethers";

export function AdminSettings() {
  const [adminAddresses, setAdminAddresses] = useState<string[]>([]);
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  
  // Token dialog state
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [isValidatingContract, setIsValidatingContract] = useState(false);
  const [newToken, setNewToken] = useState<Partial<CustomToken>>({
    symbol: "",
    name: "",
    decimals: 18,
    icon: "🪙",
    contractAddress: "",
    chainId: CHAIN_IDS.BSC_MAINNET,
  });

  // Load data on mount
  useEffect(() => {
    setAdminAddresses(getAdminAddresses());
    setCustomTokens(getCustomTokens());
  }, []);

  const handleAddAdmin = () => {
    const trimmed = newAdmin.trim();
    
    // Validate address
    const result = ethereumAddressSchema.safeParse(trimmed);
    if (!result.success) {
      toast.error("Invalid Ethereum address format");
      return;
    }

    // Check if already exists
    if (adminAddresses.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Address is already an admin");
      return;
    }

    addAdminAddress(trimmed);
    setAdminAddresses(getAdminAddresses());
    setNewAdmin("");
    toast.success("Admin address added");
  };

  const handleRemoveAdmin = (address: string) => {
    if (DEFAULT_ADMIN_ADDRESSES.some(a => a.toLowerCase() === address.toLowerCase())) {
      toast.error("Cannot remove default admin addresses");
      return;
    }

    removeAdminAddress(address);
    setAdminAddresses(getAdminAddresses());
    toast.success("Admin address removed");
  };

  const handleAddToken = async () => {
    // Validate required fields
    if (!newToken.symbol || !newToken.name || !newToken.contractAddress) {
      toast.error("Please fill in all required fields");
      return;
    }

    const result = ethereumAddressSchema.safeParse(newToken.contractAddress);
    if (!result.success) {
      toast.error("Invalid contract address format");
      return;
    }

    // Validate contract deployment before saving
    setIsValidatingContract(true);
    try {
      const network = NETWORKS[newToken.chainId!];
      if (!network) {
        toast.error("Unsupported network");
        setIsValidatingContract(false);
        return;
      }

      const provider = new JsonRpcProvider(network.rpcUrl);
      const bytecode = await provider.getCode(newToken.contractAddress);
      const isDeployed =
        bytecode !== "0x" &&
        bytecode !== "0x0" &&
        !!bytecode &&
        bytecode.length > 2;

      if (!isDeployed) {
        toast.warning(
          `No contract detected at ${newToken.contractAddress.slice(0, 10)}... on ${network.name}. Token saved but minting won't work until contract is deployed.`,
          { duration: 6000 }
        );
      } else {
        toast.success("Contract verified and token configuration saved");
      }
    } catch (error) {
      console.error("Contract validation error:", error);
      toast.warning(
        "Could not verify contract deployment. Token saved - please ensure contract is deployed before minting.",
        { duration: 5000 }
      );
    } finally {
      setIsValidatingContract(false);
    }

    saveCustomToken(newToken as CustomToken);
    setCustomTokens(getCustomTokens());
    setTokenDialogOpen(false);
    setNewToken({
      symbol: "",
      name: "",
      decimals: 18,
      icon: "🪙",
      contractAddress: "",
      chainId: CHAIN_IDS.BSC_MAINNET,
    });
  };

  const handleRemoveToken = (symbol: string, chainId: number) => {
    removeCustomToken(symbol, chainId);
    setCustomTokens(getCustomTokens());
    toast.success("Token removed");
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = (address: string, chainId: number) => {
    const network = NETWORKS[chainId];
    if (network?.blockExplorerUrl) {
      return `${network.blockExplorerUrl}/address/${address}`;
    }
    return null;
  };

  // Render token icon (supports both emoji and image URLs)
  const renderTokenIcon = (icon: string) => {
    if (icon.startsWith("data:") || icon.startsWith("http")) {
      return <img src={icon} alt="Token" className="h-8 w-8 rounded object-cover" />;
    }
    return <span className="text-xl">{icon}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Admin Addresses Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Wallet Addresses
            <HelpTooltip content={helpContent.adminAddress} />
          </CardTitle>
          <CardDescription>
            Manage wallet addresses that have admin access to mint, burn, and configure tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new admin */}
          <div className="flex gap-2">
            <Input
              placeholder="0x..."
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              className="font-mono"
            />
            <Button onClick={handleAddAdmin}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <Separator />

          {/* Admin list */}
          {adminAddresses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No admin addresses configured. Add your wallet address to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminAddresses.map((address) => {
                  const isDefault = DEFAULT_ADMIN_ADDRESSES.some(
                    a => a.toLowerCase() === address.toLowerCase()
                  );
                  return (
                    <TableRow key={address}>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          {truncateAddress(address)}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(address)}
                          >
                            {copied === address ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isDefault ? "default" : "secondary"}>
                          {isDefault ? "Default" : "Custom"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDefault}
                          onClick={() => handleRemoveAdmin(address)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Token Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Token Configurations
              </CardTitle>
              <CardDescription>
                Configure custom FlashAsset tokens with their contract addresses
              </CardDescription>
            </div>
            <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Token
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Token Configuration</DialogTitle>
                  <DialogDescription>
                    Configure a new FlashAsset token. You'll need the deployed contract address.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="symbol">Symbol *</Label>
                        <HelpTooltip content={helpContent.tokenSymbol} />
                      </div>
                      <Input
                        id="symbol"
                        placeholder="USDT"
                        value={newToken.symbol}
                        onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="decimals">Decimals</Label>
                        <HelpTooltip content={helpContent.tokenDecimals} />
                      </div>
                      <Select
                        value={String(newToken.decimals)}
                        onValueChange={(v) => setNewToken({ ...newToken, decimals: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 (USDT/USDC)</SelectItem>
                          <SelectItem value="8">8 (BTC)</SelectItem>
                          <SelectItem value="18">18 (ETH)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Flash USDT"
                      value={newToken.name}
                      onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                    />
                  </div>

                  {/* Token Icon Upload */}
                  <TokenIconUpload
                    value={newToken.icon || "🪙"}
                    onChange={(icon) => setNewToken({ ...newToken, icon })}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="chainId">Network</Label>
                      <HelpTooltip content={helpContent.network} />
                    </div>
                    <Select
                      value={String(newToken.chainId)}
                      onValueChange={(v) => setNewToken({ ...newToken, chainId: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(NETWORKS).map(([id, network]) => (
                          <SelectItem key={id} value={id}>
                            {network.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="contractAddress">Contract Address *</Label>
                      <HelpTooltip content={helpContent.contractAddress} />
                    </div>
                    <Input
                      id="contractAddress"
                      placeholder="0x..."
                      className="font-mono"
                      value={newToken.contractAddress}
                      onChange={(e) => setNewToken({ ...newToken, contractAddress: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTokenDialogOpen(false)} disabled={isValidatingContract}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddToken} disabled={isValidatingContract}>
                    {isValidatingContract ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Save Token"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {customTokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tokens configured yet.</p>
              <p className="text-sm mt-1">
                Deploy your FlashToken contracts and add them here to start minting.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customTokens.map((token, index) => (
                  <TableRow key={`${token.symbol}-${token.chainId}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderTokenIcon(token.icon)}
                        <div>
                          <p className="font-medium">{token.symbol}</p>
                          <p className="text-xs text-muted-foreground">{token.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {NETWORKS[token.chainId]?.name || `Chain ${token.chainId}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ContractStatusBadge
                        contractAddress={token.contractAddress}
                        chainId={token.chainId}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        {truncateAddress(token.contractAddress)}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(token.contractAddress)}
                        >
                          {copied === token.contractAddress ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        {getExplorerUrl(token.contractAddress, token.chainId) && (
                          <a
                            href={getExplorerUrl(token.contractAddress, token.chainId)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveToken(token.symbol, token.chainId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
