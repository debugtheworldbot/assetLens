import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PriceCache, CryptoAsset } from '../lib/types';
import { useAssetStore } from './useAssetStore';

interface PriceStore {
  prices: Record<string, { price: number; asOf: string }>;
  fetchedAt: string | null;
  status: 'fresh' | 'stale' | 'offline';
  errors: Record<string, string>;
  loading: boolean;
  refresh: () => Promise<void>;
  fetchSingle: (symbol: string) => Promise<void>;
  fetchCryptoSingle: (symbol: string) => Promise<void>;
}

/**
 * Fetch stock prices through the backend proxy API (avoids CORS issues)
 * tRPC uses superjson transformer:
 *   - input must be wrapped in { json: { ... } }
 *   - response is in { result: { data: { json: ... } } }
 */
async function fetchPricesFromBackend(symbols: string[]): Promise<{
  prices: Record<string, { price: number; asOf: string }>;
  errors: Record<string, string>;
}> {
  try {
    const input = JSON.stringify({ json: { symbols } });
    const res = await fetch(`/api/trpc/market.getStockPrices?input=${encodeURIComponent(input)}`, {
      credentials: 'include',
    });
    
    if (!res.ok) {
      const errorMap: Record<string, string> = {};
      symbols.forEach(s => { errorMap[s.toUpperCase()] = `HTTP ${res.status}`; });
      return { prices: {}, errors: errorMap };
    }
    
    const json = await res.json();
    const data = json?.result?.data?.json;
    
    if (!data) {
      const errorMap: Record<string, string> = {};
      symbols.forEach(s => { errorMap[s.toUpperCase()] = '响应格式错误'; });
      return { prices: {}, errors: errorMap };
    }
    
    return { prices: data.prices || {}, errors: data.errors || {} };
  } catch (err: any) {
    const errorMap: Record<string, string> = {};
    symbols.forEach(s => { errorMap[s.toUpperCase()] = err.message || '网络错误'; });
    return { prices: {}, errors: errorMap };
  }
}

/**
 * Fetch crypto prices through the backend proxy API
 * Symbols are bare crypto names: BTC, ETH, SOL, etc.
 */
async function fetchCryptoPricesFromBackend(symbols: string[]): Promise<{
  prices: Record<string, { price: number; asOf: string }>;
  errors: Record<string, string>;
}> {
  try {
    const input = JSON.stringify({ json: { symbols } });
    const res = await fetch(`/api/trpc/market.getCryptoPrices?input=${encodeURIComponent(input)}`, {
      credentials: 'include',
    });
    
    if (!res.ok) {
      const errorMap: Record<string, string> = {};
      symbols.forEach(s => { errorMap[s.toUpperCase()] = `HTTP ${res.status}`; });
      return { prices: {}, errors: errorMap };
    }
    
    const json = await res.json();
    const data = json?.result?.data?.json;
    
    if (!data) {
      const errorMap: Record<string, string> = {};
      symbols.forEach(s => { errorMap[s.toUpperCase()] = '响应格式错误'; });
      return { prices: {}, errors: errorMap };
    }
    
    return { prices: data.prices || {}, errors: data.errors || {} };
  } catch (err: any) {
    const errorMap: Record<string, string> = {};
    symbols.forEach(s => { errorMap[s.toUpperCase()] = err.message || '网络错误'; });
    return { prices: {}, errors: errorMap };
  }
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
        
        // Collect stock symbols
        const stockSymbols = assets
          .filter(a => a.category === 'stock')
          .map(a => (a as any).symbol as string);

        // Collect crypto symbols
        const cryptoSymbols = assets
          .filter(a => a.category === 'crypto')
          .map(a => (a as CryptoAsset).symbol);

        if (stockSymbols.length === 0 && cryptoSymbols.length === 0) {
          set({ status: 'fresh', loading: false });
          return;
        }

        set({ loading: true });

        // Fetch both in parallel
        const [stockResult, cryptoResult] = await Promise.all([
          stockSymbols.length > 0 ? fetchPricesFromBackend(stockSymbols) : { prices: {}, errors: {} },
          cryptoSymbols.length > 0 ? fetchCryptoPricesFromBackend(cryptoSymbols) : { prices: {}, errors: {} },
        ]);

        const now = new Date().toISOString();
        const existingPrices = get().prices;
        const newPrices = { ...existingPrices, ...stockResult.prices, ...cryptoResult.prices };
        const allErrors = { ...stockResult.errors, ...cryptoResult.errors };

        set({
          prices: newPrices,
          fetchedAt: now,
          status: 'fresh',
          errors: allErrors,
          loading: false,
        });

        // Update stock prices in asset store
        const updateStockPrice = useAssetStore.getState().updateStockPrice;
        for (const [symbol, data] of Object.entries(stockResult.prices)) {
          updateStockPrice(symbol, data.price, data.asOf);
        }

        // Update crypto prices in asset store
        const updateCryptoPrice = useAssetStore.getState().updateCryptoPrice;
        if (updateCryptoPrice) {
          for (const [symbol, data] of Object.entries(cryptoResult.prices)) {
            updateCryptoPrice(symbol, data.price, data.asOf);
          }
        }
      },

      fetchSingle: async (symbol: string) => {
        set({ loading: true });
        const result = await fetchPricesFromBackend([symbol]);
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

      fetchCryptoSingle: async (symbol: string) => {
        set({ loading: true });
        const result = await fetchCryptoPricesFromBackend([symbol]);
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

        const key = symbol.toUpperCase();
        if (result.prices[key]) {
          const data = result.prices[key];
          const updateCryptoPrice = useAssetStore.getState().updateCryptoPrice;
          if (updateCryptoPrice) {
            updateCryptoPrice(key, data.price, data.asOf);
          }
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
