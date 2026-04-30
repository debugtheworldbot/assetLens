import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PriceCache } from '../lib/types';
import { fetchStockPrices, getPriceStatus } from '../lib/stockPrice';
import { useAssetStore } from './useAssetStore';

interface PriceStore {
  prices: Record<string, { price: number; asOf: string }>;
  fetchedAt: string | null;
  status: 'fresh' | 'stale' | 'offline';
  errors: Record<string, string>;
  loading: boolean;
  refresh: () => Promise<void>;
  fetchSingle: (symbol: string) => Promise<void>;
}

export const usePriceStore = create<PriceStore>()(
  persist(
    (set, get) => ({
      prices: {},
      fetchedAt: null,
      status: 'offline',
      errors: {},
      loading: false,

      refresh: async () => {
        const assets = useAssetStore.getState().assets;
        const stockSymbols = assets
          .filter(a => a.category === 'stock')
          .map(a => (a as any).symbol as string);

        if (stockSymbols.length === 0) {
          set({ status: 'fresh', loading: false });
          return;
        }

        set({ loading: true });
        const result = await fetchStockPrices(stockSymbols);
        const now = new Date().toISOString();

        const existingPrices = get().prices;
        const newPrices = { ...existingPrices, ...result.prices };

        set({
          prices: newPrices,
          fetchedAt: now,
          status: 'fresh',
          errors: result.errors,
          loading: false,
        });

        const updateStockPrice = useAssetStore.getState().updateStockPrice;
        for (const [symbol, data] of Object.entries(result.prices)) {
          updateStockPrice(symbol, data.price, data.asOf);
        }
      },

      fetchSingle: async (symbol: string) => {
        set({ loading: true });
        const result = await fetchStockPrices([symbol]);
        const now = new Date().toISOString();

        const existingPrices = get().prices;
        const existingErrors = get().errors;
        
        set({
          prices: { ...existingPrices, ...result.prices },
          fetchedAt: now,
          status: 'fresh',
          errors: { ...existingErrors, ...result.errors },
          loading: false,
        });

        if (result.prices[symbol.toUpperCase()]) {
          const data = result.prices[symbol.toUpperCase()];
          useAssetStore.getState().updateStockPrice(symbol.toUpperCase(), data.price, data.asOf);
        }
      },
    }),
    {
      name: 'assetlens.prices.v1',
      partialize: (state) => ({
        prices: state.prices,
        fetchedAt: state.fetchedAt,
        status: state.status,
        errors: state.errors,
      }),
    }
  )
);

// Helper to get a stable PriceCache object outside of React render
export function getPriceCache(): PriceCache {
  const { prices, fetchedAt, status, errors } = usePriceStore.getState();
  return {
    prices,
    fetchedAt: fetchedAt || '',
    status,
    errors,
  };
}
