import { LiquiditySummary } from '@/lib/analytics';
import { formatPercentage } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Droplets } from 'lucide-react';

interface Props {
  data: LiquiditySummary;
}

const segments = [
  { key: 'high', label: '高', pctKey: 'highPct', className: 'bg-sage-green' },
  { key: 'medium', label: '中', pctKey: 'mediumPct', className: 'bg-sand-gold' },
  { key: 'low', label: '低', pctKey: 'lowPct', className: 'bg-warm-gray' },
] as const;

export default function LiquidityBar({ data }: Props) {
  const total = data.high + data.medium + data.low;

  if (total === 0) {
    return (
      <Empty className="h-20 border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Droplets />
          </EmptyMedia>
          <EmptyTitle className="text-sm">暂无数据</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <TooltipProvider delayDuration={0}>
        <div className="h-4 rounded-full overflow-hidden flex bg-muted">
          {segments.map(({ key, label, pctKey, className }) => {
            const pct = data[pctKey];
            if (pct <= 0) return null;
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div
                    className={`h-full ${className} transition-all duration-500 cursor-default`}
                    style={{ width: `${pct}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <span className="font-medium">{label}流动性</span>
                  <span className="text-muted-foreground ml-1.5 font-mono">{formatPercentage(pct)}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        {segments.map(({ key, label, pctKey, className }) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${className}`} />
            <span className="text-muted-foreground font-mono tabular-nums">
              {label} {formatPercentage(data[pctKey])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
