import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Loader2, Check, AlertCircle, Trash2, Search, ChevronDown } from 'lucide-react';
import { useAssetStore } from '@/store/useAssetStore';
import { usePriceStore } from '@/store/usePriceStore';
import { Asset, Category, Currency, Liquidity, Market, StockAsset, CashAsset, CryptoAsset } from '@/lib/types';
import { CATEGORIES, getDefaultLiquidity } from '@/lib/categories';
import { CURRENCIES } from '@/lib/currencies';
import { parseSymbol, getMarketLabel } from '@/lib/stockPrice';
import { cn } from '@/lib/utils';

interface Props {
  asset: Asset | null;
  onClose: () => void;
}

// Market options for the dropdown
const MARKETS: { value: Market; label: string; suffix: string; placeholder: string; currency: Currency }[] = [
  { value: 'CN', label: 'A股', suffix: '.CN', placeholder: '输入代码或名称搜索...', currency: 'CNY' },
  { value: 'HK', label: '港股', suffix: '.HK', placeholder: '输入代码或名称搜索...', currency: 'HKD' },
  { value: 'US', label: '美股', suffix: '.US', placeholder: '输入代码或名称搜索...', currency: 'USD' },
];

interface SearchResult {
  ticker: string;
  name: string;
  nameEn?: string;
}

interface StockEntry {
  id: string;
  name: string;
  ticker: string; // raw ticker without market suffix
  shares: string;
  searchStatus: 'idle' | 'searching' | 'found' | 'not_found' | 'error';
  price: number | null;
  priceAsOf: string | null;
  error: string | null;
  // Search dropdown state
  searchQuery: string;
  searchResults: SearchResult[];
  showDropdown: boolean;
  isSearching: boolean;
}

function createEmptyEntry(): StockEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    ticker: '',
    shares: '',
    searchStatus: 'idle',
    price: null,
    priceAsOf: null,
    error: null,
    searchQuery: '',
    searchResults: [],
    showDropdown: false,
    isSearching: false,
  };
}

