import { useRef, useState } from 'react';
import { useAssetStore } from '@/store/useAssetStore';
import { useFxStore } from '@/store/useFxStore';
import { usePriceStore } from '@/store/usePriceStore';
import { CURRENCIES } from '@/lib/currencies';
import { Currency } from '@/lib/types';
import { exportData, downloadJson, readJsonFile, validateImportData } from '@/lib/importExport';
import { Download, Upload, Trash2, Globe, Shield, Database, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

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
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<{ count: number; state: any } | null>(null);

  const riskLabels = ['', '保守', '稳健', '平衡', '积极', '激进'];

  const handleExport = () => {
    const state = getExportState();
    const json = exportData(state);
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(json, `assetlens-backup-${date}.json`);
    toast.success('导出成功');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setImportPreview({ count: result.state!.assets.length, state: result.state });
      setShowImportDialog(true);
    } catch (err: any) {
      toast.error(`导入失败: ${err.message || '未知错误'}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = () => {
    if (importPreview?.state) {
      importState(importPreview.state);
      toast.success('导入成功');
      setTimeout(() => {
        fxRefresh();
        priceRefresh();
      }, 500);
    }
    setShowImportDialog(false);
    setImportPreview(null);
  };

  const handleClearConfirm = () => {
    clearAll();
    toast.success('数据已清空');
    setShowClearDialog(false);
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-5 pb-20 md:pb-6"
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
        <h1 className="text-xl font-semibold text-foreground">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理你的偏好和数据</p>
      </motion.div>

      {/* Base Currency */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-4 h-4 text-sage-green" />
              基准币种
            </CardTitle>
            <CardDescription className="text-xs">
              所有资产将换算为此币种显示总计
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.baseCurrency}
              onValueChange={(val) => setBaseCurrency(val as Currency)}
            >
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Risk Level */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-sage-green" />
                风险等级
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                R{settings.riskLevel} · {riskLabels[settings.riskLevel]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={[settings.riskLevel]}
              onValueChange={([val]) => setRiskLevel(val as 1 | 2 | 3 | 4 | 5)}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map((level) => (
                <span
                  key={level}
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    settings.riskLevel === level ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  R{level} {riskLabels[level]}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-sage-green" />
              数据管理
            </CardTitle>
            <CardDescription className="text-xs">
              数据仅存储在浏览器本地，建议定期导出备份
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 text-sage-green" />
              <div className="text-left">
                <p className="text-sm font-medium">导出数据</p>
                <p className="text-xs text-muted-foreground font-normal">下载 JSON 备份文件</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="w-4 h-4 text-sand-gold" />
              <div className="text-left">
                <p className="text-sm font-medium">导入数据</p>
                <p className="text-xs text-muted-foreground font-normal">从 JSON 文件恢复</p>
              </div>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Separator className="my-3" />

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3 border-destructive/30 hover:bg-destructive/5 hover:border-destructive/50"
              onClick={() => setShowClearDialog(true)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
              <div className="text-left">
                <p className="text-sm font-medium text-destructive">清空数据</p>
                <p className="text-xs text-muted-foreground font-normal">删除所有资产和设置</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-sand-gold/10 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">AssetLens v1.0</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  看懂你的资产，守住你的风险
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  数据完全存储在本地浏览器，不上传任何服务器
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clear Data AlertDialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空数据</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除所有 {assets.length} 项资产和全部设置，且不可恢复。建议先导出备份。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Confirmation AlertDialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认导入数据</AlertDialogTitle>
            <AlertDialogDescription>
              将替换当前 {assets.length} 条资产为导入的 {importPreview?.count || 0} 条资产，是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImportPreview(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>
              确认导入
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
