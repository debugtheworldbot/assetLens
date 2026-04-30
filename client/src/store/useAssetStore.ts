import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { AppState, Asset, Settings, Currency, StockAsset, CashAsset, Category, Liquidity, Market } from '../lib/types';

interface AssetStore {
  version: 1;
  settings: Settings;
  assets: Asset[];
  // Actions
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  setRiskLevel: (level: 1 | 2 | 3 | 4 | 5) => void;
  setBaseCurrency: (currency: Currency) => void;
  importState: (state: AppState) => void;
  getExportState: () => AppState;
  clearAll: () => void;
  updateStockPrice: (symbol: string, price: number, asOf: string) => void;
  updateAssetTags: (id: string, tags: string[]) => void;
  updateAssetColor: (id: string, color: string) => void;
}

const DEFAULT_SETTINGS: Settings = {
  riskLevel: 3,
  baseCurrency: 'CNY',
};

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      version: 1,
      settings: DEFAULT_SETTINGS,
      assets: [],

      addAsset: (assetData) => {
        const id = nanoid();
        const now = new Date().toISOString();
        const newAsset = {
          ...assetData,
          id,
          createdAt: now,
          updatedAt: now,
        } as Asset;
        
        set((state) => ({
          assets: [...state.assets, newAsset],
        }));
        return id;
      },

      updateAsset: (id, updates) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id
              ? { ...a, ...updates, updatedAt: new Date().toISOString() }
              : a
          ) as Asset[],
        }));
      },

      deleteAsset: (id) => {
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== id),
        }));
      },

      setRiskLevel: (level) => {
        set((state) => ({
          settings: { ...state.settings, riskLevel: level },
        }));
      },

      setBaseCurrency: (currency) => {
        set((state) => ({
          settings: { ...state.settings, baseCurrency: currency },
        }));
      },

      importState: (importedState) => {
        set({
          version: 1,
          settings: importedState.settings,
          assets: importedState.assets,
        });
      },

      getExportState: () => {
        const { version, settings, assets } = get();
        return { version, settings, assets };
      },

      clearAll: () => {
        set({
          assets: [],
          settings: DEFAULT_SETTINGS,
        });
      },

      updateStockPrice: (symbol, price, asOf) => {
        set((state) => ({
          assets: state.assets.map((a) => {
            if (a.category === 'stock' && (a as StockAsset).symbol === symbol) {
              return {
                ...a,
                lastPrice: price,
                lastPriceAt: asOf,
                pricingError: false,
                updatedAt: new Date().toISOString(),
              };
            }
            return a;
          }) as Asset[],
        }));
      },

      updateAssetTags: (id, tags) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id
              ? { ...a, tags, updatedAt: new Date().toISOString() }
              : a
          ) as Asset[],
        }));
      },

      updateAssetColor: (id, color) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id
              ? { ...a, color, updatedAt: new Date().toISOString() }
              : a
          ) as Asset[],
        }));
      },
    }),
    {
      name: 'assetlens.v1',
    }
  )
);
