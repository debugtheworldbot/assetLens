import { RefreshCw, Globe, TrendingUp } from 'lucide-react';
import { useFxStore } from '@/store/useFxStore';
import { usePriceStore } from '@/store/usePriceStore';
import { useAssetStore } from '@/store/useAssetStore';
import { formatTimeAgo } from '@/lib/format';
import { getCurrencyName } from '@/lib/currencies';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

  const statusDotColor = {
    fresh: 'bg-emerald-500',
    stale: 'bg-amber-500',
    offline: 'bg-red-500',
  };

  return (
    <div className="flex flex-1 items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">基准</span>
        <Badge variant="secondary" className="text-xs">
          {getCurrencyName(baseCurrency)}
        </Badge>
      </div>

      <div className="flex-1" />

      {/* FX Status */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <div className={cn('h-1.5 w-1.5 rounded-full', statusDotColor[fxStatus])} />
              <span className="text-xs text-muted-foreground hidden sm:inline">汇率</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            汇率{fxStatus === 'fresh' ? '正常' : fxStatus === 'stale' ? '过期' : '离线'}
            {fxFetchedAt && ` · ${formatTimeAgo(fxFetchedAt)}`}
          </TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => fxRefresh()}
          disabled={fxLoading}
        >
          <RefreshCw className={cn('h-3 w-3', fxLoading && 'animate-spin')} />
        </Button>
      </div>

      {/* Price Status */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <div className={cn('h-1.5 w-1.5 rounded-full', statusDotColor[priceStatus])} />
              <span className="text-xs text-muted-foreground hidden sm:inline">报价</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            报价{priceStatus === 'fresh' ? '正常' : priceStatus === 'stale' ? '过期' : '离线'}
            {priceFetchedAt && ` · ${formatTimeAgo(priceFetchedAt)}`}
          </TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => priceRefresh()}
          disabled={priceLoading}
        >
          <RefreshCw className={cn('h-3 w-3', priceLoading && 'animate-spin')} />
        </Button>
      </div>
    </div>
  );
}
