import { useState, useMemo } from 'react';
import { useAssetStore } from '@/store/useAssetStore';
import { useFxStore } from '@/store/useFxStore';
import { usePriceCache } from '@/hooks/usePriceCache';
import { getAssetValueInBaseCurrency, getAssetValueInOriginalCurrency } from '@/lib/assetValue';
import { getCategorySummaries } from '@/lib/analytics';
import { formatCurrency, formatTimeAgo } from '@/lib/format';
import { getCategoryLabel, getCategoryColor, CATEGORIES } from '@/lib/categories';
import { Asset, Category, StockAsset } from '@/lib/types';
import { Plus, Search, Pencil, Trash2, AlertTriangle, Tag, Wallet } from 'lucide-react';
import TagEditor from '@/components/assets/TagEditor';
import { assignStockColors } from '@/lib/stockColors';
import AssetFormModal from '@/components/assets/AssetFormModal';
import CategoryBar from '@/components/charts/CategoryBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type AssetFilter = Category | 'all' | 'stock-cn' | 'stock-us' | 'stock-hk' | 'stock-etf';
type ValueSort = 'none' | 'desc' | 'asc';

const STOCK_FILTERS: { key: AssetFilter; label: string }[] = [
  { key: 'stock-cn', label: 'A股' },
  { key: 'stock-us', label: '美股' },
  { key: 'stock-hk', label: '港股' },
  { key: 'stock-etf', label: 'ETF' },
];

function matchesFilter(asset: Asset, filter: AssetFilter) {
  if (filter === 'all') return true;
  if (filter === 'stock-cn') return asset.category === 'stock' && asset.market === 'CN';
  if (filter === 'stock-us') return asset.category === 'stock' && asset.market === 'US';
  if (filter === 'stock-hk') return asset.category === 'stock' && asset.market === 'HK';
  if (filter === 'stock-etf') {
    return asset.category === 'stock' && /etf/i.test(`${asset.name} ${asset.symbol}`);
  }
  return asset.category === filter;
}

export default function Assets() {
  const assets = useAssetStore((s) => s.assets);
  const settings = useAssetStore((s) => s.settings);
  const deleteAsset = useAssetStore((s) => s.deleteAsset);
  const rates = useFxStore((s) => s.rates);
  const priceCache = usePriceCache();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<AssetFilter>('all');
  const [valueSort, setValueSort] = useState<ValueSort>('none');
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const updateAssetTags = useAssetStore((s) => s.updateAssetTags);

  const filteredAssets = useMemo(() => {
    const filtered = assets.filter((a) => {
      if (!matchesFilter(a, filterCategory)) return false;
      if (!search) return true;

      const q = search.toLowerCase();
      const nameMatch = a.name.toLowerCase().includes(q);
      const symbolMatch = a.category === 'stock' && (a as StockAsset).symbol.toLowerCase().includes(q);
      return nameMatch || symbolMatch;
    });

    if (valueSort === 'none') return filtered;

    return [...filtered].sort((a, b) => {
      const valueA = getAssetValueInBaseCurrency(a, settings.baseCurrency, rates, priceCache);
      const valueB = getAssetValueInBaseCurrency(b, settings.baseCurrency, rates, priceCache);
      return valueSort === 'desc' ? valueB - valueA : valueA - valueB;
    });
  }, [assets, filterCategory, priceCache, rates, search, settings.baseCurrency, valueSort]);

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

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteAsset(deleteTarget.id);
      setDeleteTarget(null);
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
        <div>
          <h1 className="text-xl font-semibold">资产列表</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{assets.length} 项资产</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          新增
        </Button>
      </div>

      {/* Category Bar Chart */}
      {categorySummaries.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <CategoryBar data={categorySummaries} />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索资产名称或代码..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
          >
            全部
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.key}
              variant={filterCategory === cat.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(cat.key)}
              className="whitespace-nowrap"
            >
              {cat.label}
            </Button>
          ))}
          {STOCK_FILTERS.map((filter) => (
            <Button
              key={filter.key}
              variant={filterCategory === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(filter.key)}
              className="whitespace-nowrap"
            >
              {filter.label}
            </Button>
          ))}
          <Button
            variant={valueSort === 'desc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setValueSort(valueSort === 'desc' ? 'none' : 'desc')}
            className="whitespace-nowrap"
          >
            金额↓
          </Button>
          <Button
            variant={valueSort === 'asc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setValueSort(valueSort === 'asc' ? 'none' : 'asc')}
            className="whitespace-nowrap"
          >
            金额↑
          </Button>
        </div>
      </div>

      {/* Asset List */}
      {filteredAssets.length === 0 ? (
        <Empty className="py-16 border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet />
            </EmptyMedia>
            <EmptyTitle className="text-sm">
              {assets.length === 0 ? '还没有资产' : '没有匹配的资产'}
            </EmptyTitle>
            <EmptyDescription>
              {assets.length === 0
                ? '点击上方"新增"按钮开始记录你的资产'
                : '尝试调整搜索关键词或筛选条件'}
            </EmptyDescription>
          </EmptyHeader>
          {assets.length === 0 && (
            <EmptyContent>
              <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                添加第一笔资产
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAssets.map((asset) => {
            const valueInOriginal = getAssetValueInOriginalCurrency(asset, priceCache);
            const valueInBase = getAssetValueInBaseCurrency(asset, settings.baseCurrency, rates, priceCache);
            const isStock = asset.category === 'stock';
            const stockAsset = isStock ? (asset as StockAsset) : null;
            const hasError = isStock && stockAsset?.pricingError;

            return (
              <Card key={asset.id} className="group h-full">
                <CardContent className="p-3.5">
                  <div className="flex items-start gap-2.5">
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
                        <h3 className="text-sm font-medium truncate">{asset.name}</h3>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                          {getCategoryLabel(asset.category)}
                        </Badge>
                      </div>

                      {isStock && stockAsset ? (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {stockAsset.symbol} · {stockAsset.shares} 股
                            {stockAsset.lastPrice && (
                              <> × {formatCurrency(stockAsset.lastPrice, stockAsset.currency)}</>
                            )}
                          </p>
                          {hasError && (
                            <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="h-3 w-3" /> 无法获取报价
                            </p>
                          )}
                          {stockAsset.lastPriceAt && !hasError && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              价格更新: {formatTimeAgo(stockAsset.lastPriceAt)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
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
                              className="text-[10px] px-1.5 py-0 h-4 font-normal"
                            >
                              {tag}
                            </Badge>
                          ))
                        ) : null}
                        <Collapsible
                          open={editingTagsId === asset.id}
                          onOpenChange={(open) => setEditingTagsId(open ? asset.id : null)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 text-[10px] text-muted-foreground"
                            >
                              <Tag className="h-2.5 w-2.5 mr-0.5" />
                              {asset.tags && asset.tags.length > 0 ? '编辑' : '标签'}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <TagEditor
                              tags={asset.tags || []}
                              onChange={(tags) => updateAssetTags(asset.id, tags)}
                              suggestions={allTags}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right flex-shrink-0 max-w-[7rem]">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(valueInBase, settings.baseCurrency, true)}
                      </p>
                      {asset.currency !== settings.baseCurrency && (
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          ({formatCurrency(valueInOriginal, asset.currency, true)})
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(asset)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">编辑</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDeleteTarget({ id: asset.id, name: asset.name })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">删除</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteTarget?.name}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Asset Form Modal */}
      <AssetFormModal
        open={showForm}
        asset={editingAsset}
        onClose={handleCloseForm}
      />
    </div>
  );
}
