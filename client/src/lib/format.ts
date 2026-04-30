import { Currency } from './types';
import { getCurrencySymbol } from './currencies';

export function formatNumber(num: number, decimals: number = 2): string {
  if (num === 0) return '0';
  
  const abs = Math.abs(num);
  if (abs >= 1e8) {
    return (num / 1e8).toFixed(2) + '亿';
  }
  if (abs >= 1e4) {
    return (num / 1e4).toFixed(2) + '万';
  }
  
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(amount: number, currency: Currency, compact: boolean = false): string {
  const symbol = getCurrencySymbol(currency);
  
  if (compact) {
    const abs = Math.abs(amount);
    if (abs >= 1e8) {
      return `${symbol}${(amount / 1e8).toFixed(2)}亿`;
    }
    if (abs >= 1e4) {
      return `${symbol}${(amount / 1e4).toFixed(2)}万`;
    }
  }
  
  return `${symbol}${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  return `${days} 天前`;
}
