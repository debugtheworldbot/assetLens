import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { callDataApi } from "../_core/dataApi";
import { fuzzySearchStocks, type MarketType } from "../stockList";

/**
 * Convert our symbol format (e.g. AAPL.US, 00700.HK, 600519.CN)
 * to Yahoo Finance format (e.g. AAPL, 0700.HK, 600519.SS)
 *
 * Shanghai (.SS): 6xxxxx (stocks), 5xxxxx (ETFs/funds), 9xxxxx (B shares)
 * Shenzhen (.SZ): 0xxxxx, 3xxxxx (ChiNext), 1xxxxx (bonds/ETFs), 2xxxxx (B shares)
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
    case "CN": {
      // Shanghai: starts with 5, 6, 9, or 000 (indices)
      // Shenzhen: starts with 0 (except 000xxx indices), 1, 2, 3
      const firstChar = ticker.charAt(0);
      if (firstChar === "6" || firstChar === "5" || firstChar === "9") {
        return `${ticker}.SS`;
      }
      return `${ticker}.SZ`;
    }
    default:
      return symbol;
  }
}

interface PriceResult {
  symbol: string;
  price: number | null;
  name: string | null;
  asOf: string | null;
  error: string | null;
}

/**
 * Fetch price from Yahoo Finance via Manus Data API (reliable, no CORS/timeout issues)
 */
async function fetchFromDataApi(symbol: string): Promise<PriceResult> {
  const yahooSymbol = toYahooSymbol(symbol);
  const upperSymbol = symbol.toUpperCase();

  try {
    const response = (await callDataApi("YahooFinance/get_stock_chart", {
      query: {
        symbol: yahooSymbol,
        interval: "1d",
        range: "1d",
      },
    })) as any;

    const meta = response?.chart?.result?.[0]?.meta;

    if (meta?.regularMarketPrice) {
      return {
        symbol: upperSymbol,
        price: meta.regularMarketPrice,
        name: meta.longName || meta.shortName || null,
        asOf: new Date(
          (meta.regularMarketTime || Date.now() / 1000) * 1000
        ).toISOString(),
        error: null,
      };
    }

    return {
      symbol: upperSymbol,
      price: null,
      name: null,
      asOf: null,
      error: "无法解析报价",
    };
  } catch (err: any) {
    return {
      symbol: upperSymbol,
      price: null,
      name: null,
      asOf: null,
      error: err.message || "获取失败",
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

/**
 * Search for a stock by ticker - returns name and price
 */
async function searchStock(
  ticker: string,
  market: "CN" | "HK" | "US"
): Promise<{
  symbol: string;
  name: string | null;
  price: number | null;
  asOf: string | null;
  error: string | null;
}> {
  const fullSymbol = `${ticker.toUpperCase()}.${market}`;
  const result = await fetchFromDataApi(fullSymbol);
  return {
    symbol: fullSymbol,
    name: result.name,
    price: result.price,
    asOf: result.asOf,
    error: result.error,
  };
}

export const marketRouter = router({
  /**
   * Get stock prices for one or more symbols
   * Uses Manus Data API (Yahoo Finance) for reliable server-side fetching
   */
  getStockPrices: publicProcedure
    .input(
      z.object({
        symbols: z.array(z.string()).min(1).max(20),
      })
    )
    .query(async ({ input }) => {
      const results: Record<string, { price: number; asOf: string; name?: string }> = {};
      const errors: Record<string, string> = {};

      // Fetch all symbols in parallel
      const fetchPromises = input.symbols.map(async (symbol) => {
        const result = await fetchFromDataApi(symbol);

        if (result.price !== null && result.asOf) {
          results[result.symbol] = {
            price: result.price,
            asOf: result.asOf,
            name: result.name || undefined,
          };
        } else {
          errors[result.symbol] = result.error || "获取失败";
        }
      });

      await Promise.allSettled(fetchPromises);

      return { prices: results, errors, fetchedAt: new Date().toISOString() };
    }),

  /**
   * Search/lookup a stock by ticker code
   * Returns name and current price
   */
  searchStock: publicProcedure
    .input(
      z.object({
        ticker: z.string().min(1).max(10),
        market: z.enum(["CN", "HK", "US"]),
      })
    )
    .query(async ({ input }) => {
      return searchStock(input.ticker, input.market);
    }),

  /**
   * Fuzzy search stocks by code or name (Chinese / English)
   * Returns matching stocks from the local stock list
   */
  fuzzySearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(20),
        market: z.enum(["CN", "HK", "US"]),
        limit: z.number().min(1).max(20).optional().default(8),
      })
    )
    .query(({ input }) => {
      const results = fuzzySearchStocks(
        input.query,
        input.market as MarketType,
        input.limit
      );
      return { results };
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
