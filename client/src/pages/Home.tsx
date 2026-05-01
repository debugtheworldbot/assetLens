import { useAssetStore } from '@/store/useAssetStore';
import { useFxStore } from '@/store/useFxStore';
import { usePriceCache } from '@/hooks/usePriceCache';
import { getTotalValue } from '@/lib/assetValue';
import { getCategorySummaries, getLiquiditySummary, getRiskExposure, getTagSummaries, getStockSummaries } from '@/lib/analytics';
import { generateAdvice } from '@/lib/advice';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { Link } from 'wouter';
import { AlertTriangle, ArrowRight, Shield, Droplets, PieChart, Tag, TrendingUp, Wallet } from 'lucide-react';
import CategoryDonut from '@/components/charts/CategoryDonut';
import LiquidityBar from '@/components/charts/LiquidityBar';
import TagDonut from '@/components/charts/TagDonut';
import StockDonut from '@/components/charts/StockDonut';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

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
  const tagSummaries = getTagSummaries(assets, settings.baseCurrency, rates, priceCache);
  const stockSummaries = getStockSummaries(assets, settings.baseCurrency, rates, priceCache);

  const riskLabels = ['', '保守', '稳健', '平衡', '积极', '激进'];

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Empty className="border-none max-w-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet />
            </EmptyMedia>
            <EmptyTitle>开始记录你的资产</EmptyTitle>
            <EmptyDescription>添加第一笔资产，开启你的财务体检之旅</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/assets">
              <Button size="lg" className="gap-2">
                添加资产 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header - Total Value: prominent section with primary accent */}
      <Card className="border-none bg-primary text-primary-foreground shadow-md">
        <CardContent className="pt-6 pb-6">
          <p className="text-sm font-medium opacity-80">总资产</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1 tabular-nums">
            {formatCurrency(total, settings.baseCurrency)}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-none">
              {assets.length} 项资产
            </Badge>
            <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-none">
              R{settings.riskLevel} {riskLabels[settings.riskLevel]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Category Donut - standard card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              资产分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={categorySummaries} total={total} baseCurrency={settings.baseCurrency} />
          </CardContent>
        </Card>

        {/* Risk Level Card - accent background for emphasis */}
        <Card className="bg-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-accent-foreground">
              <Shield className="h-4 w-4" />
              风险等级
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-4">
            <div className="text-4xl font-bold tabular-nums text-accent-foreground">
              R{settings.riskLevel}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{riskLabels[settings.riskLevel]}</p>
            <div className="mt-4 w-full space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>风险敞口</span>
                <span className="font-medium text-accent-foreground tabular-nums">{formatPercentage(riskExposure)}</span>
              </div>
              <Progress value={Math.min(riskExposure, 100)} className="h-1.5" />
            </div>
            <Link href="/settings" className="mt-4">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                调整等级 →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Stock Distribution - standard card */}
        {stockSummaries.length > 1 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                个股分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StockDonut data={stockSummaries} total={total} baseCurrency={settings.baseCurrency} />
            </CardContent>
          </Card>
        )}

        {/* Tag Distribution - standard card */}
        {tagSummaries.length > 0 && tagSummaries.some(t => t.tag !== '未分类') && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                标签分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TagDonut data={tagSummaries} total={total} baseCurrency={settings.baseCurrency} />
            </CardContent>
          </Card>
        )}

        {/* Liquidity Bar - secondary background for visual grouping */}
        <Card className="bg-secondary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-secondary-foreground">
              <Droplets className="h-4 w-4" />
              流动性分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LiquidityBar data={liquiditySummary} />
          </CardContent>
        </Card>

        {/* Advice Summary - muted background with left border accent */}
        <Card className="lg:col-span-2 border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                调仓建议
              </CardTitle>
              <Link href="/advice">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
                  查看全部 →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {adviceItems.length === 0 ? (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>你的资产配置健康</AlertTitle>
                <AlertDescription>当前配置符合你的风险偏好，无需调整</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {adviceItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div
                      className={`w-1 h-8 rounded-full flex-shrink-0 ${
                        item.severity === 'high' ? 'bg-destructive' : 'bg-primary'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
