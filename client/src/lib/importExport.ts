import { AppState, Asset, StockAsset, CashAsset } from './types';

export function validateImportData(data: unknown): { valid: boolean; error?: string; state?: AppState } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '无效的数据格式' };
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) {
    return { valid: false, error: '不支持的版本号' };
  }

  if (!obj.settings || typeof obj.settings !== 'object') {
    return { valid: false, error: '缺少设置信息' };
  }

  if (!Array.isArray(obj.assets)) {
    return { valid: false, error: '资产数据格式错误' };
  }

  // Validate each asset
  for (let i = 0; i < obj.assets.length; i++) {
    const asset = obj.assets[i] as Record<string, unknown>;
    if (!asset.id || !asset.name || !asset.category || !asset.currency) {
      return { valid: false, error: `第 ${i + 1} 条资产缺少必填字段` };
    }

    if (asset.category === 'stock') {
      if (!asset.symbol || !asset.market || typeof asset.shares !== 'number') {
        return { valid: false, error: `第 ${i + 1} 条股票资产缺少 symbol/market/shares` };
      }
    } else {
      if (typeof asset.amount !== 'number') {
        return { valid: false, error: `第 ${i + 1} 条资产缺少金额` };
      }
    }
  }

  return { valid: true, state: data as AppState };
}

export function exportData(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function downloadJson(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch {
        reject(new Error('JSON 解析失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}
