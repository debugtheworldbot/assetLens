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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

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
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-xl font-semibold text-foreground">资产列表</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{assets.length} 项资产</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          新增
        </Button>
      </motion.div>

      {/* Category Bar Chart */}
      {categorySummaries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card>
            <CardContent className="pt-4">
              <CategoryBar data={categorySummaries} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索资产名称或代码..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
            className="h-8 text-xs rounded-full px-3"
          >
            全部
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.key}
              variant={filterCategory === cat.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(cat.key)}
              className="h-8 text-xs rounded-full px-3 whitespace-nowrap"
              style={filterCategory === cat.key ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Asset List */}
      {filteredAssets.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-muted-foreground text-sm">
            {assets.length === 0 ? '还没有资产，点击上方"新增"开始记录' : '没有匹配的资产'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredAssets.map((asset, index) => {
              const valueInOriginal = getAssetValueInOriginalCurrency(asset, priceCache);
              const valueInBase = getAssetValueInBaseCurrency(asset, settings.baseCurrency, rates, priceCache);
              const isStock = asset.category === 'stock';
              const stockAsset = isStock ? (asset as StockAsset) : null;
              const hasError = isStock && stockAsset?.pricingError;

              return (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                >
                  <Card className="hover:shadow-md transition-shadow duration-200 group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Category dot */}
                        <div
                          className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                          style={{
                            backgroundColor: isStock
                              ? (stockColorMap[asset.id] || getCategoryColor(asset.category))
                              : getCategoryColor(asset.category),
                          }}
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-foreground truncate">{asset.name}</h3>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                              {getCategoryLabel(asset.category)}
                            </Badge>
                          </div>

                          {isStock && stockAsset ? (
                            <div className="mt-1">
                              <p className="text-xs text-muted-foreground font-mono">
                                {stockAsset.symbol} · {stockAsset.shares} 股
                                {stockAsset.lastPrice && (
                                  <> × {formatCurrency(stockAsset.lastPrice, stockAsset.currency)}</>
                                )}
                              </p>
                              {hasError && (
                                <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
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
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              {formatCurrency(valueInOriginal, asset.currency)}
                            </p>
                          )}

                          {/* Tags */}
                          <div className="mt-2 flex items-center gap-1 flex-wrap">
                            {asset.tags && asset.tags.length > 0 ? (
                              asset.tags.map(tag => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-4 font-normal border-primary/20 text-primary/80"
                                >
                                  {tag}
                                </Badge>
                              ))
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTagsId(editingTagsId === asset.id ? null : asset.id)}
                              className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-primary"
                            >
                              <Tag className="w-2.5 h-2.5 mr-0.5" />
                              {asset.tags && asset.tags.length > 0 ? '编辑' : '标签'}
                            </Button>
                          </div>

                          {/* Inline Tag Editor */}
                          <AnimatePresence>
                            {editingTagsId === asset.id && (
                              <motion.div
                                className="mt-2"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <TagEditor
                                  tags={asset.tags || []}
                                  onChange={(tags) => updateAssetTags(asset.id, tags)}
                                  suggestions={allTags}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Value */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-foreground font-mono tabular-nums">
                            {formatCurrency(valueInBase, settings.baseCurrency, true)}
                          </p>
                          {asset.currency !== settings.baseCurrency && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                              ({formatCurrency(valueInOriginal, asset.currency, true)})
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(asset)}
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Asset Form Modal */}
      <AssetFormModal
        open={showForm}
        asset={editingAsset}
        onClose={handleCloseForm}
      />
    </div>
  );
}
