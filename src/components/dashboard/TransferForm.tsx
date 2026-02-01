import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useTransactions, useAllBalances } from "@/hooks/web3";
import { transferRequestSchema, type TransferRequest } from "@/types";
import { TOKEN_METADATA, ALL_TOKEN_SYMBOLS } from "@/config/contracts";
import { useWalletStore } from "@/stores/walletStore";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TransferForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { transfer, isLoading } = useTransactions();
  const { data: balances } = useAllBalances();
  const isConnected = useWalletStore((state) => state.isConnected);

  const form = useForm<TransferRequest>({
    resolver: zodResolver(transferRequestSchema),
    defaultValues: {
      to: "",
      amount: "",
      tokenSymbol: "USDT",
    },
  });

  const selectedSymbol = form.watch("tokenSymbol");
  const selectedBalance = balances?.find((b) => b.symbol === selectedSymbol);

  const onSubmit = async (data: TransferRequest) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Check if user has enough balance
    const balance = balances?.find((b) => b.symbol === data.tokenSymbol);
    if (!balance || parseFloat(balance.balanceFormatted) < parseFloat(data.amount)) {
      toast.error("Insufficient balance");
      return;
    }

    // Check if tokens are expired
    if (balance.isExpired) {
      toast.error("Cannot transfer expired tokens");
      return;
    }

    setIsSubmitting(true);
    try {
      const txHash = await transfer({
        symbol: data.tokenSymbol,
        amount: data.amount,
        to: data.to,
      });

      if (txHash) {
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Transfer Tokens
        </CardTitle>
        <CardDescription>
          Send FlashAsset tokens to another wallet address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Token Selection */}
            <FormField
              control={form.control}
              name="tokenSymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_TOKEN_SYMBOLS.map((symbol) => {
                        const meta = TOKEN_METADATA[symbol];
                        const balance = balances?.find((b) => b.symbol === symbol);
                        return (
                          <SelectItem key={symbol} value={symbol}>
                            <div className="flex items-center gap-2">
                              <span>{meta.icon}</span>
                              <span>{meta.name}</span>
                              <span className="text-muted-foreground">
                                ({balance?.balanceFormatted || "0"})
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
                  <FormDescription>
                    Enter the Ethereum address to send tokens to
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
                      onClick={() => {
                        if (selectedBalance) {
                          form.setValue("amount", selectedBalance.balanceFormatted);
                        }
                      }}
                    >
                      Max
                    </Button>
                  </div>
                  <FormDescription>
                    Available: {selectedBalance?.balanceFormatted || "0"} {selectedSymbol}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning if tokens expired */}
            {selectedBalance?.isExpired && parseFloat(selectedBalance.balanceFormatted) > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                ⚠️ These tokens have expired and cannot be transferred.
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoading || !isConnected || selectedBalance?.isExpired}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Transfer
                </>
              )}
            </Button>

            {!isConnected && (
              <p className="text-center text-sm text-muted-foreground">
                Connect your wallet to transfer tokens
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
