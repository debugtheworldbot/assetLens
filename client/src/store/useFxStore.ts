import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Currency, FxCache } from '../lib/types';
import { FX_FALLBACK, fetchLatestRates, getFxStatus } from '../lib/fx';

interface FxStore {
  rates: Record<Currency, number>;
  fetchedAt: string | null;
  status: 'fresh' | 'stale' | 'offline';
  loading: boolean;
  refresh: () => Promise<void>;
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
        const rates = await fetchLatestRates();
        
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
