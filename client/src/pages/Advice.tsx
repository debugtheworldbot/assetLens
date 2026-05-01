import { useAssetStore } from '@/store/useAssetStore';
import { useFxStore } from '@/store/useFxStore';
import { usePriceCache } from '@/hooks/usePriceCache';
import { generateAdvice, THRESHOLDS } from '@/lib/advice';
import { Shield, AlertTriangle, Info, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function Advice() {
  const assets = useAssetStore((s) => s.assets);
  const settings = useAssetStore((s) => s.settings);
  const setRiskLevel = useAssetStore((s) => s.setRiskLevel);
  const rates = useFxStore((s) => s.rates);
  const priceCache = usePriceCache();

  const adviceItems = generateAdvice(assets, settings.baseCurrency, rates, priceCache, settings.riskLevel);
  const riskLabels = ['', '保守', '稳健', '平衡', '积极', '激进'];

  return (
    <motion.div
      className="max-w-3xl mx-auto space-y-5 pb-20 md:pb-6"
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
        <h1 className="text-xl font-semibold text-foreground">调仓建议</h1>
        <p className="text-sm text-muted-foreground mt-1">基于你的资产配置和风险等级，提供优化建议</p>
      </motion.div>

      {/* Risk Level Slider */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-sage-green" />
                风险等级
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                R{settings.riskLevel} · {riskLabels[settings.riskLevel]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider
              value={[settings.riskLevel]}
              onValueChange={([val]) => setRiskLevel(val as 1 | 2 | 3 | 4 | 5)}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map((level) => (
                <span
                  key={level}
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    settings.riskLevel === level ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  R{level}
                </span>
              ))}
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle className="text-xs">风险资产上限: {THRESHOLDS.RISK_CAPS[settings.riskLevel]}%</AlertTitle>
              <AlertDescription className="text-xs">
                调整风险等级会影响调仓建议的触发条件
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advice Cards */}
      {adviceItems.length === 0 ? (
        <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="py-12">
              <Empty className="border-none">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-sage-green/10 text-sage-green">
                    <Shield />
                  </EmptyMedia>
                  <EmptyTitle className="text-sage-green">你的资产配置健康</EmptyTitle>
                  <EmptyDescription>当前没有触发任何调仓建议，继续保持！</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {adviceItems.map((item, index) => (
            <motion.div
              key={item.id}
              variants={fadeInUp}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    <div
                      className={cn(
                        'w-1 flex-shrink-0',
                        item.severity === 'high' ? 'bg-primary' : 'bg-sand-gold'
                      )}
                    />
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <AlertTriangle
                          className={cn(
                            'w-4 h-4',
                            item.severity === 'high' ? 'text-primary' : 'text-sand-gold'
                          )}
                        />
                        <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                        <Badge
                          variant={item.severity === 'high' ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {item.severity === 'high' ? '高风险' : '中风险'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">{item.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {assets.length === 0 && (
        <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="py-8">
              <Empty className="border-none">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Wallet />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm">请先添加资产</EmptyTitle>
                  <EmptyDescription>添加资产后才能生成调仓建议</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
