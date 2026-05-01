import { useRef, useState } from 'react';
import { useAssetStore } from '@/store/useAssetStore';
import { useFxStore } from '@/store/useFxStore';
import { usePriceStore } from '@/store/usePriceStore';
import { getPriceCache } from '@/store/usePriceStore';
import { CURRENCIES } from '@/lib/currencies';
import { Currency } from '@/lib/types';
import { exportData, downloadJson, readJsonFile, validateImportData } from '@/lib/importExport';
import { generateAnalysisPrompt } from '@/lib/promptExport';
import { Download, Upload, Trash2, Globe, Shield, Database, Info, BrainCircuit, Copy, Check, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

export default function Settings() {
  const settings = useAssetStore((s) => s.settings);
  const setBaseCurrency = useAssetStore((s) => s.setBaseCurrency);
  const setRiskLevel = useAssetStore((s) => s.setRiskLevel);
  const importState = useAssetStore((s) => s.importState);
  const getExportState = useAssetStore((s) => s.getExportState);
  const clearAll = useAssetStore((s) => s.clearAll);
  const assets = useAssetStore((s) => s.assets);
  const fxRates = useFxStore((s) => s.rates);
  const fxRefresh = useFxStore((s) => s.refresh);
  const priceRefresh = usePriceStore((s) => s.refresh);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<{ count: number; state: any } | null>(null);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleGeneratePrompt = () => {
    if (assets.length === 0) {
      toast.error('暂无资产数据，请先添加资产');
      return;
    }

    const priceCache = getPriceCache();
    const prompt = generateAnalysisPrompt({
      assets,
      baseCurrency: settings.baseCurrency,
      rates: fxRates,
      priceCache,
      riskLevel: settings.riskLevel,
    });

    setPromptText(prompt);
    setShowPromptDialog(true);
    setCopied(false);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = promptText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPrompt = () => {
    const blob = new Blob([promptText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `assetlens-analysis-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('已下载 Markdown 文件');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理你的偏好和数据</p>
      </div>

      {/* Base Currency */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
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

      {/* Risk Level */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              风险等级
            </CardTitle>
            <Badge variant="outline" className="tabular-nums text-xs">
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

      {/* Data Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
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
            <Download className="h-4 w-4" />
            <div className="text-left">
              <p className="text-sm font-medium">导出数据</p>
              <p className="text-xs text-muted-foreground font-normal">下载 JSON 备份文件</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={handleGeneratePrompt}
          >
            <BrainCircuit className="h-4 w-4" />
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">导出分析 Prompt</p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">AI</Badge>
              </div>
              <p className="text-xs text-muted-foreground font-normal">生成资产分析报告，复制给 AI 获取调仓建议</p>
            </div>
          </Button>

          <Separator className="my-3" />

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="h-4 w-4" />
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
            <Trash2 className="h-4 w-4 text-destructive" />
            <div className="text-left">
              <p className="text-sm font-medium text-destructive">清空数据</p>
              <p className="text-xs text-muted-foreground font-normal">删除所有资产和设置</p>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">AssetLens v1.0</p>
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

      {/* Prompt Preview Dialog */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              分析 Prompt 预览
            </DialogTitle>
            <DialogDescription>
              复制以下内容，粘贴到 ChatGPT、Claude 等 AI 助手中，即可获取专业的资产分析和调仓建议
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words bg-muted rounded-lg p-4 font-mono border">
              {promptText}
            </pre>
          </div>
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPrompt}
              className="gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5" />
              下载 .md
            </Button>
            <Button
              size="sm"
              onClick={handleCopyPrompt}
              className="gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  复制全部
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
