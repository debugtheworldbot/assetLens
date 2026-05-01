import { Asset, Currency, PriceCache, StockAsset, CryptoAsset } from './types';
import { getAssetValueInBaseCurrency, getAssetValueInOriginalCurrency, getTotalValue } from './assetValue';
import { getCategorySummaries, getLiquiditySummary, getStockSummaries, getTagSummaries, getRiskExposure } from './analytics';
import { generateAdvice } from './advice';
import { getCategoryLabel } from './categories';
import { getCurrencySymbol, getCurrencyName } from './currencies';

interface PromptExportParams {
  assets: Asset[];
  baseCurrency: Currency;
  rates: Record<Currency, number>;
  priceCache: PriceCache;
  riskLevel: 1 | 2 | 3 | 4 | 5;
}

const RISK_LABELS: Record<number, string> = {
  1: '保守',
  2: '稳健',
  3: '平衡',
  4: '积极',
  5: '激进',
};

const LIQUIDITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

function fmtAmt(amount: number, currency: Currency): string {
  const sym = getCurrencySymbol(currency);
  return `${sym}${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function generateAnalysisPrompt(params: PromptExportParams): string {
  const { assets, baseCurrency, rates, priceCache, riskLevel } = params;
  const total = getTotalValue(assets, baseCurrency, rates, priceCache);
  const currencyName = getCurrencyName(baseCurrency);
  const currencySymbol = getCurrencySymbol(baseCurrency);
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  const lines: string[] = [];

  // === Header ===
  lines.push('# 个人资产分析报告');
  lines.push('');
  lines.push(`> 生成时间: ${now}`);
  lines.push(`> 基准币种: ${currencyName} (${baseCurrency})`);
  lines.push(`> 风险偏好: R${riskLevel} ${RISK_LABELS[riskLevel]}`);
  lines.push(`> 资产总值: ${fmtAmt(total, baseCurrency)}`);
  lines.push(`> 资产数量: ${assets.length} 项`);
  lines.push('');

  // === Asset Details ===
  lines.push('## 一、资产明细');
  lines.push('');

  for (const asset of assets) {
    const valueBase = getAssetValueInBaseCurrency(asset, baseCurrency, rates, priceCache);
    const pct = total > 0 ? (valueBase / total) * 100 : 0;
    const categoryLabel = getCategoryLabel(asset.category);
    const liquidityLabel = LIQUIDITY_LABELS[asset.liquidity] || asset.liquidity;

    lines.push(`### ${asset.name}`);
    lines.push(`- 类别: ${categoryLabel}`);
    lines.push(`- 流动性: ${liquidityLabel}`);

    if (asset.category === 'stock') {
      const s = asset as StockAsset;
      const valueOrig = getAssetValueInOriginalCurrency(asset, priceCache);
      const price = priceCache.prices[s.symbol]?.price ?? s.lastPrice ?? 0;
      lines.push(`- 代码: ${s.symbol} (${s.market})`);
      lines.push(`- 持仓: ${s.shares} 股 × ${getCurrencySymbol(s.currency)}${price.toFixed(2)}`);
      lines.push(`- 原币市值: ${fmtAmt(valueOrig, s.currency)}`);
    } else if (asset.category === 'crypto') {
      const c = asset as CryptoAsset;
      const valueOrig = getAssetValueInOriginalCurrency(asset, priceCache);
      const price = priceCache.prices[c.symbol]?.price ?? c.lastPrice ?? 0;
      lines.push(`- 代码: ${c.symbol}`);
      lines.push(`- 持仓: ${c.amount} 枚 × $${price.toFixed(2)}`);
      lines.push(`- 美元市值: ${fmtAmt(valueOrig, 'USD')}`);
    } else {
      lines.push(`- 金额: ${fmtAmt((asset as any).amount, asset.currency)}`);
    }

    lines.push(`- 折合基准币: ${fmtAmt(valueBase, baseCurrency)} (占比 ${fmtPct(pct)})`);

    if (asset.tags && asset.tags.length > 0) {
      lines.push(`- 标签: ${asset.tags.join(', ')}`);
    }
    if (asset.note) {
      lines.push(`- 备注: ${asset.note}`);
    }
    lines.push('');
  }

  // === Category Distribution ===
  lines.push('## 二、资产类别分布');
  lines.push('');
  lines.push('| 类别 | 市值 | 占比 |');
  lines.push('|------|------|------|');
  const categories = getCategorySummaries(assets, baseCurrency, rates, priceCache);
  for (const cat of categories) {
    lines.push(`| ${cat.label} | ${fmtAmt(cat.value, baseCurrency)} | ${fmtPct(cat.percentage)} |`);
  }
  lines.push(`| **合计** | **${fmtAmt(total, baseCurrency)}** | **100%** |`);
  lines.push('');

  // === Stock Distribution ===
  const stocks = getStockSummaries(assets, baseCurrency, rates, priceCache);
  if (stocks.length > 0) {
    lines.push('## 三、个股/ETF 持仓分布');
    lines.push('');
    lines.push('| 名称 | 代码 | 市值 | 占股票总值比 |');
    lines.push('|------|------|------|------------|');
    for (const s of stocks) {
      lines.push(`| ${s.name} | ${s.symbol} | ${fmtAmt(s.value, baseCurrency)} | ${fmtPct(s.percentage)} |`);
    }
    lines.push('');
  }

  // === Tag Distribution ===
  const tags = getTagSummaries(assets, baseCurrency, rates, priceCache);
  if (tags.length > 0 && tags.some(t => t.tag !== '未分类')) {
    lines.push('## 四、标签维度分布');
    lines.push('');
    lines.push('| 标签 | 市值 | 占比 |');
    lines.push('|------|------|------|');
    for (const t of tags) {
      lines.push(`| ${t.tag} | ${fmtAmt(t.value, baseCurrency)} | ${fmtPct(t.percentage)} |`);
    }
    lines.push('');
  }

  // === Liquidity ===
  const liq = getLiquiditySummary(assets, baseCurrency, rates, priceCache);
  lines.push('## 五、流动性分布');
  lines.push('');
  lines.push('| 流动性 | 市值 | 占比 |');
  lines.push('|--------|------|------|');
  lines.push(`| 高流动性 | ${fmtAmt(liq.high, baseCurrency)} | ${fmtPct(liq.highPct)} |`);
  lines.push(`| 中流动性 | ${fmtAmt(liq.medium, baseCurrency)} | ${fmtPct(liq.mediumPct)} |`);
  lines.push(`| 低流动性 | ${fmtAmt(liq.low, baseCurrency)} | ${fmtPct(liq.lowPct)} |`);
  lines.push('');

  // === Risk ===
  const riskExposure = getRiskExposure(assets, baseCurrency, rates, priceCache);
  lines.push('## 六、风险分析');
  lines.push('');
  lines.push(`- 用户风险偏好: R${riskLevel} (${RISK_LABELS[riskLevel]})`);
  lines.push(`- 当前风险敞口: ${fmtPct(riskExposure)}`);
  lines.push(`- 风险敞口计算方式: 股票和加密资产全额计入，债券/基金按 30% 计入`);
  lines.push('');

  // === Current Advice ===
  const advice = generateAdvice(assets, baseCurrency, rates, priceCache, riskLevel);
  if (advice.length > 0) {
    lines.push('## 七、系统已识别的风险提示');
    lines.push('');
    for (const a of advice) {
      const severity = a.severity === 'high' ? '⚠️ 高' : '⚡ 中';
      lines.push(`- [${severity}] ${a.title}: ${a.message}`);
    }
    lines.push('');
  }

  // === FX Info ===
  lines.push('## 八、汇率信息');
  lines.push('');
  const usedCurrencies = new Set<Currency>();
  for (const asset of assets) {
    if (asset.currency !== baseCurrency) {
      usedCurrencies.add(asset.currency);
    }
  }
  if (usedCurrencies.size > 0) {
    lines.push('| 币种 | 对基准币汇率 |');
    lines.push('|------|------------|');
    Array.from(usedCurrencies).forEach((cur: Currency) => {
      const baseRate = rates[baseCurrency] || 1;
      const curRate = rates[cur] || 1;
      const crossRate = baseRate / curRate;
      lines.push(`| 1 ${cur} | ${crossRate.toFixed(4)} ${baseCurrency} |`);
    });
    lines.push('');
  } else {
    lines.push('所有资产均为基准币种，无需汇率换算。');
    lines.push('');
  }

  // === Prompt Instructions ===
  lines.push('---');
  lines.push('');
  lines.push('## 请基于以上数据，为我提供以下分析：');
  lines.push('');
  lines.push('1. **资产配置评估**: 当前的资产类别分布是否合理？与我的风险偏好 R' + riskLevel + ' 是否匹配？');
  lines.push('2. **风险诊断**: 是否存在集中度过高、流动性不足、风险敞口超标等问题？');
  lines.push('3. **调仓建议**: 具体应该如何调整？建议增配或减配哪些类别？给出目标比例。');
  lines.push('4. **个股分析**: 对当前持有的股票/ETF 组合有何看法？是否需要调整？');
  lines.push('5. **行动计划**: 按优先级给出 3-5 条可执行的调仓步骤。');
  lines.push('');
  lines.push('请用中文回答，给出具体的数字和比例建议，而非笼统的方向性建议。');

  return lines.join('\n');
}
