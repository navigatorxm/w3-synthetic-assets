import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

const COLORS = [
  "hsl(142 76% 36%)", // green
  "hsl(38 92% 50%)",  // orange
  "hsl(221 83% 53%)", // blue
];

// Mock data for demo
const generateMockHolderStats = () => {
  return {
    distribution: [
      { name: "USDT Holders", value: 1247, symbol: "USDT" },
      { name: "BTC Holders", value: 856, symbol: "BTC" },
      { name: "ETH Holders", value: 1523, symbol: "ETH" },
    ],
    totalHolders: 3626,
    activeHolders: 2891,
    expiredHolders: 735,
  };
};

export function HolderStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "holders"],
    queryFn: async () => {
      // TODO: Replace with actual Supabase query
      return generateMockHolderStats();
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Holder Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Holder Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.distribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Total Holders</p>
              <p className="text-3xl font-bold">
                {data?.totalHolders.toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-green-600">
                  {data?.activeHolders.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-xl font-bold text-destructive">
                  {data?.expiredHolders.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
