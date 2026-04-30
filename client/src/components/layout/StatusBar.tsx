import { RefreshCw, Globe, TrendingUp } from 'lucide-react';
import { useFxStore } from '@/store/useFxStore';
import { usePriceStore } from '@/store/usePriceStore';
import { useAssetStore } from '@/store/useAssetStore';
import { formatTimeAgo } from '@/lib/format';
import { getCurrencyName } from '@/lib/currencies';
import { cn } from '@/lib/utils';

export default function StatusBar() {
  const fxStatus = useFxStore((s) => s.status);
  const fxFetchedAt = useFxStore((s) => s.fetchedAt);
  const fxLoading = useFxStore((s) => s.loading);
  const fxRefresh = useFxStore((s) => s.refresh);
  const priceStatus = usePriceStore((s) => s.status);
  const priceFetchedAt = usePriceStore((s) => s.fetchedAt);
  const priceLoading = usePriceStore((s) => s.loading);
  const priceRefresh = usePriceStore((s) => s.refresh);
  const baseCurrency = useAssetStore((s) => s.settings.baseCurrency);

  const statusColors = {
    fresh: 'bg-sage-green/20 text-sage-green',
    stale: 'bg-sand-gold/20 text-sand-gold',
    offline: 'bg-warm-orange/20 text-warm-orange',
  };

  const statusLabels = {
    fresh: '正常',
    stale: '过期',
    offline: '离线',
  };

  return (
    <div className="flex items-center gap-3 px-4 md:px-6 lg:px-8 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm">
      {/* Base currency */}
      <span className="text-xs font-medium text-muted-foreground">
        基准: <span className="text-foreground font-semibold">{getCurrencyName(baseCurrency)}</span>
      </span>

      <div className="flex-1" />

      {/* FX Status */}
      <div className="flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', statusColors[fxStatus])}>
          汇率{statusLabels[fxStatus]}
        </span>
        {fxFetchedAt && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {formatTimeAgo(fxFetchedAt)}
          </span>
        )}
        <button
          onClick={() => fxRefresh()}
          disabled={fxLoading}
          className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3 h-3 text-muted-foreground', fxLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Price Status */}
      <div className="flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', statusColors[priceStatus])}>
          价格{statusLabels[priceStatus]}
        </span>
        {priceFetchedAt && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {formatTimeAgo(priceFetchedAt)}
          </span>
        )}
        <button
          onClick={() => priceRefresh()}
          disabled={priceLoading}
          className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3 h-3 text-muted-foreground', priceLoading && 'animate-spin')} />
        </button>
      </div>
    </div>
  );
}
