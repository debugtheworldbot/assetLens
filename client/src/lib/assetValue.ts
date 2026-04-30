import { Asset, Currency, PriceCache, StockAsset } from './types';
import { convert } from './fx';

export function getAssetValueInOriginalCurrency(asset: Asset, priceCache: PriceCache): number {
  if (asset.category === 'stock') {
    const stockAsset = asset as StockAsset;
    const live = priceCache.prices[stockAsset.symbol]?.price;
    const fallback = stockAsset.lastPrice;
    const price = live ?? fallback ?? 0;
    return stockAsset.shares * price;
  }
  return asset.amount;
}

export function getAssetValueInBaseCurrency(
  asset: Asset,
  baseCurrency: Currency,
  rates: Record<Currency, number>,
  priceCache: PriceCache
): number {
  const valueInOriginal = getAssetValueInOriginalCurrency(asset, priceCache);
  return convert(valueInOriginal, asset.currency, baseCurrency, rates);
}

export function getTotalValue(
  assets: Asset[],
  baseCurrency: Currency,
  rates: Record<Currency, number>,
  priceCache: PriceCache
): number {
  return assets.reduce((sum, asset) => {
    return sum + getAssetValueInBaseCurrency(asset, baseCurrency, rates, priceCache);
  }, 0);
}
