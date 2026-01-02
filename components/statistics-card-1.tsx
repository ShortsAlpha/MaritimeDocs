import { Badge } from '@/components/badge-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { ArrowDown, ArrowUp } from 'lucide-react';

export interface StatItem {
  title: string;
  value: number;
  delta: number;
  lastMonth: number;
  positive: boolean;
  prefix: string;
  suffix: string;
  format?: (v: number) => string;
  lastFormat?: (v: number) => string;
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return n.toLocaleString();
  return n.toLocaleString();
}

export default function StatisticCard1({ stats }: { stats: StatItem[] }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="border-0">
              <CardTitle className="text-muted-foreground text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-medium text-foreground tracking-tight">
                  {stat.format ? stat.format(stat.value) : stat.prefix + formatNumber(stat.value) + stat.suffix}
                </span>
                <Badge variant={stat.positive ? 'success' : 'destructive'} appearance="light">
                  {stat.delta > 0 ? <ArrowUp /> : <ArrowDown />}
                  {stat.delta}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2 border-t pt-2.5">
                Vs last month:{' '}
                <span className="font-medium text-foreground">
                  {stat.lastFormat
                    ? stat.lastFormat(stat.lastMonth)
                    : stat.prefix + formatNumber(stat.lastMonth) + stat.suffix}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
