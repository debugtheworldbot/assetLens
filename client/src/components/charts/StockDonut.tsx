import { useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { StockSummary } from '@/lib/analytics';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { Currency } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { TrendingUp } from 'lucide-react';

interface Props {
  data: StockSummary[];
  total: number;
  baseCurrency: Currency;
}

export default function StockDonut({ data, total, baseCurrency }: Props) {
  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.color,
      };
    });
    return config;
  }, [data]);

  if (data.length === 0) {
    return (
      <Empty className="h-48 border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrendingUp />
          </EmptyMedia>
          <EmptyTitle className="text-sm">暂无股票数据</EmptyTitle>
          <EmptyDescription>添加股票资产后将自动生成分布图</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <ChartContainer config={chartConfig} className="w-48 h-48 flex-shrink-0 aspect-square">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel={false}
                formatter={(value, name) => (
                  <span className="text-foreground font-mono font-medium tabular-nums">
                    {formatCurrency(value as number, baseCurrency, true)}
                  </span>
                )}
              />
            }
          />
        </PieChart>
      </ChartContainer>

      <div className="flex-1 grid grid-cols-2 gap-2 w-full max-h-48 overflow-y-auto">
        {data.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {item.name}
                {item.symbol && <span className="text-muted-foreground ml-1 font-mono">({item.symbol})</span>}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                {formatPercentage(item.percentage)} · {formatCurrency(item.value, baseCurrency, true)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
