import { CategorySummary } from '@/lib/analytics';
import { formatPercentage } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  data: CategorySummary[];
}

export default function CategoryBar({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {/* Stacked horizontal bar */}
      <TooltipProvider delayDuration={0}>
        <div className="h-5 rounded-full overflow-hidden flex bg-muted">
          {data.map((item) => (
            <Tooltip key={item.category}>
              <TooltipTrigger asChild>
                <div
                  className="h-full transition-all duration-500 cursor-default"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground ml-1.5 font-mono">{formatPercentage(item.percentage)}</span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map((item) => (
          <div key={item.category} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {item.label} {formatPercentage(item.percentage)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
