import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

// Mock data for demo - replace with actual DB queries once tables are set up
const generateMockVolumeData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      usdt: Math.floor(Math.random() * 50000) + 10000,
      btc: Math.floor(Math.random() * 10) + 1,
      eth: Math.floor(Math.random() * 100) + 20,
    });
  }
  
  return data;
};

export function VolumeChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "volume"],
    queryFn: async () => {
      // TODO: Replace with actual Supabase query once transactions table is set up
      // const { data, error } = await supabase
      //   .from('transactions')
      //   .select('token_symbol, amount, created_at')
      //   .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      return generateMockVolumeData();
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trading Volume (30 Days)
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
          <TrendingUp className="h-5 w-5" />
          Trading Volume (30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="usdt"
                name="USDT"
                stroke="hsl(142 76% 36%)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="btc"
                name="BTC"
                stroke="hsl(38 92% 50%)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="eth"
                name="ETH"
                stroke="hsl(221 83% 53%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
