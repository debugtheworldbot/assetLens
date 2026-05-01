import { useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { TagSummary } from '@/lib/analytics';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { Currency } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Tag } from 'lucide-react';

interface Props {
  data: TagSummary[];
  total: number;
  baseCurrency: Currency;
}

export default function TagDonut({ data, total, baseCurrency }: Props) {
  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.tag] = {
        label: item.tag,
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
            <Tag />
          </EmptyMedia>
          <EmptyTitle className="text-sm">暂无标签数据</EmptyTitle>
          <EmptyDescription>为资产添加标签后将自动生成分布图</EmptyDescription>
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
            nameKey="tag"
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

      <div className="flex-1 grid grid-cols-2 gap-2 w-full">
        {data.map((item) => (
          <div key={item.tag} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.tag}</p>
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
