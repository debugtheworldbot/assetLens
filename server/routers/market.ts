import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

/**
 * Convert our symbol format (e.g. AAPL.US, 00700.HK, 600519.CN)
 * to Yahoo Finance format (e.g. AAPL, 0700.HK, 600519.SS)
 */
function toYahooSymbol(symbol: string): string {
  const match = symbol.trim().toUpperCase().match(/^([A-Z0-9]+)\.(US|HK|CN)$/);
  if (!match) return symbol;

  const [, ticker, market] = match;

  switch (market) {
    case "US":
      return ticker;
    case "HK": {
      const hkTicker = ticker.replace(/^0+/, "") || "0";
      return `${hkTicker.padStart(4, "0")}.HK`;
    }
    case "CN":
      return ticker.startsWith("6") ? `${ticker}.SS` : `${ticker}.SZ`;
    default:
      return symbol;
  }
}

/**
 * Convert our symbol format to Stooq format
 * Stooq uses: aapl.us, 00700.hk, 600519.cn (lowercase)
 */
function toStooqSymbol(symbol: string): string {
  return symbol.toLowerCase();
}

interface PriceResult {
  symbol: string;
  price: number | null;
  asOf: string | null;
  error: string | null;
}

/**
 * Fetch price from Yahoo Finance chart API (server-side, no CORS issues)
 */
async function fetchFromYahoo(symbol: string): Promise<PriceResult> {
  const yahooSymbol = toYahooSymbol(symbol);
  const upperSymbol = symbol.toUpperCase();

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AssetLens/1.0)",
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { symbol: upperSymbol, price: null, asOf: null, error: `Yahoo HTTP ${res.status}` };
    }

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (meta?.regularMarketPrice) {
      return {
        symbol: upperSymbol,
        price: meta.regularMarketPrice,
        asOf: new Date((meta.regularMarketTime || Date.now() / 1000) * 1000).toISOString(),
        error: null,
      };
    }

    return { symbol: upperSymbol, price: null, asOf: null, error: "Yahoo: 无法解析报价" };
  } catch (err: any) {
    return {
      symbol: upperSymbol,
      price: null,
      asOf: null,
      error: err.name === "AbortError" ? "Yahoo: 请求超时" : `Yahoo: ${err.message}`,
    };
  }
}

/**
 * Fetch price from Stooq CSV API (server-side, no CORS issues)
 */
async function fetchFromStooq(symbol: string): Promise<PriceResult> {
  const stooqSymbol = toStooqSymbol(symbol);
  const upperSymbol = symbol.toUpperCase();

  try {
    const url = `https://stooq.com/q/l/?s=${stooqSymbol}&f=sd2t2c&h&e=csv`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AssetLens/1.0)",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { symbol: upperSymbol, price: null, asOf: null, error: `Stooq HTTP ${res.status}` };
    }

    const text = await res.text();
    const lines = text.trim().split("\n");

    if (lines.length < 2) {
      return { symbol: upperSymbol, price: null, asOf: null, error: "Stooq: 无数据" };
    }

    const parts = lines[1].split(",");
    if (parts.length < 4) {
      return { symbol: upperSymbol, price: null, asOf: null, error: "Stooq: 格式错误" };
    }

    const date = parts[1];
    const time = parts[2];
    const closeStr = parts[3];

    if (closeStr === "N/D" || date === "N/D") {
      return { symbol: upperSymbol, price: null, asOf: null, error: "Stooq: 无报价(N/D)" };
    }

    const price = parseFloat(closeStr);
    if (isNaN(price)) {
      return { symbol: upperSymbol, price: null, asOf: null, error: "Stooq: 价格解析失败" };
    }

    return {
      symbol: upperSymbol,
      price,
      asOf: `${date}T${time || "00:00:00"}`,
      error: null,
    };
  } catch (err: any) {
    return {
      symbol: upperSymbol,
      price: null,
      asOf: null,
      error: err.name === "AbortError" ? "Stooq: 请求超时" : `Stooq: ${err.message}`,
    };
  }
}

/**
 * Fetch FX rates from open.er-api.com (server-side)
 */
async function fetchFxRates(): Promise<Record<string, number> | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (data.result !== "success" || !data.rates) return null;

    return data.rates;
  } catch {
    return null;
  }
}

export const marketRouter = router({
  /**
   * Get stock prices for one or more symbols
   * Tries Yahoo Finance first, falls back to Stooq
   */
  getStockPrices: publicProcedure
    .input(
      z.object({
        symbols: z.array(z.string()).min(1).max(20),
      })
    )
    .query(async ({ input }) => {
      const results: Record<string, { price: number; asOf: string }> = {};
      const errors: Record<string, string> = {};

      // Fetch all symbols in parallel
      const fetchPromises = input.symbols.map(async (symbol) => {
        // Try Yahoo first
        let result = await fetchFromYahoo(symbol);

        // If Yahoo fails, try Stooq
        if (result.price === null) {
          const stooqResult = await fetchFromStooq(symbol);
          if (stooqResult.price !== null) {
            result = stooqResult;
          }
        }

        if (result.price !== null && result.asOf) {
          results[result.symbol] = { price: result.price, asOf: result.asOf };
        } else {
          errors[result.symbol] = result.error || "获取失败";
        }
      });

      await Promise.allSettled(fetchPromises);

      return { prices: results, errors, fetchedAt: new Date().toISOString() };
    }),

  /**
   * Get latest FX rates (base USD)
   */
  getFxRates: publicProcedure.query(async () => {
    const rates = await fetchFxRates();
    if (!rates) {
      return { success: false as const, rates: null, fetchedAt: null };
    }
    return {
      success: true as const,
      rates,
      fetchedAt: new Date().toISOString(),
    };
  }),
});
