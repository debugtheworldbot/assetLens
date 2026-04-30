import { Asset, Currency, PriceCache } from './types';
import { getAssetValueInBaseCurrency, getTotalValue } from './assetValue';

export const THRESHOLDS = {
  CASH_LOW_PCT: 10,
  CRYPTO_HIGH_PCT: 20,
  CONCENTRATION_PCT: 40,
  LIQUIDITY_LOW_PCT: 30,
  RISK_CAPS: {
    1: 10,
    2: 25,
    3: 45,
    4: 65,
    5: 85,
  } as Record<number, number>,
};

export type Severity = 'high' | 'medium';

export interface AdviceItem {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  value: number; // current percentage
}

export function generateAdvice(
  assets: Asset[],
  baseCurrency: Currency,
  rates: Record<Currency, number>,
  priceCache: PriceCache,
  riskLevel: 1 | 2 | 3 | 4 | 5
): AdviceItem[] {
  const advice: AdviceItem[] = [];
  const total = getTotalValue(assets, baseCurrency, rates, priceCache);
  
  if (total === 0 || assets.length === 0) return advice;

  // 1. CASH_LOW
  let cashDeposit = 0;
  for (const a of assets) {
    if (a.category === 'cash' || a.category === 'deposit') {
      cashDeposit += getAssetValueInBaseCurrency(a, baseCurrency, rates, priceCache);
    }
  }
  const cashPct = (cashDeposit / total) * 100;
  if (cashPct < THRESHOLDS.CASH_LOW_PCT) {
    advice.push({
      id: 'CASH_LOW',
      title: '现金不足',
      message: `可动用现金占比 ${cashPct.toFixed(1)}%，建议至少留 6 个月开销`,
      severity: 'high',
      value: cashPct,
    });
  }

  // 2. CRYPTO_HIGH
  let cryptoValue = 0;
  for (const a of assets) {
    if (a.category === 'crypto') {
      cryptoValue += getAssetValueInBaseCurrency(a, baseCurrency, rates, priceCache);
    }
  }
  const cryptoPct = (cryptoValue / total) * 100;
  if (cryptoPct > THRESHOLDS.CRYPTO_HIGH_PCT) {
    advice.push({
      id: 'CRYPTO_HIGH',
      title: '加密占比过高',
      message: `加密资产占 ${cryptoPct.toFixed(1)}%，波动剧烈，建议控制在 10-15%`,
      severity: 'high',
      value: cryptoPct,
    });
  }

  // 3. CONCENTRATION
  let maxValue = 0;
  let maxName = '';
  for (const a of assets) {
    const val = getAssetValueInBaseCurrency(a, baseCurrency, rates, priceCache);
    if (val > maxValue) {
      maxValue = val;
      maxName = a.name;
    }
  }
  const maxPct = (maxValue / total) * 100;
  if (maxPct > THRESHOLDS.CONCENTRATION_PCT) {
    advice.push({
      id: 'CONCENTRATION',
      title: '单一资产集中度过高',
      message: `「${maxName}」占总资产 ${maxPct.toFixed(1)}%，建议分散`,
      severity: 'medium',
      value: maxPct,
    });
  }

  // 4. LIQUIDITY_LOW
  let liquidValue = 0;
  for (const a of assets) {
    if (a.liquidity === 'high' || a.liquidity === 'medium') {
      liquidValue += getAssetValueInBaseCurrency(a, baseCurrency, rates, priceCache);
    }
  }
  const liquidPct = (liquidValue / total) * 100;
  if (liquidPct < THRESHOLDS.LIQUIDITY_LOW_PCT) {
    advice.push({
      id: 'LIQUIDITY_LOW',
      title: '流动性不足',
      message: `可快速变现资产仅 ${liquidPct.toFixed(1)}%，建议提升`,
      severity: 'medium',
      value: liquidPct,
    });
  }

  // 5. RISK_MISMATCH
  let riskValue = 0;
  for (const a of assets) {
    const val = getAssetValueInBaseCurrency(a, baseCurrency, rates, priceCache);
    if (a.category === 'stock' || a.category === 'crypto') {
      riskValue += val;
    } else if (a.category === 'bond') {
      riskValue += val * 0.3;
    }
  }
  const riskPct = (riskValue / total) * 100;
  const cap = THRESHOLDS.RISK_CAPS[riskLevel];
  if (riskPct > cap) {
    advice.push({
      id: 'RISK_MISMATCH',
      title: '风险与等级不匹配',
      message: `你的风险敞口 ${riskPct.toFixed(1)}%，超出 R${riskLevel} 上限 ${cap}%`,
      severity: 'high',
      value: riskPct,
    });
  }

  // Sort by severity: high first
  advice.sort((a, b) => {
    if (a.severity === 'high' && b.severity !== 'high') return -1;
    if (a.severity !== 'high' && b.severity === 'high') return 1;
    return 0;
  });

  return advice;
}
