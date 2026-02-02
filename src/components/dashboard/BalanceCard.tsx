import { useAllBalances } from "@/hooks/web3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TOKEN_METADATA } from "@/config/contracts";
import { cn } from "@/lib/utils";

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

          return (
            <div
              key={balance.symbol}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border"
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