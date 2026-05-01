import { useAssetStore } from '@/store/useAssetStore';
import { useFxStore } from '@/store/useFxStore';
import { usePriceCache } from '@/hooks/usePriceCache';
import { generateAdvice, THRESHOLDS } from '@/lib/advice';
import { Shield, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Info className="w-3 h-3" />
              <span>风险资产上限: {THRESHOLDS.RISK_CAPS[settings.riskLevel]}%</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advice Cards */}
      {adviceItems.length === 0 ? (
        <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-sage-green/10 flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-sage-green" />
              </div>
              <h3 className="text-base font-medium text-sage-green mb-1">你的资产配置健康</h3>
              <p className="text-sm text-muted-foreground text-center">
                当前没有触发任何调仓建议，继续保持！
              </p>
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
            <CardContent className="text-center py-8">
              <p className="text-sm text-muted-foreground">请先添加资产，才能生成调仓建议</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
