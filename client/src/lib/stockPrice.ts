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

export interface StockPriceResult {
  prices: Record<string, { price: number; asOf: string }>;
  errors: Record<string, string>;
}

export async function fetchStockPrices(symbols: string[]): Promise<StockPriceResult> {
  const result: StockPriceResult = { prices: {}, errors: {} };
  
  if (symbols.length === 0) return result;
  
  try {
    const symbolList = symbols.map(s => s.toLowerCase()).join(',');
    const url = `https://stooq.com/q/l/?s=${symbolList}&f=sd2t2c&h&e=csv`;
    const res = await fetch(url);
    
    if (!res.ok) {
      symbols.forEach(s => { result.errors[s] = 'Fetch failed'; });
      return result;
    }
    
    const text = await res.text();
    const lines = text.trim().split('\n');
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 4) continue;
      
      const symbol = parts[0].toUpperCase();
      const date = parts[1];
      const time = parts[2];
      const closeStr = parts[3];
      
      if (closeStr === 'N/D' || date === 'N/D') {
        result.errors[symbol] = '无法获取报价';
        continue;
      }
      
      const price = parseFloat(closeStr);
      if (isNaN(price)) {
        result.errors[symbol] = '价格解析失败';
        continue;
      }
      
      result.prices[symbol] = {
        price,
        asOf: `${date}T${time}`,
      };
    }
    
    // Mark symbols that weren't in the response
    for (const s of symbols) {
      const upper = s.toUpperCase();
      if (!result.prices[upper] && !result.errors[upper]) {
        result.errors[upper] = '未在响应中找到';
      }
    }
  } catch (err) {
    symbols.forEach(s => {
      result.errors[s.toUpperCase()] = '网络错误';
    });
  }
  
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
