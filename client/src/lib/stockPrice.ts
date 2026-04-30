import { Currency, Market } from './types';

export interface ParsedSymbol {
  symbol: string;
  market: Market;
  currency: Currency;
}

export function parseSymbol(input: string): ParsedSymbol | null {
  const trimmed = input.trim().toUpperCase();
  const match = trimmed.match(/^([A-Z0-9]+)\.(US|HK|CN)$/);
  if (!match) return null;
  
  const [, ticker, marketStr] = match;
  const market = marketStr as Market;
  
  const currencyMap: Record<Market, Currency> = {
    US: 'USD',
    HK: 'HKD',
    CN: 'CNY',
  };
  
  return {
    symbol: `${ticker}.${market}`,
    market,
    currency: currencyMap[market],
  };
}

export function getMarketLabel(market: Market): string {
  const labels: Record<Market, string> = {
    US: '美股',
    HK: '港股',
    CN: 'A股',
  };
  return labels[market];
}

/**
 * Convert our symbol format (e.g. AAPL.US, 00700.HK, 600519.CN)
 * to Yahoo Finance format (e.g. AAPL, 0700.HK, 600519.SS)
 */
function toYahooSymbol(symbol: string): string {
  const parsed = parseSymbol(symbol);
  if (!parsed) return symbol;
  
  const { market } = parsed;
  const ticker = symbol.split('.')[0];
  
  switch (market) {
    case 'US':
      return ticker; // Yahoo uses just the ticker for US
    case 'HK':
      // Yahoo uses 4-digit format for HK, strip leading zeros if > 4 digits
      const hkTicker = ticker.replace(/^0+/, '') || '0';
      return `${hkTicker.padStart(4, '0')}.HK`;
    case 'CN':
      // Yahoo uses .SS for Shanghai, .SZ for Shenzhen
      // 6xxxxx = Shanghai, 0xxxxx/3xxxxx = Shenzhen
      if (ticker.startsWith('6')) {
        return `${ticker}.SS`;
      } else {
        return `${ticker}.SZ`;
      }
    default:
      return symbol;
  }
}

export interface StockPriceResult {
  prices: Record<string, { price: number; asOf: string }>;
  errors: Record<string, string>;
}

/**
 * Fetch stock prices using multiple CORS-friendly approaches
 */
export async function fetchStockPrices(symbols: string[]): Promise<StockPriceResult> {
  const result: StockPriceResult = { prices: {}, errors: {} };
  
  if (symbols.length === 0) return result;

  // Try fetching each symbol individually via Yahoo Finance chart API
  // Yahoo Finance chart endpoint supports CORS
  const fetchPromises = symbols.map(async (symbol) => {
    const yahooSymbol = toYahooSymbol(symbol);
    const upperSymbol = symbol.toUpperCase();
    
    try {
      // Yahoo Finance v8 chart API - often allows CORS from browsers
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeout);
      
      if (!res.ok) {
        result.errors[upperSymbol] = `HTTP ${res.status}`;
        return;
      }
      
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      
      if (meta?.regularMarketPrice) {
        result.prices[upperSymbol] = {
          price: meta.regularMarketPrice,
          asOf: new Date(meta.regularMarketTime * 1000).toISOString(),
        };
      } else {
        result.errors[upperSymbol] = '无法解析报价数据';
      }
    } catch (err: any) {
      // If Yahoo fails (CORS or network), mark as error
      result.errors[upperSymbol] = err.name === 'AbortError' ? '请求超时' : '网络错误，请手动输入价格';
    }
  });

  await Promise.allSettled(fetchPromises);
  return result;
}

export function getPriceStatus(fetchedAt: string | null): 'fresh' | 'stale' | 'offline' {
  if (!fetchedAt) return 'offline';
  const diff = Date.now() - new Date(fetchedAt).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) return 'fresh';
  if (hours < 24) return 'stale';
  return 'offline';
}
