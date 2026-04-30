import { Category, CategoryInfo, Liquidity } from './types';

export const CATEGORIES: CategoryInfo[] = [
  { key: 'cash', label: '现金/活期', labelEn: 'Cash', defaultLiquidity: 'high', color: '#5b9b7d' },
  { key: 'deposit', label: '定期/理财', labelEn: 'Deposit', defaultLiquidity: 'medium', color: '#7fb89b' },
  { key: 'stock', label: '股票/ETF', labelEn: 'Stock/ETF', defaultLiquidity: 'high', color: '#e57c5a' },
  { key: 'bond', label: '债券/基金', labelEn: 'Bond/Fund', defaultLiquidity: 'medium', color: '#d4a559' },
  { key: 'crypto', label: '加密资产', labelEn: 'Crypto', defaultLiquidity: 'high', color: '#8a6cae' },
  { key: 'property', label: '房产', labelEn: 'Property', defaultLiquidity: 'low', color: '#a87b5d' },
  { key: 'insurance', label: '保险', labelEn: 'Insurance', defaultLiquidity: 'low', color: '#c9a880' },
  { key: 'other', label: '其他', labelEn: 'Other', defaultLiquidity: 'medium', color: '#9b8c7a' },
];

export const CATEGORY_MAP: Record<Category, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map(c => [c.key, c])
) as Record<Category, CategoryInfo>;

export function getCategoryColor(category: Category): string {
  return CATEGORY_MAP[category]?.color ?? '#9b8c7a';
}

export function getCategoryLabel(category: Category): string {
  return CATEGORY_MAP[category]?.label ?? '其他';
}

export function getDefaultLiquidity(category: Category): Liquidity {
  return CATEGORY_MAP[category]?.defaultLiquidity ?? 'medium';
}
