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
  // Try multiple free APIs in order of reliability
  const apis = [
    {
      url: 'https://open.er-api.com/v6/latest/USD',
      parse: (data: any) => {
        if (data.result !== 'success' || !data.rates) return null;
        return data.rates;
      },
    },
    {
      url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      parse: (data: any) => {
        if (!data.usd) return null;
        // This API returns lowercase keys, need to map
        const map: Record<string, string> = {
          cny: 'CNY', hkd: 'HKD', eur: 'EUR', jpy: 'JPY',
          gbp: 'GBP', sgd: 'SGD', krw: 'KRW',
        };
        const rates: Record<string, number> = {};
        for (const [lower, upper] of Object.entries(map)) {
          if (data.usd[lower]) rates[upper] = data.usd[lower];
        }
        return Object.keys(rates).length > 0 ? rates : null;
      },
    },
  ];

  const currencies: Currency[] = ['USD', 'CNY', 'HKD', 'EUR', 'JPY', 'GBP', 'SGD', 'KRW', 'USDT'];

  for (const api of apis) {
    try {
      const res = await fetch(api.url);
      if (!res.ok) continue;
      const data = await res.json();
      const rawRates = api.parse(data);
      if (!rawRates) continue;

      const rates: Record<string, number> = { USD: 1, USDT: 1 };
      for (const c of currencies) {
        if (c === 'USD' || c === 'USDT') continue;
        if (rawRates[c]) {
          rates[c] = rawRates[c];
        }
      }

      // Verify we got at least CNY
      if (rates['CNY']) {
        return rates as Record<Currency, number>;
      }
    } catch {
      continue;
    }
  }

  return null;
}
