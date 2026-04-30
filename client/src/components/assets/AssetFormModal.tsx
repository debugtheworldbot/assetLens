import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAssetStore } from '@/store/useAssetStore';
import { usePriceStore } from '@/store/usePriceStore';
import { Asset, Category, Currency, Liquidity, StockAsset, CashAsset } from '@/lib/types';
import { CATEGORIES, getDefaultLiquidity } from '@/lib/categories';
import { CURRENCIES } from '@/lib/currencies';
import { parseSymbol, getMarketLabel } from '@/lib/stockPrice';
import { cn } from '@/lib/utils';

interface Props {
  asset: Asset | null;
  onClose: () => void;
}

export default function AssetFormModal({ asset, onClose }: Props) {
  const addAsset = useAssetStore((s) => s.addAsset);
  const updateAsset = useAssetStore((s) => s.updateAsset);
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

  // Stock fields
  const [symbol, setSymbol] = useState<string>(
    asset?.category === 'stock' ? (asset as StockAsset).symbol : ''
  );
  const [shares, setShares] = useState<string>(
    asset?.category === 'stock' ? String((asset as StockAsset).shares) : ''
  );
  const [symbolValid, setSymbolValid] = useState<boolean>(true);
  const [symbolMarketLabel, setSymbolMarketLabel] = useState<string>('');

  const isStock = category === 'stock';
  const isEditing = !!asset;

  useEffect(() => {
    if (!isEditing) {
      setLiquidity(getDefaultLiquidity(category));
    }
  }, [category, isEditing]);

  useEffect(() => {
    if (isStock && symbol) {
      const parsed = parseSymbol(symbol);
      if (parsed) {
        setSymbolValid(true);
        setSymbolMarketLabel(getMarketLabel(parsed.market));
        setCurrency(parsed.currency);
      } else {
        setSymbolValid(symbol.length < 3); // Don't show error for short input
        setSymbolMarketLabel('');
      }
    }
  }, [symbol, isStock]);

  const canSubmit = () => {
    if (!name.trim()) return false;
    if (isStock) {
      if (!symbol || !parseSymbol(symbol)) return false;
      if (!shares || parseFloat(shares) <= 0) return false;
    } else {
      if (!amount || parseFloat(amount) <= 0) return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;

    if (isStock) {
      const parsed = parseSymbol(symbol)!;
      const assetData: Omit<StockAsset, 'id' | 'createdAt' | 'updatedAt'> = {
        category: 'stock',
        name: name.trim(),
        symbol: parsed.symbol,
        market: parsed.market,
        shares: parseFloat(shares),
        currency: parsed.currency,
        liquidity,
        note: note.trim() || undefined,
      };

      if (isEditing) {
        updateAsset(asset!.id, assetData);
      } else {
        addAsset(assetData);
      }
      // Fetch price for this symbol
      fetchSingle(parsed.symbol);
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
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isStock ? '如：苹果公司' : '如：工商银行活期'}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
            />
          </div>

          {/* Stock fields */}
          {isStock ? (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  股票代码
                  {symbolMarketLabel && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-sage-green/10 text-sage-green text-[10px]">
                      {symbolMarketLabel}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="如 AAPL.US / 0700.HK / 600519.CN"
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2',
                    !symbolValid
                      ? 'border-destructive focus:ring-destructive/30'
                      : 'border-border focus:ring-warm-orange/30'
                  )}
                />
                {!symbolValid && symbol.length >= 3 && (
                  <p className="text-xs text-destructive mt-1">请输入正确格式：代码.市场（如 AAPL.US）</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">持有股数</label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="100"
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">币种（自动）</label>
                <input
                  type="text"
                  value={currency}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground"
                />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}

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

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit()}
            className="w-full py-2.5 rounded-lg bg-warm-orange text-white font-medium text-sm hover:bg-warm-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isEditing ? '保存修改' : '添加资产'}
          </button>
        </form>
      </div>
    </div>
  );
}
