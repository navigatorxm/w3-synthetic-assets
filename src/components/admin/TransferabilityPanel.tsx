import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_TOKEN_SYMBOLS, TOKEN_METADATA } from "@/config/contracts";
import { ethereumAddressSchema, tokenSymbolSchema, type TokenSymbol } from "@/types";
import { Lock, Unlock, Shield, Snowflake } from "lucide-react";
import { toast } from "sonner";

const freezeFormSchema = z.object({
  address: ethereumAddressSchema,
  tokenSymbol: tokenSymbolSchema,
});

type FreezeFormValues = z.infer<typeof freezeFormSchema>;

interface FrozenAccount {
  address: string;
  tokenSymbol: TokenSymbol;
  frozenAt: Date;
}

export function TransferabilityPanel() {
  const [globalTransfersEnabled, setGlobalTransfersEnabled] = useState(true);
  const [frozenAccounts, setFrozenAccounts] = useState<FrozenAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FreezeFormValues>({
    resolver: zodResolver(freezeFormSchema),
    defaultValues: {
      address: "",
      tokenSymbol: "FLA",
    },
  });

  const handleGlobalToggle = (enabled: boolean) => {
    setGlobalTransfersEnabled(enabled);
    toast.success(
      enabled ? "Transfers enabled globally" : "Transfers disabled globally"
    );
  };

  const handleFreeze = async (data: FreezeFormValues) => {
    setIsSubmitting(true);
    try {
      // Check if already frozen
      const isAlreadyFrozen = frozenAccounts.some(
        (acc) => acc.address.toLowerCase() === data.address.toLowerCase() &&
                 acc.tokenSymbol === data.tokenSymbol
      );

      if (isAlreadyFrozen) {
        toast.error("Account already frozen for this token");
        return;
      }

      // Simulate contract call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setFrozenAccounts((prev) => [
        ...prev,
        {
          address: data.address,
          tokenSymbol: data.tokenSymbol,
          frozenAt: new Date(),
        },
      ]);

      toast.success("Account frozen", {
        description: `${data.address.slice(0, 8)}...${data.address.slice(-6)} frozen for ${data.tokenSymbol}`,
      });

      form.reset();
    } catch (error) {
      toast.error("Failed to freeze account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnfreeze = async (address: string, tokenSymbol: TokenSymbol) => {
    try {
      // Simulate contract call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setFrozenAccounts((prev) =>
        prev.filter(
          (acc) =>
            !(acc.address.toLowerCase() === address.toLowerCase() &&
              acc.tokenSymbol === tokenSymbol)
        )
      );

      toast.success("Account unfrozen", {
        description: `${address.slice(0, 8)}...${address.slice(-6)} unfrozen for ${tokenSymbol}`,
      });
    } catch (error) {
      toast.error("Failed to unfreeze account");
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Transfer Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Global Transfer Controls
          </CardTitle>
          <CardDescription>
            Emergency controls to enable/disable all token transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-3">
              {globalTransfersEnabled ? (
                <Unlock className="h-6 w-6 text-accent" />
              ) : (
                <Lock className="h-6 w-6 text-destructive" />
              )}
              <div>
                <p className="font-medium">Global Transfers</p>
                <p className="text-sm text-muted-foreground">
                  {globalTransfersEnabled
                    ? "All transfers are currently enabled"
                    : "All transfers are currently disabled"}
                </p>
              </div>
            </div>
            <Switch
              checked={globalTransfersEnabled}
              onCheckedChange={handleGlobalToggle}
            />
          </div>

          {!globalTransfersEnabled && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              ⚠️ Emergency mode active. No transfers can be executed until re-enabled.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Freeze Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5" />
            Account Freeze Management
          </CardTitle>
          <CardDescription>
            Freeze specific accounts to prevent transfers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFreeze)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Address</FormLabel>
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
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                <Snowflake className="mr-2 h-4 w-4" />
                Freeze Account
              </Button>
            </form>
          </Form>

          {/* Frozen Accounts List */}
          {frozenAccounts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Frozen Accounts ({frozenAccounts.length})</h4>
              <div className="space-y-2">
                {frozenAccounts.map((account, index) => (
                  <div
                    key={`${account.address}-${account.tokenSymbol}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <Snowflake className="h-4 w-4 text-info" />
                      <div>
                        <code className="text-sm font-mono">
                          {account.address.slice(0, 10)}...{account.address.slice(-8)}
                        </code>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {TOKEN_METADATA[account.tokenSymbol].icon} {account.tokenSymbol}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Frozen {account.frozenAt.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnfreeze(account.address, account.tokenSymbol)}
                    >
                      <Unlock className="mr-1 h-3 w-3" />
                      Unfreeze
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {frozenAccounts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Snowflake className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No frozen accounts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}