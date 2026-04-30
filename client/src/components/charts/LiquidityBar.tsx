import { LiquiditySummary } from '@/lib/analytics';
import { formatPercentage } from '@/lib/format';

interface Props {
  data: LiquiditySummary;
}

export default function LiquidityBar({ data }: Props) {
  const total = data.high + data.medium + data.low;
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
        暂无数据
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-4 rounded-full overflow-hidden flex bg-muted">
        {data.highPct > 0 && (
          <div
            className="h-full bg-sage-green transition-all duration-500"
            style={{ width: `${data.highPct}%` }}
          />
        )}
        {data.mediumPct > 0 && (
          <div
            className="h-full bg-sand-gold transition-all duration-500"
            style={{ width: `${data.mediumPct}%` }}
          />
        )}
        {data.lowPct > 0 && (
          <div
            className="h-full bg-warm-gray transition-all duration-500"
            style={{ width: `${data.lowPct}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-sage-green" />
          <span className="text-muted-foreground">高 {formatPercentage(data.highPct)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-sand-gold" />
          <span className="text-muted-foreground">中 {formatPercentage(data.mediumPct)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-warm-gray" />
          <span className="text-muted-foreground">低 {formatPercentage(data.lowPct)}</span>
        </div>
      </div>
    </div>
  );
}
