export type Currency = 'CNY' | 'USD' | 'HKD' | 'EUR' | 'JPY' | 'GBP' | 'SGD' | 'KRW' | 'USDT';

export type Category =
  | 'cash'
  | 'deposit'
  | 'stock'
  | 'bond'
  | 'crypto'
  | 'property'
  | 'insurance'
  | 'other';

export type Liquidity = 'high' | 'medium' | 'low';

export type Market = 'US' | 'HK' | 'CN';

export interface BaseAsset {
  id: string;
  name: string;
  liquidity: Liquidity;
  note?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StockAsset extends BaseAsset {
  category: 'stock';
  symbol: string;
  market: Market;
  shares: number;
  currency: Currency;
  lastPrice?: number;
  lastPriceAt?: string;
  pricingError?: boolean;
  color?: string;
}

export interface CashAsset extends BaseAsset {
  category: Exclude<Category, 'stock'>;
  amount: number;
  currency: Currency;
}

export type Asset = StockAsset | CashAsset;

export interface Settings {
  riskLevel: 1 | 2 | 3 | 4 | 5;
  baseCurrency: Currency;
}

export interface AppState {
  version: 1;
  settings: Settings;
  assets: Asset[];
}

export interface FxCache {
  base: 'USD';
  rates: Record<Currency, number>;
  fetchedAt: string;
  status: 'fresh' | 'stale' | 'offline';
}

export interface PriceCache {
  prices: Record<string, { price: number; asOf: string }>;
  fetchedAt: string;
  status: 'fresh' | 'stale' | 'offline';
  errors: Record<string, string>;
}

export interface CategoryInfo {
  key: Category;
  label: string;
  labelEn: string;
  defaultLiquidity: Liquidity;
  color: string;
}

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  nameEn: string;
}
