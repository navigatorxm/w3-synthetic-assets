import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import type { TokenSymbol } from "@/types";
import { TOKEN_METADATA } from "@/config/contracts";
import { cn } from "@/lib/utils";

interface ExpiryTimerProps {
  symbol: TokenSymbol;
  expiryTimestamp: number;
  balance: string;
}

export function ExpiryTimer({ symbol, expiryTimestamp, balance }: ExpiryTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    percentage: number;
    isExpired: boolean;
  } | null>(null);

  const meta = TOKEN_METADATA[symbol];
  const hasBalance = parseFloat(balance) > 0;

  useEffect(() => {
    if (expiryTimestamp === 0 || !hasBalance) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = expiryTimestamp - now;

      if (diff <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          percentage: 0,
          isExpired: true,
        };
      }

      // Assume tokens were minted with ~30 day expiry for percentage calc
      const totalDuration = 30 * 24 * 60 * 60;
      const percentage = Math.max(0, Math.min(100, (diff / totalDuration) * 100));

      return {
        days: Math.floor(diff / 86400),
        hours: Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
        percentage,
        isExpired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTimestamp, hasBalance]);

  if (!timeLeft || !hasBalance) {
    return null;
  }

  return (
    <Card className={cn(timeLeft.isExpired && "border-destructive")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-xl">{meta.icon}</span>
            {meta.name} Expiry
          </CardTitle>
          {timeLeft.isExpired ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Expired
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!timeLeft.isExpired && (
          <>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold">{timeLeft.days}</p>
                <p className="text-xs text-muted-foreground">Days</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold">{timeLeft.hours}</p>
                <p className="text-xs text-muted-foreground">Hours</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold">{timeLeft.minutes}</p>
                <p className="text-xs text-muted-foreground">Mins</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold">{timeLeft.seconds}</p>
                <p className="text-xs text-muted-foreground">Secs</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time Remaining</span>
                <span>{Math.round(timeLeft.percentage)}%</span>
              </div>
              <Progress value={timeLeft.percentage} className="h-2" />
            </div>
          </>
        )}

        {timeLeft.isExpired && (
          <div className="text-center py-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <p className="text-lg font-semibold text-destructive">Token Expired</p>
            <p className="text-sm text-muted-foreground">
              This token can no longer be transferred and may be burned.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
