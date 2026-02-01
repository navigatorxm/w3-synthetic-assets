import { useAllBalances } from "@/hooks/web3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TOKEN_METADATA } from "@/config/contracts";
import { formatTimeUntilExpiry } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";

export function BalanceCard() {
  const { data: balances, isLoading, error } = useAllBalances();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Failed to load balances. Please check your connection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Balances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {balances?.map((balance) => {
          const meta = TOKEN_METADATA[balance.symbol];
          const hasBalance = parseFloat(balance.balanceFormatted) > 0;

          return (
            <div
              key={balance.symbol}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border",
                balance.isExpired && hasBalance && "border-destructive bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{meta.icon}</span>
                <div>
                  <p className="font-semibold">{meta.name}</p>
                  <p className="text-sm text-muted-foreground">{balance.symbol}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold">
                  {balance.balanceFormatted} {balance.symbol}
                </p>
                {hasBalance && balance.expiryTimestamp > 0 && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm",
                      balance.isExpired ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {balance.isExpired ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {balance.isExpired
                      ? "Expired"
                      : formatTimeUntilExpiry(balance.expiryTimestamp)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {(!balances || balances.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            No tokens found. Connect your wallet to view balances.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
