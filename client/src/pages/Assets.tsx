import { useState, useMemo } from 'react';
import { useAssetStore } from '@/store/useAssetStore';
import { useFxStore } from '@/store/useFxStore';
import { usePriceStore } from '@/store/usePriceStore';
import { usePriceCache } from '@/hooks/usePriceCache';
import { getAssetValueInBaseCurrency, getAssetValueInOriginalCurrency } from '@/lib/assetValue';
import { getCategorySummaries } from '@/lib/analytics';
import { formatCurrency, formatTimeAgo } from '@/lib/format';
import { getCategoryLabel, getCategoryColor, CATEGORIES } from '@/lib/categories';
import { Asset, Category, StockAsset } from '@/lib/types';
import { Plus, Search, Pencil, Trash2, AlertTriangle, Tag } from 'lucide-react';
import TagEditor from '@/components/assets/TagEditor';
import { assignStockColors } from '@/lib/stockColors';
import { cn } from '@/lib/utils';
import AssetFormModal from '@/components/assets/AssetFormModal';
import CategoryBar from '@/components/charts/CategoryBar';

export default function Assets() {
  const assets = useAssetStore((s) => s.assets);
  const settings = useAssetStore((s) => s.settings);
  const deleteAsset = useAssetStore((s) => s.deleteAsset);
  const rates = useFxStore((s) => s.rates);
  const priceCache = usePriceCache();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const updateAssetTags = useAssetStore((s) => s.updateAssetTags);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (filterCategory !== 'all' && a.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = a.name.toLowerCase().includes(q);
        const symbolMatch = a.category === 'stock' && (a as StockAsset).symbol.toLowerCase().includes(q);
        if (!nameMatch && !symbolMatch) return false;
      }
      return true;
    });
  }, [assets, filterCategory, search]);

  const categorySummaries = getCategorySummaries(assets, settings.baseCurrency, rates, priceCache);
  const stockColorMap = useMemo(() => assignStockColors(assets), [assets]);

  // Collect all unique tags for suggestions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    assets.forEach(a => a.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [assets]);

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这项资产吗？')) {
      deleteAsset(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAsset(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">资产列表</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-warm-orange text-white rounded-lg font-medium text-sm hover:bg-warm-orange/90 transition-colors shadow-sm shadow-warm-orange/20"
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </div>

      {/* Category Bar Chart */}
      {categorySummaries.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <CategoryBar data={categorySummaries} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索资产名称或代码..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              filterCategory === 'all'
                ? 'bg-warm-orange text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                filterCategory === cat.key
                  ? 'text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
              style={filterCategory === cat.key ? { backgroundColor: cat.color } : {}}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset List */}
      {filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground text-sm">
            {assets.length === 0 ? '还没有资产，点击上方"新增"开始记录' : '没有匹配的资产'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => {
            const valueInOriginal = getAssetValueInOriginalCurrency(asset, priceCache);
            const valueInBase = getAssetValueInBaseCurrency(asset, settings.baseCurrency, rates, priceCache);
            const isStock = asset.category === 'stock';
            const stockAsset = isStock ? (asset as StockAsset) : null;
            const hasError = isStock && stockAsset?.pricingError;

            return (
              <div
                key={asset.id}
                className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Category dot - use stock-specific color for stocks */}
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: isStock ? (stockColorMap[asset.id] || getCategoryColor(asset.category)) : getCategoryColor(asset.category) }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">{asset.name}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {getCategoryLabel(asset.category)}
                      </span>
                    </div>

                    {isStock && stockAsset ? (
                      <div className="mt-1">
                        <p className="text-xs text-muted-foreground">
                          {stockAsset.symbol} · {stockAsset.shares} 股
                          {stockAsset.lastPrice && (
                            <> × {formatCurrency(stockAsset.lastPrice, stockAsset.currency)}</>
                          )}
                        </p>
                        {hasError && (
                          <p className="text-xs text-warm-orange flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> 无法获取报价
                          </p>
                        )}
                        {stockAsset.lastPriceAt && !hasError && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            价格更新: {formatTimeAgo(stockAsset.lastPriceAt)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(valueInOriginal, asset.currency)}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                      {asset.tags && asset.tags.length > 0 ? (
                        asset.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-warm-orange/10 text-warm-orange border border-warm-orange/20"
                          >
                            {tag}
                          </span>
                        ))
                      ) : null}
                      <button
                        onClick={() => setEditingTagsId(editingTagsId === asset.id ? null : asset.id)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] text-muted-foreground hover:text-warm-orange hover:bg-warm-orange/5 transition-colors"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {asset.tags && asset.tags.length > 0 ? '编辑' : '添加标签'}
                      </button>
                    </div>

                    {/* Inline Tag Editor */}
                    {editingTagsId === asset.id && (
                      <div className="mt-2">
                        <TagEditor
                          tags={asset.tags || []}
                          onChange={(tags) => updateAssetTags(asset.id, tags)}
                          suggestions={allTags}
                        />
                      </div>
                    )}
                  </div>

                  {/* Value */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-foreground font-mono">
                      {formatCurrency(valueInBase, settings.baseCurrency, true)}
                    </p>
                    {asset.currency !== settings.baseCurrency && (
                      <p className="text-[10px] text-muted-foreground">
                        ({formatCurrency(valueInOriginal, asset.currency, true)})
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Form Modal */}
      {showForm && (
        <AssetFormModal
          asset={editingAsset}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
