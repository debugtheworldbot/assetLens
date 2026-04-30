import { useRef, useState } from 'react';
import { useAssetStore } from '@/store/useAssetStore';
import { useFxStore } from '@/store/useFxStore';
import { usePriceStore } from '@/store/usePriceStore';
import { CURRENCIES } from '@/lib/currencies';
import { Currency } from '@/lib/types';
import { exportData, downloadJson, readJsonFile, validateImportData } from '@/lib/importExport';
import { Download, Upload, Trash2, Globe, Shield, Database } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Settings() {
  const settings = useAssetStore((s) => s.settings);
  const setBaseCurrency = useAssetStore((s) => s.setBaseCurrency);
  const setRiskLevel = useAssetStore((s) => s.setRiskLevel);
  const importState = useAssetStore((s) => s.importState);
  const getExportState = useAssetStore((s) => s.getExportState);
  const clearAll = useAssetStore((s) => s.clearAll);
  const assets = useAssetStore((s) => s.assets);
  const fxRefresh = useFxStore((s) => s.refresh);
  const priceRefresh = usePriceStore((s) => s.refresh);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const riskLabels = ['', '保守', '稳健', '平衡', '积极', '激进'];

  const handleExport = () => {
    const state = getExportState();
    const json = exportData(state);
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(json, `assetlens-backup-${date}.json`);
    toast.success('导出成功');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await readJsonFile(file);
      const result = validateImportData(data);

      if (!result.valid) {
        toast.error(`导入失败: ${result.error}`);
        return;
      }

      const confirmed = confirm(
        `将替换当前 ${assets.length} 条资产为导入的 ${result.state!.assets.length} 条资产，是否继续？`
      );

      if (!confirmed) return;

      importState(result.state!);
      toast.success('导入成功');

      // Refresh rates and prices
      setTimeout(() => {
        fxRefresh();
        priceRefresh();
      }, 500);
    } catch (err: any) {
      toast.error(`导入失败: ${err.message || '未知错误'}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    const confirmed = confirm('确定要清空所有数据吗？此操作不可恢复！');
    if (confirmed) {
      clearAll();
      toast.success('数据已清空');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理你的偏好和数据</p>
      </div>

      {/* Base Currency */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-sage-green" />
          <h3 className="text-sm font-semibold text-foreground">基准币种</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">所有资产将换算为此币种显示总计</p>
        <select
          value={settings.baseCurrency}
          onChange={(e) => setBaseCurrency(e.target.value as Currency)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {/* Risk Level */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-sage-green" />
          <h3 className="text-sm font-semibold text-foreground">风险等级</h3>
          <span className="ml-auto text-sm font-bold text-warm-orange">
            R{settings.riskLevel} · {riskLabels[settings.riskLevel]}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          value={settings.riskLevel}
          onChange={(e) => setRiskLevel(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #5b9b7d, #d4a559, #e57c5a)`,
          }}
        />
        <div className="flex justify-between mt-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <span
              key={level}
              className={cn(
                'text-[10px] font-medium',
                settings.riskLevel === level ? 'text-warm-orange' : 'text-muted-foreground'
              )}
            >
              R{level} {riskLabels[level]}
            </span>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-sage-green" />
          <h3 className="text-sm font-semibold text-foreground">数据管理</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          数据仅存储在浏览器本地，建议定期导出备份
        </p>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4 text-sage-green" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">导出数据</p>
              <p className="text-xs text-muted-foreground">下载 JSON 备份文件</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-sand-gold" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">导入数据</p>
              <p className="text-xs text-muted-foreground">从 JSON 文件恢复</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <button
            onClick={handleClear}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-destructive/30 hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
            <div className="text-left">
              <p className="text-sm font-medium text-destructive">清空数据</p>
              <p className="text-xs text-muted-foreground">删除所有资产和设置</p>
            </div>
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-2">关于</h3>
        <p className="text-xs text-muted-foreground">
          AssetLens v1.0 · 看懂你的资产，守住你的风险
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          数据完全存储在本地浏览器，不上传任何服务器
        </p>
      </div>
    </div>
  );
}
