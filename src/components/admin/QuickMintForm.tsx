import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseUnits } from "ethers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
import { DEFAULT_EXPIRY_DAYS, MIN_EXPIRY_DAYS, MAX_EXPIRY_DAYS } from "@/config/constants";
import { ethereumAddressSchema } from "@/types";
import { Contract } from "ethers";
import { Coins, Loader2, Calendar, Wallet } from "lucide-react";
import { toast } from "sonner";
import { HelpTooltip, helpContent } from "./HelpTooltip";

const mintFormSchema = z.object({
  recipient: ethereumAddressSchema,
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  tokenAddress: z.string().min(1, "Select a token"),
  expiryDays: z.number().min(MIN_EXPIRY_DAYS).max(MAX_EXPIRY_DAYS),
});

type MintFormData = z.infer<typeof mintFormSchema>;

export function QuickMintForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokens, setTokens] = useState<CustomToken[]>([]);
  const { address, isConnected, isAdmin, chainId } = useWalletStore();
  const { signer } = useWeb3();

  const form = useForm<MintFormData>({
    resolver: zodResolver(mintFormSchema),
    defaultValues: {
      recipient: "",
      amount: "",
      tokenAddress: "",
      expiryDays: DEFAULT_EXPIRY_DAYS,
    },
  });

  // Load tokens for current chain
  useEffect(() => {
    if (chainId) {
      const chainTokens = getCustomTokens().filter(t => t.chainId === chainId);
      setTokens(chainTokens);
      
      // Auto-select first token if available
      if (chainTokens.length > 0 && !form.getValues("tokenAddress")) {
        form.setValue("tokenAddress", chainTokens[0].contractAddress);
      }
    }
  }, [chainId, form]);

  const expiryDays = form.watch("expiryDays");
  const selectedTokenAddress = form.watch("tokenAddress");
  const selectedToken = tokens.find(t => t.contractAddress === selectedTokenAddress);

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  const handleMintToSelf = () => {
    if (address) {
      form.setValue("recipient", address);
    }
  };

  const onSubmit = async (data: MintFormData) => {
    if (!signer || !selectedToken) {
      toast.error("Wallet or token not available");
      return;
    }

    setIsSubmitting(true);

    try {
      const contract = new Contract(data.tokenAddress, FLASH_TOKEN_ABI, signer);
      
      // Calculate amount with decimals
      const amountWei = parseUnits(data.amount, selectedToken.decimals);
      
      // Calculate expiry timestamp
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (data.expiryDays * 24 * 60 * 60);

      toast.info("Please confirm the transaction in your wallet...");

      const tx = await contract.mint(data.recipient, amountWei, expiryTimestamp);
      
      toast.info(`Transaction submitted: ${tx.hash.slice(0, 10)}...`);
      
      const receipt = await tx.wait(2);
      
      if (receipt.status === 1) {
        toast.success(
          `Successfully minted ${data.amount} ${selectedToken.symbol} to ${data.recipient.slice(0, 6)}...`
        );
        form.reset({
          recipient: "",
          amount: "",
          tokenAddress: data.tokenAddress,
          expiryDays: DEFAULT_EXPIRY_DAYS,
        });
      } else {
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Mint error:", error);
      const message = error instanceof Error ? error.message : "Mint failed";
      
      if (message.includes("user rejected")) {
        toast.error("Transaction cancelled by user");
      } else if (message.includes("insufficient funds")) {
        toast.error("Insufficient ETH for gas");
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
          <p className="text-muted-foreground">Connect your wallet to mint tokens</p>
        </CardContent>
      </Card>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
          <Coins className="h-5 w-5" />
          Mint Tokens
        </CardTitle>
        <CardDescription>
          Create new tokens with an expiry date. Tokens become non-transferable after expiry.
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
                      {tokens.map((token, index) => (
                        <SelectItem key={`${token.symbol}-${token.chainId}-${index}`} value={token.contractAddress}>
                          <div className="flex items-center gap-2">
                            {token.icon.startsWith("data:") || token.icon.startsWith("http") ? (
                              <img src={token.icon} alt={token.symbol} className="h-5 w-5 rounded object-cover" />
                            ) : (
                              <span>{token.icon}</span>
                            )}
                            <span>{token.name}</span>
                            <span className="text-muted-foreground">
                              ({token.decimals} decimals)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recipient Address */}
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Recipient Address
                    <HelpTooltip content={helpContent.mintRecipient} />
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="0x..."
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleMintToSelf}
                    >
                      Self
                    </Button>
                  </div>
                  <FormDescription>
                    Wallet address that will receive the tokens
                  </FormDescription>
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
                  <FormLabel className="flex items-center gap-1">
                    Amount
                    <HelpTooltip content={helpContent.mintAmount} />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="1000"
                      {...field}
                    />
                  </FormControl>
                  {selectedToken && (
                    <FormDescription>
                      Amount in {selectedToken.symbol}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry Days Slider */}
            <FormField
              control={form.control}
              name="expiryDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Token Expiry
                    <HelpTooltip content={helpContent.expiryDays} />
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Slider
                        min={MIN_EXPIRY_DAYS}
                        max={MAX_EXPIRY_DAYS}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="py-4"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{expiryDays} days</span>
                        <span className="text-muted-foreground">
                          Expires: {expiryDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Tokens become non-transferable after this period
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isAdmin}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Mint Tokens
                </>
              )}
            </Button>

            {!isAdmin && (
              <p className="text-center text-sm text-destructive">
                Your wallet is not in the admin whitelist. Add it in Settings.
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
