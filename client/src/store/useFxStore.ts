import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Currency } from '../lib/types';
import { FX_FALLBACK, getFxStatus } from '../lib/fx';

interface FxStore {
  rates: Record<Currency, number>;
  fetchedAt: string | null;
  status: 'fresh' | 'stale' | 'offline';
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Fetch FX rates through the backend proxy API (avoids CORS issues)
 * tRPC uses superjson transformer, response is in { result: { data: { json: ... } } }
 */
async function fetchRatesFromBackend(): Promise<Record<Currency, number> | null> {
  try {
    const res = await fetch('/api/trpc/market.getFxRates', {
      credentials: 'include',
    });
    if (!res.ok) return null;
    
    const json = await res.json();
    // tRPC superjson response format: { result: { data: { json: ... } } }
    const data = json?.result?.data?.json;
    
    if (!data?.success || !data.rates) return null;
    
    const currencies: Currency[] = ['USD', 'CNY', 'HKD', 'EUR', 'JPY', 'GBP', 'SGD', 'KRW', 'USDT'];
    const rates: Record<string, number> = { USD: 1, USDT: 1 };
    
    for (const c of currencies) {
      if (c === 'USD' || c === 'USDT') continue;
      if (data.rates[c]) {
        rates[c] = data.rates[c];
      }
    }
    
    if (rates['CNY']) {
      return rates as Record<Currency, number>;
    }
    return null;
  } catch {
    return null;
  }
}

export const useFxStore = create<FxStore>()(
  persist(
    (set, get) => ({
      rates: FX_FALLBACK,
      fetchedAt: null,
      status: 'offline',
      loading: false,

      refresh: async () => {
        set({ loading: true });
        const rates = await fetchRatesFromBackend();
        
        if (rates) {
          const now = new Date().toISOString();
          set({
            rates,
            fetchedAt: now,
            status: 'fresh',
            loading: false,
          });
        } else {
          // Failed: update status based on existing fetchedAt
          const { fetchedAt } = get();
          set({
            status: getFxStatus(fetchedAt),
            loading: false,
          });
        }
      },
    }),
    {
      name: 'assetlens.fx.v1',
      partialize: (state) => ({
        rates: state.rates,
        fetchedAt: state.fetchedAt,
        status: state.status,
      }),
    }
  )
);
