import { Asset, Category, Currency, Liquidity, PriceCache } from './types';
import { getAssetValueInBaseCurrency } from './assetValue';
import { CATEGORIES } from './categories';

export interface CategorySummary {
  category: Category;
  label: string;
  color: string;
  value: number;
  percentage: number;
}

export interface LiquiditySummary {
  high: number;
  medium: number;
  low: number;
  highPct: number;
  mediumPct: number;
  lowPct: number;
}

export function getCategorySummaries(
  assets: Asset[],
  baseCurrency: Currency,
  rates: Record<Currency, number>,
  priceCache: PriceCache
): CategorySummary[] {
  const totals: Record<Category, number> = {} as Record<Category, number>;
  let total = 0;

  for (const asset of assets) {
    const val = getAssetValueInBaseCurrency(asset, baseCurrency, rates, priceCache);
    totals[asset.category] = (totals[asset.category] || 0) + val;
    total += val;
  }

  return CATEGORIES
    .filter(c => (totals[c.key] || 0) > 0)
    .map(c => ({
      category: c.key,
      label: c.label,
      color: c.color,
      value: totals[c.key] || 0,
      percentage: total > 0 ? ((totals[c.key] || 0) / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export function getLiquiditySummary(
  assets: Asset[],
  baseCurrency: Currency,
  rates: Record<Currency, number>,
  priceCache: PriceCache
): LiquiditySummary {
  let high = 0, medium = 0, low = 0;

  for (const asset of assets) {
    const val = getAssetValueInBaseCurrency(asset, baseCurrency, rates, priceCache);
    if (asset.liquidity === 'high') high += val;
    else if (asset.liquidity === 'medium') medium += val;
    else low += val;
  }

  const total = high + medium + low;
  return {
    high,
    medium,
    low,
    highPct: total > 0 ? (high / total) * 100 : 0,
    mediumPct: total > 0 ? (medium / total) * 100 : 0,
    lowPct: total > 0 ? (low / total) * 100 : 0,
  };
}

export function getRiskExposure(
  assets: Asset[],
  baseCurrency: Currency,
  rates: Record<Currency, number>,
  priceCache: PriceCache
): number {
  let riskValue = 0;
  let total = 0;

  for (const asset of assets) {
    const val = getAssetValueInBaseCurrency(asset, baseCurrency, rates, priceCache);
    total += val;
    if (asset.category === 'stock' || asset.category === 'crypto') {
      riskValue += val;
    } else if (asset.category === 'bond') {
      riskValue += val * 0.3;
    }
  }

  return total > 0 ? (riskValue / total) * 100 : 0;
}
