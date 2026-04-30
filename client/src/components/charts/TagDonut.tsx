import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TagSummary } from '@/lib/analytics';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { Currency } from '@/lib/types';

interface Props {
  data: TagSummary[];
  total: number;
  baseCurrency: Currency;
}

export default function TagDonut({ data, total, baseCurrency }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        暂无标签数据
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="w-48 h-48 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
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
            <Tooltip
              formatter={(value: number) => formatCurrency(value, baseCurrency, true)}
              labelFormatter={(label: string) => label}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2 w-full">
        {data.map((item) => (
          <div key={item.tag} className="flex items-center gap-2 px-2 py-1.5">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.tag}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatPercentage(item.percentage)} · {formatCurrency(item.value, baseCurrency, true)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
