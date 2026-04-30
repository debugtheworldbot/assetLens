import { useAssetStore } from '@/store/useAssetStore';
import { useFxStore } from '@/store/useFxStore';
import { usePriceCache } from '@/hooks/usePriceCache';
import { getTotalValue } from '@/lib/assetValue';
import { getCategorySummaries, getLiquiditySummary, getRiskExposure } from '@/lib/analytics';
import { generateAdvice } from '@/lib/advice';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { Link } from 'wouter';
import { AlertTriangle, ArrowRight, Shield, Droplets } from 'lucide-react';
import CategoryDonut from '@/components/charts/CategoryDonut';
import LiquidityBar from '@/components/charts/LiquidityBar';

export default function Home() {
  const assets = useAssetStore((s) => s.assets);
  const settings = useAssetStore((s) => s.settings);
  const rates = useFxStore((s) => s.rates);
  const priceCache = usePriceCache();

  const total = getTotalValue(assets, settings.baseCurrency, rates, priceCache);
  const categorySummaries = getCategorySummaries(assets, settings.baseCurrency, rates, priceCache);
  const liquiditySummary = getLiquiditySummary(assets, settings.baseCurrency, rates, priceCache);
  const adviceItems = generateAdvice(assets, settings.baseCurrency, rates, priceCache, settings.riskLevel);
  const riskExposure = getRiskExposure(assets, settings.baseCurrency, rates, priceCache);

  const riskLabels = ['', '保守', '稳健', '平衡', '积极', '激进'];

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663184921354/YbuhLiEW38SWn2PrinRRhR/empty-state-ciWY6BbYipCRVKAgqNRWmE.webp"
          alt="开始记录"
          className="w-48 h-48 object-contain mb-6 opacity-90"
        />
        <h2 className="text-xl font-bold text-foreground mb-2">开始记录你的资产</h2>
        <p className="text-muted-foreground text-sm mb-6">添加第一笔资产，开启你的财务体检之旅</p>
        <Link href="/assets">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-warm-orange text-white rounded-lg font-medium text-sm hover:bg-warm-orange/90 transition-colors shadow-md shadow-warm-orange/20">
            添加资产 <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">总资产</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mt-1 font-mono">
            {formatCurrency(total, settings.baseCurrency, true)}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{assets.length} 项资产</p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Category Donut - spans 2 cols on large */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">资产分布</h3>
          <CategoryDonut data={categorySummaries} total={total} baseCurrency={settings.baseCurrency} />
        </div>

        {/* Risk Level Card */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-sage-green" />
            <h3 className="text-sm font-semibold text-foreground">风险等级</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-warm-orange">R{settings.riskLevel}</div>
            <p className="text-sm text-muted-foreground mt-1">{riskLabels[settings.riskLevel]}</p>
            <p className="text-xs text-muted-foreground mt-3">
              风险敞口: <span className="font-semibold text-foreground">{formatPercentage(riskExposure)}</span>
            </p>
          </div>
          <Link href="/settings">
            <span className="text-xs text-warm-orange hover:underline cursor-pointer">调整等级 →</span>
          </Link>
        </div>

        {/* Liquidity Bar */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="w-4 h-4 text-sage-green" />
            <h3 className="text-sm font-semibold text-foreground">流动性分布</h3>
          </div>
          <LiquidityBar data={liquiditySummary} />
        </div>

        {/* Advice Summary */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-sand-gold" />
              <h3 className="text-sm font-semibold text-foreground">调仓建议</h3>
            </div>
            <Link href="/advice">
              <span className="text-xs text-warm-orange hover:underline cursor-pointer">查看全部 →</span>
            </Link>
          </div>
          {adviceItems.length === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-8 h-8 rounded-full bg-sage-green/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-sage-green" />
              </div>
              <p className="text-sm text-sage-green font-medium">你的资产配置健康</p>
            </div>
          ) : (
            <div className="space-y-2">
              {adviceItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-accent/50"
                >
                  <div
                    className={`w-1.5 h-8 rounded-full ${
                      item.severity === 'high' ? 'bg-warm-orange' : 'bg-sand-gold'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.message}</p>
                  </div>
                </div>
              ))}
              {adviceItems.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  还有 {adviceItems.length - 3} 条建议
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
