import { useAssetStore } from '@/store/useAssetStore';
import { useFxStore } from '@/store/useFxStore';
import { usePriceCache } from '@/hooks/usePriceCache';
import { generateAdvice, THRESHOLDS } from '@/lib/advice';
import { Shield, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Advice() {
  const assets = useAssetStore((s) => s.assets);
  const settings = useAssetStore((s) => s.settings);
  const setRiskLevel = useAssetStore((s) => s.setRiskLevel);
  const rates = useFxStore((s) => s.rates);
  const priceCache = usePriceCache();

  const adviceItems = generateAdvice(assets, settings.baseCurrency, rates, priceCache, settings.riskLevel);
  const riskLabels = ['', '保守', '稳健', '平衡', '积极', '激进'];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">调仓建议</h1>
        <p className="text-sm text-muted-foreground mt-1">基于你的资产配置和风险等级，提供优化建议</p>
      </div>

      {/* Risk Level Slider */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-sage-green" />
          <h3 className="text-sm font-semibold text-foreground">风险等级</h3>
          <span className="ml-auto text-sm font-bold text-warm-orange">
            R{settings.riskLevel} · {riskLabels[settings.riskLevel]}
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="5"
          value={settings.riskLevel}
          onChange={(e) => setRiskLevel(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #5b9b7d, #d4a559, #e57c5a)`,
          }}
        />
        <div className="flex justify-between mt-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <span
              key={level}
              className={cn(
                'text-[10px] font-medium',
                settings.riskLevel === level ? 'text-warm-orange' : 'text-muted-foreground'
              )}
            >
              R{level}
            </span>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Info className="w-3 h-3" />
          风险资产上限: {THRESHOLDS.RISK_CAPS[settings.riskLevel]}%
        </p>
      </div>

      {/* Advice Cards */}
      {adviceItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663184921354/YbuhLiEW38SWn2PrinRRhR/advice-healthy-5DjxdJZj62qAihvuBaXcgf.webp"
            alt="资产健康"
            className="w-40 h-40 object-contain mb-4 opacity-90"
          />
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-sage-green" />
            <h3 className="text-base font-semibold text-sage-green">你的资产配置健康</h3>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            当前没有触发任何调仓建议，继续保持！
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {adviceItems.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-xl border border-border p-4 shadow-sm overflow-hidden relative"
            >
              {/* Severity indicator */}
              <div
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-1',
                  item.severity === 'high' ? 'bg-warm-orange' : 'bg-sand-gold'
                )}
              />

              <div className="pl-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle
                    className={cn(
                      'w-4 h-4',
                      item.severity === 'high' ? 'text-warm-orange' : 'text-sand-gold'
                    )}
                  />
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                      item.severity === 'high'
                        ? 'bg-warm-orange/10 text-warm-orange'
                        : 'bg-sand-gold/10 text-sand-gold'
                    )}
                  >
                    {item.severity === 'high' ? '高风险' : '中风险'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {assets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">请先添加资产，才能生成调仓建议</p>
        </div>
      )}
    </div>
  );
}
