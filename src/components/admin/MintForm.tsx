import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useTransactions } from "@/hooks/web3";
import { mintRequestSchema, type MintRequest } from "@/types";
import { TOKEN_METADATA, ALL_TOKEN_SYMBOLS } from "@/config/contracts";
import { DEFAULT_EXPIRY_DAYS, MIN_EXPIRY_DAYS, MAX_EXPIRY_DAYS } from "@/config/constants";
import { useWalletStore } from "@/stores/walletStore";
import { Coins, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

export function MintForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mint, isLoading } = useTransactions();
  const isAdmin = useWalletStore((state) => state.isAdmin);
  const isConnected = useWalletStore((state) => state.isConnected);

  const form = useForm<MintRequest>({
    resolver: zodResolver(mintRequestSchema),
    defaultValues: {
      recipient: "",
      amount: "",
      tokenSymbol: "USDT",
      expiryDays: DEFAULT_EXPIRY_DAYS,
    },
  });

  const expiryDays = form.watch("expiryDays");

  const onSubmit = async (data: MintRequest) => {
    if (!isConnected || !isAdmin) {
      toast.error("Admin access required");
      return;
    }

    setIsSubmitting(true);
    try {
      const txHash = await mint({
        symbol: data.tokenSymbol,
        amount: data.amount,
        to: data.recipient,
        expiryDays: data.expiryDays,
      });

      if (txHash) {
        toast.success("Mint transaction submitted!");
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Mint Tokens
        </CardTitle>
        <CardDescription>
          Create new FlashAsset tokens with expiry dates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Token Selection */}
            <FormField
              control={form.control}
              name="tokenSymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_TOKEN_SYMBOLS.map((symbol) => {
                        const meta = TOKEN_METADATA[symbol];
                        return (
                          <SelectItem key={symbol} value={symbol}>
                            <div className="flex items-center gap-2">
                              <span>{meta.icon}</span>
                              <span>{meta.name}</span>
                              <span className="text-muted-foreground">
                                ({meta.decimals} decimals)
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
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
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Wallet address that will receive the minted tokens
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="1000"
                      {...field}
                    />
                  </FormControl>
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
                    Tokens will become non-transferable after this period
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoading || !isAdmin}
            >
              {isSubmitting || isLoading ? (
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
                Admin privileges required to mint tokens
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
