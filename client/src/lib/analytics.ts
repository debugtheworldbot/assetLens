import { Asset, Category, Currency, Liquidity, PriceCache } from './types';
import { getAssetValueInBaseCurrency } from './assetValue';
import { CATEGORIES } from './categories';
import { STOCK_PALETTE } from './stockColors';

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

export interface TagSummary {
  tag: string;
  value: number;
  percentage: number;
  color: string;
  assets: { id: string; name: string; value: number }[];
}

const TAG_COLORS = [
  '#E76F51', '#2A9D8F', '#E9C46A', '#264653', '#8338EC',
  '#FF006E', '#3A86FF', '#06D6A0', '#EF476F', '#118AB2',
  '#FFD166', '#D62828', '#457B9D', '#6D6875', '#B5838D',
];

export function getTagSummaries(
  assets: Asset[],
  baseCurrency: Currency,
  rates: Record<Currency, number>,
  priceCache: PriceCache
): TagSummary[] {
  const tagMap: Record<string, { value: number; assets: { id: string; name: string; value: number }[] }> = {};
  let total = 0;

  for (const asset of assets) {
    const val = getAssetValueInBaseCurrency(asset, baseCurrency, rates, priceCache);
    total += val;
    const tags = asset.tags && asset.tags.length > 0 ? asset.tags : ['未分类'];
    for (const tag of tags) {
      if (!tagMap[tag]) {
        tagMap[tag] = { value: 0, assets: [] };
      }
      tagMap[tag].value += val;
      tagMap[tag].assets.push({ id: asset.id, name: asset.name, value: val });
    }
  }

  return Object.entries(tagMap)
    .map(([tag, data], index) => ({
      tag,
      value: data.value,
      percentage: total > 0 ? (data.value / total) * 100 : 0,
      color: TAG_COLORS[index % TAG_COLORS.length],
      assets: data.assets,
    }))
    .sort((a, b) => b.value - a.value);
}

export interface StockSummary {
  id: string;
  name: string;
  symbol: string;
  value: number;
  percentage: number;
  color: string;
}

export function getStockSummaries(
  assets: Asset[],
  baseCurrency: Currency,
  rates: Record<Currency, number>,
  priceCache: PriceCache
): StockSummary[] {
  const stockAssets = assets.filter(a => a.category === 'stock') as (Asset & { symbol: string; color?: string })[];
  let total = 0;
  const items: { id: string; name: string; symbol: string; value: number; color?: string }[] = [];

  for (const asset of stockAssets) {
    const val = getAssetValueInBaseCurrency(asset, baseCurrency, rates, priceCache);
    total += val;
    items.push({ id: asset.id, name: asset.name, symbol: asset.symbol, value: val, color: asset.color });
  }

  return items
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      id: item.id,
      name: item.name,
      symbol: item.symbol,
      value: item.value,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      color: item.color || STOCK_PALETTE[index % STOCK_PALETTE.length],
    }));
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
