import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useTransactions } from "@/hooks/web3";
import { ethereumAddressSchema, tokenSymbolSchema } from "@/types";
import { TOKEN_METADATA, ALL_TOKEN_SYMBOLS } from "@/config/contracts";
import { useWalletStore } from "@/stores/walletStore";
import { Flame, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const burnRequestSchema = z.object({
  targetAddress: ethereumAddressSchema,
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  tokenSymbol: tokenSymbolSchema,
});

type BurnRequest = z.infer<typeof burnRequestSchema>;

export function BurnPanel() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { burn, isLoading } = useTransactions();
  const isAdmin = useWalletStore((state) => state.isAdmin);

  const form = useForm<BurnRequest>({
    resolver: zodResolver(burnRequestSchema),
    defaultValues: {
      targetAddress: "",
      amount: "",
      tokenSymbol: "USDT",
    },
  });

  const onSubmit = async (data: BurnRequest) => {
    if (!isAdmin) {
      toast.error("Admin access required");
      return;
    }

    setIsSubmitting(true);
    try {
      const txHash = await burn({
        symbol: data.tokenSymbol,
        amount: data.amount,
        to: data.targetAddress,
      });

      if (txHash) {
        toast.success("Burn transaction submitted!");
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Flame className="h-5 w-5" />
          Burn Tokens
        </CardTitle>
        <CardDescription>
          Permanently destroy tokens from a wallet address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Warning: Burning tokens is irreversible. Use this to remove expired
            tokens or reclaim tokens from inactive accounts.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            {/* Target Address */}
            <FormField
              control={form.control}
              name="targetAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Wallet address to burn tokens from
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
                  <FormLabel>Amount to Burn</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={isSubmitting || isLoading || !isAdmin}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Burning...
                </>
              ) : (
                <>
                  <Flame className="mr-2 h-4 w-4" />
                  Burn Tokens
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
