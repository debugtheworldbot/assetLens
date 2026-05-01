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
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

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
      <motion.div
        className="flex flex-col items-center justify-center h-full py-20"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Empty className="border-none max-w-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
              <Wallet />
            </EmptyMedia>
            <EmptyTitle>开始记录你的资产</EmptyTitle>
            <EmptyDescription>添加第一笔资产，开启你的财务体检之旅</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/assets">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                添加资产 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header - Total Value */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground font-medium">总资产</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mt-1 font-mono tabular-nums">
              <CountUp
                end={total}
                duration={1.2}
                separator=","
                decimals={0}
                prefix={settings.baseCurrency === 'CNY' ? '¥' : settings.baseCurrency === 'USD' ? '$' : settings.baseCurrency === 'HKD' ? 'HK$' : ''}
              />
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className="text-xs font-normal">
                {assets.length} 项资产
              </Badge>
              <Badge variant="secondary" className="text-xs font-normal">
                R{settings.riskLevel} {riskLabels[settings.riskLevel]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Category Donut */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                资产分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryDonut data={categorySummaries} total={total} baseCurrency={settings.baseCurrency} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Level Card */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-sage-green" />
                风险等级
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1 pt-4">
              <div className="text-4xl font-bold text-primary font-mono">
                <CountUp end={settings.riskLevel} duration={0.8} prefix="R" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{riskLabels[settings.riskLevel]}</p>
              <div className="mt-4 w-full px-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>风险敞口</span>
                  <span className="font-medium text-foreground font-mono tabular-nums">{formatPercentage(riskExposure)}</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sage-green via-sand-gold to-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(riskExposure, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
              <Link href="/settings" className="mt-4">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                  调整等级 →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stock Distribution */}
        {stockSummaries.length > 1 && (
          <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  个股分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StockDonut data={stockSummaries} total={total} baseCurrency={settings.baseCurrency} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tag Distribution */}
        {tagSummaries.length > 0 && tagSummaries.some(t => t.tag !== '未分类') && (
          <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4 text-sage-green" />
                  标签分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TagDonut data={tagSummaries} total={total} baseCurrency={settings.baseCurrency} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Liquidity Bar */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sage-green" />
                流动性分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LiquidityBar data={liquiditySummary} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Advice Summary */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-sand-gold" />
                  调仓建议
                </CardTitle>
                <Link href="/advice">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary h-7">
                    查看全部 →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {adviceItems.length === 0 ? (
                <Alert>
                  <Shield className="h-4 w-4 text-sage-green" />
                  <AlertTitle className="text-sage-green">你的资产配置健康</AlertTitle>
                  <AlertDescription>当前配置符合你的风险偏好，无需调整</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {adviceItems.slice(0, 3).map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.08, duration: 0.3 }}
                    >
                      <div
                        className={`w-1 h-8 rounded-full flex-shrink-0 ${
                          item.severity === 'high' ? 'bg-primary' : 'bg-sand-gold'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.message}</p>
                      </div>
                    </motion.div>
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
        </motion.div>
      </div>
    </motion.div>
  );
}
