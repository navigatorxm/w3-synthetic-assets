import { useAllPrices } from "@/hooks/web3/usePriceFeeds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TOKEN_METADATA } from "@/config/contracts";
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function PriceDisplay() {
  const { data: prices, isLoading, error } = useAllPrices();

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>Unable to fetch prices</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-accent" />
          Live Token Prices
          <Badge variant="outline" className="ml-auto text-xs font-normal">
            Chainlink
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <PriceSkeleton />
              <PriceSkeleton />
              <PriceSkeleton />
            </>
          ) : (
            prices?.map((priceData) => {
              const meta = TOKEN_METADATA[priceData.symbol];
              return (
                <div
                  key={priceData.symbol}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="font-medium text-sm">{priceData.symbol}</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums">
                    {priceData.priceFormatted}
                  </span>
                  {priceData.isStale && (
                    <div className="flex items-center gap-1 text-xs text-warning">
                      <Clock className="h-3 w-3" />
                      Stale
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Prices updated via Chainlink decentralized oracles
        </p>
      </CardContent>
    </Card>
  );
}

function PriceSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
      <Skeleton className="h-5 w-12" />
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

// Compact version for header/sidebar
export function PriceTickerCompact() {
  const { data: prices, isLoading } = useAllPrices();

  if (isLoading || !prices || prices.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      {prices.map((priceData) => {
        const meta = TOKEN_METADATA[priceData.symbol];
        return (
          <div
            key={priceData.symbol}
            className={cn(
              "flex items-center gap-1.5",
              priceData.isStale && "opacity-60"
            )}
          >
            <span>{meta.icon}</span>
            <span className="font-medium tabular-nums">
              {priceData.priceFormatted}
            </span>
          </div>
        );
      })}
    </div>
  );
}
