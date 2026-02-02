import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { History, ExternalLink } from "lucide-react";
import { shortenAddress } from "@/lib/validation";
import { TOKEN_METADATA, ALL_TOKEN_SYMBOLS } from "@/config/contracts";
import { useWalletStore } from "@/stores/walletStore";
import { getExplorerTxUrl } from "@/config/chains";
import type { TransactionType, TokenSymbol } from "@/types";

interface MockTransaction {
  id: string;
  txHash: string;
  type: TransactionType;
  tokenSymbol: TokenSymbol;
  amount: string;
  from: string;
  to: string;
  timestamp: Date;
}

// Mock data for demo
const generateMockTransactions = (): MockTransaction[] => {
  const types: TransactionType[] = ["mint", "transfer", "burn"];
  const symbols = ALL_TOKEN_SYMBOLS;
  const transactions: MockTransaction[] = [];
  
  for (let i = 0; i < 20; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    transactions.push({
      id: `tx-${i}`,
      txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      type,
      tokenSymbol: symbol,
      amount: (Math.random() * 10000).toFixed(2),
      from: `0x${Math.random().toString(16).slice(2, 42)}`,
      to: `0x${Math.random().toString(16).slice(2, 42)}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }
  
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const getTypeBadgeVariant = (type: TransactionType) => {
  switch (type) {
    case "mint":
      return "default";
    case "transfer":
      return "secondary";
    case "burn":
      return "destructive";
    default:
      return "outline";
  }
};

export function TransactionHistory() {
  const chainId = useWalletStore((state) => state.chainId);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "transactions"],
    queryFn: async () => {
      // TODO: Replace with actual Supabase query
      return generateMockTransactions();
    },
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((tx) => {
                const meta = TOKEN_METADATA[tx.tokenSymbol];
                const explorerUrl = chainId
                  ? getExplorerTxUrl(chainId, tx.txHash)
                  : "";

                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(tx.type)}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {meta.icon} {tx.tokenSymbol}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">
                      {parseFloat(tx.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {shortenAddress(tx.from)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {shortenAddress(tx.to)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {tx.timestamp.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {explorerUrl && (
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {(!data || data.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            No transactions found
          </p>
        )}
      </CardContent>
    </Card>
  );
}