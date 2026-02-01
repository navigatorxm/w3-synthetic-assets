import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseUnits, formatUnits, Contract } from "ethers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCustomTokens, type CustomToken } from "@/config/adminConfig";
import { useWalletStore } from "@/stores/walletStore";
import { useWeb3 } from "@/providers/Web3Provider";
import { FLASH_TOKEN_ABI } from "@/config/contracts";
import { ethereumAddressSchema } from "@/types";
import { Send, Loader2, Wallet, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const transferFormSchema = z.object({
  to: ethereumAddressSchema,
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  tokenAddress: z.string().min(1, "Select a token"),
});

type TransferFormData = z.infer<typeof transferFormSchema>;

export function QuickTransferForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [tokens, setTokens] = useState<CustomToken[]>([]);
  const [balance, setBalance] = useState<string | null>(null);
  const { address, isConnected, chainId } = useWalletStore();
  const { signer, provider } = useWeb3();

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      to: "",
      amount: "",
      tokenAddress: "",
    },
  });

  const selectedTokenAddress = form.watch("tokenAddress");
  const selectedToken = tokens.find(t => t.contractAddress === selectedTokenAddress);

  // Load tokens for current chain
  useEffect(() => {
    if (chainId) {
      const chainTokens = getCustomTokens().filter(t => t.chainId === chainId);
      setTokens(chainTokens);
      
      if (chainTokens.length > 0 && !form.getValues("tokenAddress")) {
        form.setValue("tokenAddress", chainTokens[0].contractAddress);
      }
    }
  }, [chainId, form]);

  // Fetch balance when token changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!selectedTokenAddress || !address || !provider) {
        setBalance(null);
        return;
      }

      setIsLoadingBalance(true);
      try {
        const contract = new Contract(selectedTokenAddress, FLASH_TOKEN_ABI, provider);
        const bal = await contract.balanceOf(address);
        const decimals = selectedToken?.decimals || 18;
        setBalance(formatUnits(bal, decimals));
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [selectedTokenAddress, address, provider, selectedToken]);

  const handleMaxAmount = () => {
    if (balance) {
      form.setValue("amount", balance);
    }
  };

  const refreshBalance = async () => {
    if (!selectedTokenAddress || !address || !provider) return;
    
    setIsLoadingBalance(true);
    try {
      const contract = new Contract(selectedTokenAddress, FLASH_TOKEN_ABI, provider);
      const bal = await contract.balanceOf(address);
      const decimals = selectedToken?.decimals || 18;
      setBalance(formatUnits(bal, decimals));
    } catch (error) {
      console.error("Error refreshing balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const onSubmit = async (data: TransferFormData) => {
    if (!signer || !selectedToken) {
      toast.error("Wallet or token not available");
      return;
    }

    setIsSubmitting(true);

    try {
      const contract = new Contract(data.tokenAddress, FLASH_TOKEN_ABI, signer);
      const amountWei = parseUnits(data.amount, selectedToken.decimals);

      toast.info("Please confirm the transaction in your wallet...");

      const tx = await contract.transfer(data.to, amountWei);
      
      toast.info(`Transaction submitted: ${tx.hash.slice(0, 10)}...`);
      
      const receipt = await tx.wait(2);
      
      if (receipt.status === 1) {
        toast.success(
          `Successfully transferred ${data.amount} ${selectedToken.symbol} to ${data.to.slice(0, 6)}...`
        );
        form.reset({
          to: "",
          amount: "",
          tokenAddress: data.tokenAddress,
        });
        refreshBalance();
      } else {
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Transfer error:", error);
      const message = error instanceof Error ? error.message : "Transfer failed";
      
      if (message.includes("user rejected")) {
        toast.error("Transaction cancelled by user");
      } else if (message.includes("insufficient funds")) {
        toast.error("Insufficient ETH for gas");
      } else if (message.includes("transfer amount exceeds balance")) {
        toast.error("Insufficient token balance");
      } else if (message.includes("expired")) {
        toast.error("Tokens have expired and cannot be transferred");
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Connect your wallet to transfer tokens</p>
        </CardContent>
      </Card>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No tokens configured for this network</p>
          <p className="text-sm text-muted-foreground mt-1">
            Go to Settings tab to add your token contracts
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Transfer Tokens
        </CardTitle>
        <CardDescription>
          Send tokens to another wallet address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Token Selection */}
            <FormField
              control={form.control}
              name="tokenAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={token.contractAddress} value={token.contractAddress}>
                          <div className="flex items-center gap-2">
                            <span>{token.icon}</span>
                            <span>{token.symbol}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Balance Display */}
            {selectedToken && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Your Balance:</span>
                <div className="flex items-center gap-2">
                  {isLoadingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="font-mono font-medium">
                      {balance ? `${parseFloat(balance).toLocaleString()} ${selectedToken.symbol}` : "—"}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={refreshBalance}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Recipient Address */}
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleMaxAmount}
                      disabled={!balance}
                    >
                      Max
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Transfer
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
