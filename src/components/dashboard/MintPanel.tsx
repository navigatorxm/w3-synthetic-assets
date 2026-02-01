import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useWalletStore } from "@/stores/walletStore";
import { useWeb3 } from "@/providers/Web3Provider";
import { getCustomTokens, type CustomToken } from "@/config/adminConfig";
import { NETWORKS } from "@/config/chains";
import { Contract, parseUnits } from "ethers";
import { FLASH_TOKEN_ABI } from "@/config/contracts";
import { toast } from "sonner";
import { Coins, Loader2, Plus, Zap, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MintPanel() {
  const { address, chainId, isAdmin } = useWalletStore();
  const { signer, switchNetwork } = useWeb3();
  const [selectedToken, setSelectedToken] = useState<CustomToken | null>(null);
  const [amount, setAmount] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const customTokens = getCustomTokens();
  const currentNetwork = chainId ? NETWORKS[chainId] : null;
  const hasTokens = customTokens.length > 0;

  const handleMint = async () => {
    if (!signer || !selectedToken || !amount || !address) {
      toast.error("Please fill all fields and connect wallet");
      return;
    }

    if (!selectedToken.contractAddress || selectedToken.contractAddress === "0x0000000000000000000000000000000000000000") {
      toast.error("Token contract not deployed yet. Please deploy the contract first.");
      return;
    }

    setIsLoading(true);

    try {
      const contract = new Contract(selectedToken.contractAddress, FLASH_TOKEN_ABI, signer);
      
      const amountWei = parseUnits(amount, selectedToken.decimals);
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60);

      toast.info("Please confirm the transaction in MetaMask...");
      
      const tx = await contract.mint(address, amountWei, expiryTimestamp);
      
      toast.info(`Transaction submitted! Hash: ${tx.hash.slice(0, 10)}...`);
      
      await tx.wait();
      
      toast.success(`Successfully minted ${amount} ${selectedToken.symbol}!`);
      setAmount("");
    } catch (error: unknown) {
      console.error("Mint error:", error);
      const errorMessage = error instanceof Error ? error.message : "Mint failed";
      
      if (errorMessage.includes("user rejected")) {
        toast.error("Transaction cancelled by user");
      } else if (errorMessage.includes("AccessControl")) {
        toast.error("You don't have minter role on this contract");
      } else {
        toast.error(errorMessage.slice(0, 100));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Admin Access Required
          </CardTitle>
          <CardDescription>
            You need to be a whitelisted admin to mint tokens. Go to Admin → Settings to configure admin addresses.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Mint
        </CardTitle>
        <CardDescription>
          Mint tokens directly to your connected wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${chainId === 137 ? "bg-green-500" : "bg-yellow-500"}`} />
            <span className="text-sm font-medium">
              {currentNetwork?.name || "Unknown Network"}
            </span>
          </div>
          {chainId !== 137 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => switchNetwork(137)}
            >
              Switch to Polygon
            </Button>
          )}
        </div>

        {/* Token Selection */}
        {!hasTokens ? (
          <div className="text-center py-6 space-y-3">
            <Coins className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">No tokens configured</p>
              <p className="text-sm text-muted-foreground">
                Go to Admin → Settings to add your deployed token contracts
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/admin">
                <Plus className="h-4 w-4 mr-2" />
                Configure Tokens
              </a>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Select Token</Label>
              <Select
                value={selectedToken?.symbol || ""}
                onValueChange={(symbol) => {
                  const token = customTokens.find(t => t.symbol === symbol);
                  setSelectedToken(token || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose token to mint" />
                </SelectTrigger>
                <SelectContent>
                  {customTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <span>{token.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {token.decimals} decimals
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedToken && (
              <>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder={`Enter ${selectedToken.symbol} amount`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="any"
                  />
                  <div className="flex gap-2">
                    {[100, 500, 1000, 5000].map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(preset.toString())}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Expiry Period</Label>
                    <span className="text-sm text-muted-foreground">{expiryDays} days</span>
                  </div>
                  <Slider
                    value={[expiryDays]}
                    onValueChange={([value]) => setExpiryDays(value)}
                    min={1}
                    max={365}
                    step={1}
                    className="py-2"
                  />
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleMint}
                  disabled={isLoading || !amount || parseFloat(amount) <= 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Mint {amount || "0"} {selectedToken.symbol}
                    </>
                  )}
                </Button>

                {selectedToken.contractAddress === "0x0000000000000000000000000000000000000000" && (
                  <p className="text-sm text-destructive text-center">
                    ⚠️ Contract not deployed. Deploy the FlashToken contract first.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
