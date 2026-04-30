import { Currency, FxCache } from './types';

export const FX_FALLBACK: Record<Currency, number> = {
  USD: 1.00,
  CNY: 7.10,
  HKD: 7.78,
  EUR: 0.93,
  JPY: 152.0,
  GBP: 0.79,
  SGD: 1.35,
  KRW: 1370,
  USDT: 1.00,
};

export function convert(amount: number, from: Currency, to: Currency, rates: Record<Currency, number>): number {
  if (from === to) return amount;
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  return amount * (toRate / fromRate);
}

export function getFxStatus(fetchedAt: string | null): 'fresh' | 'stale' | 'offline' {
  if (!fetchedAt) return 'offline';
  const diff = Date.now() - new Date(fetchedAt).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 6) return 'fresh';
  if (hours < 168) return 'stale'; // 7 days
  return 'offline';
}

export async function fetchLatestRates(): Promise<Record<Currency, number> | null> {
  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=USD');
    if (!res.ok) throw new Error('FX fetch failed');
    const data = await res.json();
    if (!data.rates) throw new Error('No rates in response');
    
    const currencies: Currency[] = ['USD', 'CNY', 'HKD', 'EUR', 'JPY', 'GBP', 'SGD', 'KRW', 'USDT'];
    const rates: Record<string, number> = { USD: 1, USDT: 1 };
    
    for (const c of currencies) {
      if (c === 'USD' || c === 'USDT') continue;
      if (data.rates[c]) {
        rates[c] = data.rates[c];
      }
    }
    
    return rates as Record<Currency, number>;
  } catch {
    return null;
  }
}
