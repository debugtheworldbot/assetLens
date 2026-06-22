import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Loader2, Check, AlertCircle, Trash2, Search } from 'lucide-react';
import { useAssetStore } from '@/store/useAssetStore';
import { usePriceStore } from '@/store/usePriceStore';
import { Asset, Category, Currency, Liquidity, Market, StockAsset, CashAsset, CryptoAsset } from '@/lib/types';
import { CATEGORIES, getDefaultLiquidity } from '@/lib/categories';
import { CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
}

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
  ticker: string;
  shares: string;
  searchStatus: 'idle' | 'searching' | 'found' | 'not_found' | 'error';
  price: number | null;
  priceAsOf: string | null;
  error: string | null;
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

function createEntryFromStockAsset(asset: StockAsset): StockEntry {
  const ticker = asset.symbol.split('.')[0];

  return {
    id: crypto.randomUUID(),
    name: asset.name,
    ticker,
    shares: String(asset.shares),
    searchStatus: asset.lastPrice ? 'found' : 'idle',
    price: asset.lastPrice || null,
    priceAsOf: asset.lastPriceAt || null,
    error: null,
    searchQuery: ticker,
    searchResults: [],
    showDropdown: false,
    isSearching: false,
  };
}

const LIQUIDITY_OPTIONS: { value: Liquidity; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export default function AssetFormModal({ asset, open, onClose }: Props) {
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

  // Stock fields
  const [market, setMarket] = useState<Market>(
    asset?.category === 'stock' ? (asset as StockAsset).market : 'CN'
  );
  const [entries, setEntries] = useState<StockEntry[]>(() => {
    if (asset?.category === 'stock') {
      return [createEntryFromStockAsset(asset as StockAsset)];
    }
    return [createEmptyEntry()];
  });

  const isStock = category === 'stock';
  const isCrypto = category === 'crypto';
  const isEditing = !!asset;
  const marketInfo = MARKETS.find(m => m.value === market)!;

  const searchTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!open) return;

    if (cryptoTimer.current) {
      clearTimeout(cryptoTimer.current);
      cryptoTimer.current = null;
    }

    setCategory(asset?.category || 'cash');
    setName(asset?.name || '');
    setLiquidity(asset?.liquidity || 'high');
    setNote(asset?.note || '');
    setCryptoSymbol(asset?.category === 'crypto' ? (asset as CryptoAsset).symbol : '');
    setCryptoPrice(asset?.category === 'crypto' ? (asset as CryptoAsset).lastPrice || null : null);
    setCryptoPriceLoading(false);
    setCryptoPriceError(null);
    setAmount(asset && asset.category !== 'stock' ? String((asset as CashAsset | CryptoAsset).amount) : '');
    setCurrency(asset?.currency || settings.baseCurrency);
    setMarket(asset?.category === 'stock' ? (asset as StockAsset).market : 'CN');
    setEntries(asset?.category === 'stock' ? [createEntryFromStockAsset(asset as StockAsset)] : [createEmptyEntry()]);
  }, [asset?.id, open, settings.baseCurrency]);

  useEffect(() => {
    if (!isEditing) {
      setLiquidity(getDefaultLiquidity(category));
    }
  }, [category, isEditing]);

  useEffect(() => {
    return () => {
      Object.values(searchTimers.current).forEach(clearTimeout);
    };
  }, []);

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
            name: e.name || data.name || '',
            price: data.price,
            priceAsOf: data.asOf,
            error: null,
          } : e
        ));
      } else if (data?.error) {
        setEntries(prev => prev.map(e =>
          e.id === entryId ? { ...e, searchStatus: 'not_found', error: data.error } : e
        ));
      } else {
        setEntries(prev => prev.map(e =>
          e.id === entryId ? { ...e, searchStatus: 'not_found', error: '未找到该股票' } : e
        ));
      }
    } catch (err: any) {
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, searchStatus: 'error', error: err.message || '获取价格失败' } : e
      ));
    }
  }, [market]);

  const handleSearchInputChange = (entryId: string, value: string) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? {
        ...e,
        searchQuery: value,
        ticker: '',
        name: '',
        searchStatus: 'idle',
        price: null,
        priceAsOf: null,
        error: null,
      } : e
    ));

    if (searchTimers.current[entryId]) {
      clearTimeout(searchTimers.current[entryId]);
    }

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
    fetchPrice(entryId, stock.ticker);
  };

  const handleDirectSearch = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    if (entry.searchStatus === 'found') return;
    if (!entry.searchQuery.trim()) return;

    if (!entry.ticker) {
      const query = entry.searchQuery.trim().toUpperCase();
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, ticker: query, showDropdown: false } : e
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
      e.ticker.trim() && e.shares && parseFloat(e.shares) > 0 && e.name.trim()
    );
  };

  const canSubmit = () => {
    if (isStock) return canSubmitStock();
    if (isCrypto) {
      if (!cryptoSymbol.trim()) return false;
      if (!amount || parseFloat(amount) <= 0) return false;
      return true;
    }
    if (!name.trim()) return false;
    if (!amount || parseFloat(amount) <= 0) return false;
    return true;
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

        if (entry.price) {
          updateStockPrice(fullSymbol, entry.price, entry.priceAsOf || new Date().toISOString());
        }
        if (entry.searchStatus !== 'found') {
          fetchSingle(fullSymbol).catch(() => {});
        }
      }
    } else if (isCrypto) {
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

  // --- Shared sub-components ---

  const LiquidityField = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">流动性</Label>
      <ToggleGroup
        type="single"
        variant="outline"
        value={liquidity}
        onValueChange={(v) => { if (v) setLiquidity(v as Liquidity); }}
        className="w-full"
      >
        {LIQUIDITY_OPTIONS.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            className="flex-1 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary"
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );

  const NoteField = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">备注（可选）</Label>
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="补充说明..."
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg">{isEditing ? '编辑资产' : '新增资产'}</DialogTitle>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[calc(85vh-8rem)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">类别</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={cn(
                      'px-2 py-2 rounded-md text-xs font-medium transition-all border',
                      category === cat.key
                        ? 'border-transparent text-white shadow-sm'
                        : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    style={category === cat.key ? { backgroundColor: cat.color } : {}}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ========== STOCK FIELDS ========== */}
            {isStock ? (
              <>
                {/* Market Select */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">市场</Label>
                  <Select
                    value={market}
                    onValueChange={(v) => {
                      setMarket(v as Market);
                      if (!isEditing) setEntries([createEmptyEntry()]);
                    }}
                    disabled={isEditing}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETS.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label} ({m.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock Entries */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">股票列表</Label>

                  {entries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-input bg-muted/30 p-3 space-y-2.5">
                      {/* Search input */}
                      <div className="flex gap-2 items-center">
                        <div
                          ref={(el) => { dropdownRefs.current[entry.id] = el; }}
                          className="relative flex-1"
                        >
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          <Input
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
                              setTimeout(() => handleDirectSearch(entry.id), 200);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleDirectSearch(entry.id);
                              }
                            }}
                            placeholder={marketInfo.placeholder}
                            className="pl-8 pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
                            {entry.isSearching ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              marketInfo.suffix
                            )}
                          </span>

                          {/* Search dropdown */}
                          {entry.showDropdown && entry.searchResults.length > 0 && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                              {entry.searchResults.map((result) => (
                                <button
                                  key={result.ticker}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectStock(entry.id, result);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 border-b border-border/50 last:border-0"
                                >
                                  <Badge variant="outline" className="font-mono text-[11px] shrink-0">
                                    {result.ticker}
                                  </Badge>
                                  <span className="text-sm truncate flex-1">
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => removeEntry(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Status indicators */}
                      {entry.searchStatus === 'searching' && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">正在获取 {entry.ticker}{marketInfo.suffix} 的价格...</span>
                        </div>
                      )}

                      {entry.searchStatus === 'found' && (
                        <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="text-xs font-medium text-foreground truncate">
                              {entry.ticker}{marketInfo.suffix} · {entry.name}
                            </span>
                            <span className="text-xs text-primary font-mono ml-auto flex-shrink-0">
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

                      {(entry.searchStatus === 'not_found' || entry.searchStatus === 'error') && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/5 border border-destructive/20">
                          <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                          <span className="text-xs text-destructive">{entry.error || '未找到该股票'}</span>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="ml-auto h-auto p-0 text-xs"
                            onClick={() => fetchPrice(entry.id, entry.ticker || entry.searchQuery)}
                          >
                            重试
                          </Button>
                        </div>
                      )}

                      {/* Name + Shares */}
                      <div className="flex gap-2 items-center">
                        <Input
                          value={entry.name}
                          onChange={(e) => updateEntry(entry.id, 'name', e.target.value)}
                          placeholder="名称（选择后自动填充）"
                          className={cn(
                            "flex-1",
                            entry.searchStatus === 'found' && 'border-primary/30'
                          )}
                        />
                        <Input
                          type="number"
                          value={entry.shares}
                          onChange={(e) => updateEntry(entry.id, 'shares', e.target.value)}
                          placeholder="股数"
                          min="0"
                          step="any"
                          className="w-24"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add more button */}
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed text-muted-foreground hover:text-foreground"
                      onClick={addEntry}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      再添加一只{marketInfo.label}
                    </Button>
                  )}
                </div>

                <LiquidityField />
                <NoteField />
              </>
            ) : isCrypto ? (
              <>
                {/* Crypto Symbol */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">币种符号</Label>
                  <div className="relative">
                    <Input
                      value={cryptoSymbol}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setCryptoSymbol(val);
                        setCryptoPriceError(null);
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
                      className="font-mono uppercase pr-10"
                    />
                    {cryptoPriceLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {cryptoPrice !== null && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/20">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-xs text-primary font-medium">
                        {cryptoSymbol} · USD {cryptoPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {cryptoPriceError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/5 border border-destructive/20">
                      <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                      <span className="text-xs text-destructive">{cryptoPriceError}</span>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">名称（可选）</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={cryptoSymbol ? `默认: ${cryptoSymbol}` : '如：比特币'}
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">持有数量</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.5"
                    min="0"
                    step="any"
                  />
                  {cryptoPrice && amount && parseFloat(amount) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      市值 ≈ USD {(cryptoPrice * parseFloat(amount)).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <LiquidityField />
                <NoteField />
              </>
            ) : (
              <>
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">名称</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="如：工商银行活期"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">金额</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10000"
                    min="0"
                    step="any"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">币种</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <LiquidityField />
                <NoteField />
              </>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={!canSubmit()}
              className="w-full"
              size="lg"
            >
              {isEditing ? '保存修改' : isStock ? `添加 ${entries.filter(e => e.ticker.trim() && e.name.trim() && e.shares).length} 只股票` : '添加资产'}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