export default function AssetFormModal({ asset, onClose }: Props) {
  const addAsset = useAssetStore((s) => s.addAsset);
  const updateAsset = useAssetStore((s) => s.updateAsset);
  const updateStockPrice = useAssetStore((s) => s.updateStockPrice);
  const settings = useAssetStore((s) => s.settings);
  const fetchSingle = usePriceStore((s) => s.fetchSingle);
  const fetchCryptoSingle = usePriceStore((s) => s.fetchCryptoSingle);

  const [category, setCategory] = useState<Category>(asset?.category || 'cash');
  const [name, setName] = useState(asset?.name || '');
  const [liquidity, setLiquidity] = useState<Liquidity>(asset?.liquidity || 'high');
  const [note, setNote] = useState(asset?.note || '');

  // Crypto fields
  const [cryptoSymbol, setCryptoSymbol] = useState<string>(
    asset?.category === 'crypto' ? (asset as CryptoAsset).symbol : ''
  );
  const [cryptoPrice, setCryptoPrice] = useState<number | null>(
    asset?.category === 'crypto' ? (asset as CryptoAsset).lastPrice || null : null
  );
  const [cryptoPriceLoading, setCryptoPriceLoading] = useState(false);
  const [cryptoPriceError, setCryptoPriceError] = useState<string | null>(null);
  const cryptoTimer = useRef<NodeJS.Timeout | null>(null);

  // Cash fields
  const [amount, setAmount] = useState<string>(
    asset && asset.category !== 'stock' ? String((asset as CashAsset).amount) : ''
  );
  const [currency, setCurrency] = useState<Currency>(asset?.currency || settings.baseCurrency);

  // Stock fields - new multi-stock approach
  const [market, setMarket] = useState<Market>(
    asset?.category === 'stock' ? (asset as StockAsset).market : 'CN'
  );
  const [entries, setEntries] = useState<StockEntry[]>(() => {
    if (asset?.category === 'stock') {
      const sa = asset as StockAsset;
      const ticker = sa.symbol.split('.')[0];
      return [{
        id: crypto.randomUUID(),
        name: sa.name,
        ticker,
        shares: String(sa.shares),
        searchStatus: sa.lastPrice ? 'found' : 'idle',
        price: sa.lastPrice || null,
        priceAsOf: sa.lastPriceAt || null,
        error: null,
        searchQuery: ticker,
        searchResults: [],
        showDropdown: false,
        isSearching: false,
      }];
    }
    return [createEmptyEntry()];
  });

  const isStock = category === 'stock';
  const isEditing = !!asset;

  const marketInfo = MARKETS.find(m => m.value === market)!;

  // Debounce timers for fuzzy search
  const searchTimers = useRef<Record<string, NodeJS.Timeout>>({});
  // Ref for dropdown click-outside handling
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!isEditing) {
      setLiquidity(getDefaultLiquidity(category));
    }
  }, [category, isEditing]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(searchTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setEntries(prev => prev.map(entry => {
        const ref = dropdownRefs.current[entry.id];
        if (ref && !ref.contains(e.target as Node)) {
          return { ...entry, showDropdown: false };
        }
        return entry;
      }));
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fuzzy search from backend
  const doFuzzySearch = useCallback(async (entryId: string, query: string) => {
    if (!query.trim() || query.trim().length < 1) {
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, searchResults: [], showDropdown: false, isSearching: false } : e
      ));
      return;
    }

    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, isSearching: true } : e
    ));

    try {
      const input = JSON.stringify({ json: { query: query.trim(), market, limit: 8 } });
      const res = await fetch(`/api/trpc/market.fuzzySearch?input=${encodeURIComponent(input)}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const results: SearchResult[] = json?.result?.data?.json?.results || [];

      setEntries(prev => prev.map(e =>
        e.id === entryId ? {
          ...e,
          searchResults: results,
          showDropdown: results.length > 0,
          isSearching: false,
        } : e
      ));
    } catch {
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, searchResults: [], showDropdown: false, isSearching: false } : e
      ));
    }
  }, [market]);

  // Fetch price for a specific ticker
  const fetchPrice = useCallback(async (entryId: string, ticker: string) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, searchStatus: 'searching', error: null } : e
    ));

    try {
      const input = JSON.stringify({ json: { ticker: ticker.trim(), market } });
      const res = await fetch(`/api/trpc/market.searchStock?input=${encodeURIComponent(input)}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const data = json?.result?.data?.json;

      if (data?.price !== null && data?.price !== undefined) {
        setEntries(prev => prev.map(e =>
          e.id === entryId ? {
            ...e,
            searchStatus: 'found',
            name: e.name || data.name || '', // only auto-fill if name is empty
            price: data.price,
            priceAsOf: data.asOf,
            error: null,
          } : e
        ));
      } else if (data?.error) {
        setEntries(prev => prev.map(e =>
          e.id === entryId ? {
            ...e,
            searchStatus: 'not_found',
            error: data.error,
          } : e
        ));
      } else {
        setEntries(prev => prev.map(e =>
          e.id === entryId ? {
            ...e,
            searchStatus: 'not_found',
            error: '未找到该股票',
          } : e
        ));
      }
    } catch (err: any) {
      setEntries(prev => prev.map(e =>
        e.id === entryId ? {
          ...e,
          searchStatus: 'error',
          error: err.message || '获取价格失败',
        } : e
      ));
    }
  }, [market]);

  // Handle search input change with debounced fuzzy search
  const handleSearchInputChange = (entryId: string, value: string) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? {
        ...e,
        searchQuery: value,
        // Reset if user is typing again
        ticker: '',
        name: '',
        searchStatus: 'idle',
        price: null,
        priceAsOf: null,
        error: null,
      } : e
    ));

    // Clear previous timer
    if (searchTimers.current[entryId]) {
      clearTimeout(searchTimers.current[entryId]);
    }

    // Debounce fuzzy search (300ms)
    if (value.trim().length >= 1) {
      searchTimers.current[entryId] = setTimeout(() => {
        doFuzzySearch(entryId, value);
      }, 300);
    } else {
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, searchResults: [], showDropdown: false } : e
      ));
    }
  };

  // Select a stock from dropdown
  const handleSelectStock = (entryId: string, stock: SearchResult) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? {
        ...e,
        ticker: stock.ticker,
        name: stock.name,
        searchQuery: `${stock.ticker} ${stock.name}`,
        showDropdown: false,
        searchResults: [],
      } : e
    ));

    // Immediately fetch price
    fetchPrice(entryId, stock.ticker);
  };

  // Handle direct ticker input (user types exact code and presses Enter or blurs)
  const handleDirectSearch = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    // If already found or no query, skip
    if (entry.searchStatus === 'found') return;
    if (!entry.searchQuery.trim()) return;

    // If no ticker selected from dropdown, treat the query as a ticker code
    if (!entry.ticker) {
      const query = entry.searchQuery.trim().toUpperCase();
      setEntries(prev => prev.map(e =>
        e.id === entryId ? {
          ...e,
          ticker: query,
          showDropdown: false,
        } : e
      ));
      fetchPrice(entryId, query);
    }
  };

  const updateEntry = (id: string, field: keyof StockEntry, value: string) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const addEntry = () => {
    setEntries(prev => [...prev, createEmptyEntry()]);
  };

  const canSubmitStock = () => {
    return entries.some(e =>
      e.ticker.trim() &&
      e.shares &&
      parseFloat(e.shares) > 0 &&
      e.name.trim()
    );
  };

  const isCrypto = category === 'crypto';

  const canSubmit = () => {
    if (isStock) {
      return canSubmitStock();
    } else if (isCrypto) {
      if (!cryptoSymbol.trim()) return false;
      if (!amount || parseFloat(amount) <= 0) return false;
      return true;
    } else {
      if (!name.trim()) return false;
      if (!amount || parseFloat(amount) <= 0) return false;
      return true;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;

    if (isStock) {
      const validEntries = entries.filter(e =>
        e.ticker.trim() && e.shares && parseFloat(e.shares) > 0 && e.name.trim()
      );

      for (const entry of validEntries) {
        const fullSymbol = `${entry.ticker.toUpperCase()}.${market}`;

        const assetData: Omit<StockAsset, 'id' | 'createdAt' | 'updatedAt'> = {
          category: 'stock',
          name: entry.name.trim(),
          symbol: fullSymbol,
          market,
          shares: parseFloat(entry.shares),
          currency: marketInfo.currency,
          liquidity,
          note: note.trim() || undefined,
          lastPrice: entry.price || undefined,
          lastPriceAt: entry.priceAsOf || undefined,
          pricingError: entry.searchStatus !== 'found',
        };

        if (isEditing && validEntries.length === 1) {
          updateAsset(asset!.id, assetData);
        } else {
          addAsset(assetData);
        }

        // Update price store if we have a price
        if (entry.price) {
          updateStockPrice(fullSymbol, entry.price, entry.priceAsOf || new Date().toISOString());
        }

        // If price wasn't fetched yet, fetch in background
        if (entry.searchStatus !== 'found') {
          fetchSingle(fullSymbol).catch(() => {});
        }
      }
    } else if (category === 'crypto') {
      // Crypto asset with symbol for live pricing
      const sym = cryptoSymbol.trim().toUpperCase();
      const assetData = {
        category: 'crypto' as const,
        name: name.trim() || sym,
        symbol: sym,
        amount: parseFloat(amount),
        currency: 'USD' as const,
        liquidity,
        note: note.trim() || undefined,
        lastPrice: cryptoPrice || undefined,
        lastPriceAt: cryptoPrice ? new Date().toISOString() : undefined,
      };

      if (isEditing) {
        updateAsset(asset!.id, assetData);
      } else {
        addAsset(assetData);
      }

      // Fetch price in background if not yet fetched
      if (!cryptoPrice) {
        fetchCryptoSingle(sym).catch(() => {});
      }
    } else {
      const assetData: Omit<CashAsset, 'id' | 'createdAt' | 'updatedAt'> = {
        category: category as Exclude<typeof category, 'stock' | 'crypto'>,
        name: name.trim(),
        amount: parseFloat(amount),
        currency,
        liquidity,
        note: note.trim() || undefined,
      };

      if (isEditing) {
        updateAsset(asset!.id, assetData);
      } else {
        addAsset(assetData);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {isEditing ? '编辑资产' : '新增资产'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">类别</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={cn(
                    'px-2 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    category === cat.key
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  )}
                  style={category === cat.key ? { backgroundColor: cat.color } : {}}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock fields - multi-stock UI with fuzzy search */}
          {isStock ? (
            <>
              {/* Market dropdown */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">市场</label>
                <select
                  value={market}
                  onChange={(e) => {
                    setMarket(e.target.value as Market);
                    if (!isEditing) {
                      setEntries([createEmptyEntry()]);
                    }
                  }}
                  disabled={isEditing}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                >
                  {MARKETS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label} ({m.currency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock entries list */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground block">
                  股票列表
                </label>

                {entries.map((entry, idx) => (
                  <div key={entry.id} className="rounded-xl border border-border bg-accent/30 p-3 space-y-2">
                    {/* Row 1: Search input with dropdown */}
                    <div className="flex gap-2 items-center">
                      <div
                        ref={(el) => { dropdownRefs.current[entry.id] = el; }}
                        className="relative flex-1"
                      >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={entry.searchQuery}
                          onChange={(e) => handleSearchInputChange(entry.id, e.target.value)}
                          onFocus={() => {
                            if (entry.searchResults.length > 0) {
                              setEntries(prev => prev.map(e =>
                                e.id === entry.id ? { ...e, showDropdown: true } : e
                              ));
                            }
                          }}
                          onBlur={() => {
                            // Delay to allow click on dropdown item
                            setTimeout(() => handleDirectSearch(entry.id), 200);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleDirectSearch(entry.id);
                            }
                          }}
                          placeholder={marketInfo.placeholder}
                          className="w-full pl-8 pr-12 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                          {entry.isSearching ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            marketInfo.suffix
                          )}
                        </span>

                        {/* Fuzzy search dropdown */}
                        {entry.showDropdown && entry.searchResults.length > 0 && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {entry.searchResults.map((result) => (
                              <button
                                key={result.ticker}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // prevent blur
                                  handleSelectStock(entry.id, result);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2 border-b border-border/50 last:border-0"
                              >
                                <span className="text-xs font-mono font-semibold text-warm-orange min-w-[60px]">
                                  {result.ticker}
                                </span>
                                <span className="text-sm text-foreground truncate flex-1">
                                  {result.name}
                                </span>
                                {result.nameEn && (
                                  <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">
                                    {result.nameEn}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {entries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Search status indicator */}
                    {entry.searchStatus === 'searching' && (
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">正在获取 {entry.ticker}{marketInfo.suffix} 的价格...</span>
                      </div>
                    )}

                    {/* Found result - show name + price */}
                    {entry.searchStatus === 'found' && (
                      <div className="rounded-lg bg-sage-green/5 border border-sage-green/20 p-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-sage-green flex-shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate">
                            {entry.ticker}{marketInfo.suffix} · {entry.name}
                          </span>
                          <span className="text-xs text-sage-green font-mono ml-auto flex-shrink-0">
                            {marketInfo.currency} {entry.price?.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        {entry.shares && parseFloat(entry.shares) > 0 && entry.price && (
                          <div className="text-[11px] text-muted-foreground pl-5">
                            市值 ≈ {marketInfo.currency} {(entry.price * parseFloat(entry.shares)).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Not found / error */}
                    {(entry.searchStatus === 'not_found' || entry.searchStatus === 'error') && (
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-destructive/5">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                        <span className="text-xs text-destructive">{entry.error || '未找到该股票'}</span>
                        <button
                          type="button"
                          onClick={() => fetchPrice(entry.id, entry.ticker || entry.searchQuery)}
                          className="ml-auto text-xs text-warm-orange hover:underline"
                        >
                          重试
                        </button>
                      </div>
                    )}

                    {/* Row 2: Shares input (name is auto-filled from search) */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={entry.name}
                        onChange={(e) => updateEntry(entry.id, 'name', e.target.value)}
                        placeholder="名称（选择后自动填充）"
                        className={cn(
                          "flex-1 px-3 py-1.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30",
                          entry.searchStatus === 'found'
                            ? 'border-sage-green/30 text-foreground'
                            : 'border-border'
                        )}
                      />
                      <input
                        type="number"
                        value={entry.shares}
                        onChange={(e) => updateEntry(entry.id, 'shares', e.target.value)}
                        placeholder="股数"
                        min="0"
                        step="any"
                        className="w-24 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                      />
                    </div>
                  </div>
                ))}

                {/* Add more button */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={addEntry}
                    className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-warm-orange hover:text-warm-orange transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    再添加一只{marketInfo.label}
                  </button>
                )}
              </div>

              {/* Liquidity for stocks */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">流动性</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as Liquidity[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLiquidity(l)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                        liquidity === l
                          ? 'bg-sage-green/10 border-sage-green text-sage-green'
                          : 'border-border text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {l === 'high' ? '高' : l === 'medium' ? '中' : '低'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note for stocks */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">备注（可选）</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="补充说明..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                />
              </div>
            </>
          ) : isCrypto ? (
            <>
              {/* Crypto symbol input */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">币种符号</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cryptoSymbol}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCryptoSymbol(val);
                      setCryptoPriceError(null);
                      // Debounce auto-fetch
                      if (cryptoTimer.current) clearTimeout(cryptoTimer.current);
                      if (val.trim().length >= 2) {
                        setCryptoPriceLoading(true);
                        cryptoTimer.current = setTimeout(async () => {
                          try {
                            const input = JSON.stringify({ json: { symbols: [val.trim()] } });
                            const res = await fetch(`/api/trpc/market.getCryptoPrices?input=${encodeURIComponent(input)}`, { credentials: 'include' });
                            const json = await res.json();
                            const data = json?.result?.data?.json;
                            if (data?.prices?.[val.trim()]) {
                              setCryptoPrice(data.prices[val.trim()].price);
                              setCryptoPriceError(null);
                            } else if (data?.errors?.[val.trim()]) {
                              setCryptoPrice(null);
                              setCryptoPriceError(data.errors[val.trim()]);
                            } else {
                              setCryptoPrice(null);
                              setCryptoPriceError('未找到该币种');
                            }
                          } catch {
                            setCryptoPrice(null);
                            setCryptoPriceError('网络错误');
                          } finally {
                            setCryptoPriceLoading(false);
                          }
                        }, 600);
                      } else {
                        setCryptoPrice(null);
                        setCryptoPriceLoading(false);
                      }
                    }}
                    placeholder="BTC / ETH / SOL / DOGE ..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                  />
                  {cryptoPriceLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {/* Price display */}
                {cryptoPrice !== null && (
                  <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-sage-green/5 border border-sage-green/20">
                    <Check className="w-3.5 h-3.5 text-sage-green flex-shrink-0" />
                    <span className="text-xs text-sage-green font-medium">
                      {cryptoSymbol} · USD {cryptoPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {cryptoPriceError && (
                  <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-destructive/5">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    <span className="text-xs text-destructive">{cryptoPriceError}</span>
                  </div>
                )}
              </div>

              {/* Name (optional, defaults to symbol) */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">名称（可选）</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={cryptoSymbol ? `默认: ${cryptoSymbol}` : '如：比特币'}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                />
              </div>

              {/* Amount (number of coins) */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">持有数量</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.5"
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                />
                {cryptoPrice && amount && parseFloat(amount) > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    市值 ≈ USD {(cryptoPrice * parseFloat(amount)).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              {/* Liquidity */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">流动性</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as Liquidity[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLiquidity(l)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                        liquidity === l
                          ? 'bg-sage-green/10 border-sage-green text-sage-green'
                          : 'border-border text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {l === 'high' ? '高' : l === 'medium' ? '中' : '低'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">备注（可选）</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="补充说明..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                />
              </div>
            </>
          ) : (
            <>
              {/* Name for other categories */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：工商银行活期"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">金额</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10000"
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">币种</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Liquidity */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">流动性</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as Liquidity[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLiquidity(l)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                        liquidity === l
                          ? 'bg-sage-green/10 border-sage-green text-sage-green'
                          : 'border-border text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {l === 'high' ? '高' : l === 'medium' ? '中' : '低'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">备注（可选）</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="补充说明..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                />
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit()}
            className="w-full py-2.5 rounded-lg bg-warm-orange text-white font-medium text-sm hover:bg-warm-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isEditing ? '保存修改' : isStock ? `添加 ${entries.filter(e => e.ticker.trim() && e.name.trim() && e.shares).length} 只股票` : '添加资产'}
          </button>
        </form>
      </div>
    </div>
  );
}
