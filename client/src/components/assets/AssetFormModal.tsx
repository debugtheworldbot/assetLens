import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Loader2, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useAssetStore } from '@/store/useAssetStore';
import { usePriceStore } from '@/store/usePriceStore';
import { Asset, Category, Currency, Liquidity, Market, StockAsset, CashAsset } from '@/lib/types';
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
  { value: 'CN', label: 'A股', suffix: '.CN', placeholder: '如 600519、000001', currency: 'CNY' },
  { value: 'HK', label: '港股', suffix: '.HK', placeholder: '如 00700、09988', currency: 'HKD' },
  { value: 'US', label: '美股', suffix: '.US', placeholder: '如 AAPL、TSLA', currency: 'USD' },
];

interface StockEntry {
  id: string;
  name: string;
  ticker: string; // raw ticker without market suffix
  shares: string;
  priceStatus: 'idle' | 'loading' | 'success' | 'error';
  price: number | null;
  priceAsOf: string | null;
  error: string | null;
}

function createEmptyEntry(): StockEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    ticker: '',
    shares: '',
    priceStatus: 'idle',
    price: null,
    priceAsOf: null,
    error: null,
  };
}

export default function AssetFormModal({ asset, onClose }: Props) {
  const addAsset = useAssetStore((s) => s.addAsset);
  const updateAsset = useAssetStore((s) => s.updateAsset);
  const updateStockPrice = useAssetStore((s) => s.updateStockPrice);
  const settings = useAssetStore((s) => s.settings);
  const fetchSingle = usePriceStore((s) => s.fetchSingle);

  const [category, setCategory] = useState<Category>(asset?.category || 'cash');
  const [name, setName] = useState(asset?.name || '');
  const [liquidity, setLiquidity] = useState<Liquidity>(asset?.liquidity || 'high');
  const [note, setNote] = useState(asset?.note || '');

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
        priceStatus: sa.lastPrice ? 'success' : 'idle',
        price: sa.lastPrice || null,
        priceAsOf: sa.lastPriceAt || null,
        error: null,
      }];
    }
    return [createEmptyEntry()];
  });

  const isStock = category === 'stock';
  const isEditing = !!asset;

  const marketInfo = MARKETS.find(m => m.value === market)!;

  useEffect(() => {
    if (!isEditing) {
      setLiquidity(getDefaultLiquidity(category));
    }
  }, [category, isEditing]);

  // Fetch price for a single entry immediately after ticker + shares are filled
  const fetchPriceForEntry = useCallback(async (entryId: string, ticker: string) => {
    const fullSymbol = `${ticker.toUpperCase()}.${market}`;
    
    setEntries(prev => prev.map(e => 
      e.id === entryId ? { ...e, priceStatus: 'loading', error: null } : e
    ));

    try {
      const input = JSON.stringify({ json: { symbols: [fullSymbol] } });
      const res = await fetch(`/api/trpc/market.getStockPrices?input=${encodeURIComponent(input)}`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const json = await res.json();
      const data = json?.result?.data?.json;
      
      if (data?.prices?.[fullSymbol]) {
        const priceData = data.prices[fullSymbol];
        setEntries(prev => prev.map(e => 
          e.id === entryId ? { 
            ...e, 
            priceStatus: 'success', 
            price: priceData.price, 
            priceAsOf: priceData.asOf,
            error: null 
          } : e
        ));
      } else if (data?.errors?.[fullSymbol]) {
        setEntries(prev => prev.map(e => 
          e.id === entryId ? { 
            ...e, 
            priceStatus: 'error', 
            error: data.errors[fullSymbol] 
          } : e
        ));
      } else {
        setEntries(prev => prev.map(e => 
          e.id === entryId ? { ...e, priceStatus: 'error', error: '未找到报价' } : e
        ));
      }
    } catch (err: any) {
      setEntries(prev => prev.map(e => 
        e.id === entryId ? { 
          ...e, 
          priceStatus: 'error', 
          error: err.message || '获取失败' 
        } : e
      ));
    }
  }, [market]);

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

  // Handle "confirm" for a single stock entry - fetches price immediately
  const confirmEntry = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || !entry.ticker.trim()) return;
    fetchPriceForEntry(id, entry.ticker.trim());
  };

  // Auto-fetch price when ticker input loses focus (blur)
  const handleTickerBlur = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || !entry.ticker.trim()) return;
    // Only auto-fetch if we haven't fetched yet
    if (entry.priceStatus === 'idle' || entry.priceStatus === 'error') {
      fetchPriceForEntry(id, entry.ticker.trim());
    }
  };

  const canSubmitStock = () => {
    // At least one entry must have ticker and shares filled
    return entries.some(e => 
      e.ticker.trim() && 
      e.shares && 
      parseFloat(e.shares) > 0 &&
      e.name.trim()
    );
  };

  const canSubmit = () => {
    if (isStock) {
      return canSubmitStock();
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
      // Add all valid entries as separate assets
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
          pricingError: entry.priceStatus !== 'success',
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
        if (entry.priceStatus !== 'success') {
          fetchSingle(fullSymbol).catch(() => {});
        }
      }
    } else {
      const assetData: Omit<CashAsset, 'id' | 'createdAt' | 'updatedAt'> = {
        category,
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

          {/* Stock fields - new multi-stock UI */}
          {isStock ? (
            <>
              {/* Market dropdown */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">市场</label>
                <select
                  value={market}
                  onChange={(e) => {
                    setMarket(e.target.value as Market);
                    // Reset entries when market changes (prices are market-specific)
                    if (!isEditing) {
                      setEntries(prev => prev.map(entry => ({
                        ...entry,
                        priceStatus: 'idle' as const,
                        price: null,
                        priceAsOf: null,
                        error: null,
                      })));
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
                  {!isEditing && (
                    <span className="ml-1 text-[10px] text-muted-foreground/60">
                      添加后自动获取价格
                    </span>
                  )}
                </label>

                {entries.map((entry, idx) => (
                  <div key={entry.id} className="rounded-xl border border-border bg-accent/30 p-3 space-y-2">
                    {/* Row 1: Name + Remove */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={entry.name}
                        onChange={(e) => updateEntry(entry.id, 'name', e.target.value)}
                        placeholder="名称（如：贵州茅台）"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                      />
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

                    {/* Row 2: Ticker + Shares + Fetch button */}
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={entry.ticker}
                          onChange={(e) => updateEntry(entry.id, 'ticker', e.target.value.toUpperCase())}
                          onBlur={() => handleTickerBlur(entry.id)}
                          placeholder={marketInfo.placeholder}
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-warm-orange/30 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                          {marketInfo.suffix}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={entry.shares}
                        onChange={(e) => updateEntry(entry.id, 'shares', e.target.value)}
                        placeholder="股数"
                        min="0"
                        step="any"
                        className="w-20 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                      />
                      <button
                        type="button"
                        onClick={() => confirmEntry(entry.id)}
                        disabled={!entry.ticker.trim() || entry.priceStatus === 'loading'}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap',
                          entry.priceStatus === 'success'
                            ? 'bg-sage-green/10 border-sage-green text-sage-green'
                            : entry.priceStatus === 'loading'
                            ? 'bg-muted border-border text-muted-foreground'
                            : 'bg-warm-orange/10 border-warm-orange text-warm-orange hover:bg-warm-orange/20'
                        )}
                      >
                        {entry.priceStatus === 'loading' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : entry.priceStatus === 'success' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          '获取'
                        )}
                      </button>
                    </div>

                    {/* Price result */}
                    {entry.priceStatus === 'success' && entry.price && (
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-sage-green/5">
                        <Check className="w-3.5 h-3.5 text-sage-green" />
                        <span className="text-xs text-sage-green font-medium font-mono">
                          {marketInfo.currency} {entry.price.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                        </span>
                        {entry.shares && parseFloat(entry.shares) > 0 && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            市值 ≈ {marketInfo.currency} {(entry.price * parseFloat(entry.shares)).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                          </span>
                        )}
                      </div>
                    )}
                    {entry.priceStatus === 'error' && (
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-destructive/5">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                        <span className="text-xs text-destructive">{entry.error || '获取失败'}</span>
                      </div>
                    )}
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
          ) : (
            <>
              {/* Name for non-stock */}
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
