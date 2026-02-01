import { MainLayout } from "@/components/layout/MainLayout";
import { VolumeChart } from "@/components/analytics/VolumeChart";
import { HolderStats } from "@/components/analytics/HolderStats";
import { TransactionHistory } from "@/components/analytics/TransactionHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, ArrowUpDown, Clock } from "lucide-react";

// Mock summary stats
const useSummaryStats = () => {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => ({
      volume24h: "$1,234,567",
      transactions24h: 2847,
      activeHolders: 2891,
      avgExpiryDays: 18,
    }),
    refetchInterval: 60000,
  });
};

const Analytics = () => {
  const { data: stats } = useSummaryStats();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Platform statistics and transaction insights
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                24h Volume
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.volume24h || "-"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                24h Transactions
              </CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats?.transactions24h?.toLocaleString() || "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Holders
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats?.activeHolders?.toLocaleString() || "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Expiry
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.avgExpiryDays || "-"} days</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <VolumeChart />
          <HolderStats />
        </div>

        {/* Transaction History */}
        <TransactionHistory />
      </div>
    </MainLayout>
  );
};

export default Analytics;
