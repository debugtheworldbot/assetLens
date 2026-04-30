import { CategorySummary } from '@/lib/analytics';
import { formatPercentage } from '@/lib/format';

interface Props {
  data: CategorySummary[];
}

export default function CategoryBar({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Stacked horizontal bar */}
      <div className="h-5 rounded-full overflow-hidden flex bg-muted">
        {data.map((item) => (
          <div
            key={item.category}
            className="h-full transition-all duration-500"
            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
            title={`${item.label}: ${formatPercentage(item.percentage)}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map((item) => (
          <div key={item.category} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground">
              {item.label} {formatPercentage(item.percentage)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
