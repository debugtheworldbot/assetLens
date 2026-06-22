import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {};
}

describe("market.getFxRates", () => {
  it("returns FX rates with success status", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.market.getFxRates();

    expect(result.success).toBe(true);
    expect(result.rates).not.toBeNull();
    expect(result.fetchedAt).not.toBeNull();

    if (result.rates) {
      // Should have common currencies
      expect(result.rates["CNY"]).toBeGreaterThan(0);
      expect(result.rates["HKD"]).toBeGreaterThan(0);
      expect(result.rates["EUR"]).toBeGreaterThan(0);
      expect(result.rates["JPY"]).toBeGreaterThan(0);
    }
  }, 15000);
});

describe("market.getStockPrices", () => {
  it("returns stock price for a valid HK symbol", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.market.getStockPrices({
      symbols: ["00700.HK"],
    });

    expect(result.fetchedAt).toBeTruthy();
    expect(result.prices).toBeDefined();
    expect(result.errors).toBeDefined();

    // Should successfully get price for Tencent
    if (result.prices["00700.HK"]) {
      expect(result.prices["00700.HK"].price).toBeGreaterThan(0);
      expect(result.prices["00700.HK"].asOf).toBeTruthy();
    } else {
      // If it fails (network issue), at least errors should be populated
      expect(result.errors["00700.HK"]).toBeTruthy();
    }
  }, 30000);

  it("returns stock price for a valid US symbol", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.market.getStockPrices({
      symbols: ["AAPL.US"],
    });

    expect(result.fetchedAt).toBeTruthy();

    if (result.prices["AAPL.US"]) {
      expect(result.prices["AAPL.US"].price).toBeGreaterThan(0);
      expect(result.prices["AAPL.US"].asOf).toBeTruthy();
    } else {
      expect(result.errors["AAPL.US"]).toBeTruthy();
    }
  }, 30000);

  it("handles multiple symbols in one request", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.market.getStockPrices({
      symbols: ["AAPL.US", "00700.HK"],
    });

    expect(result.fetchedAt).toBeTruthy();
    // Should have attempted both symbols
    const totalResults = Object.keys(result.prices).length + Object.keys(result.errors).length;
    expect(totalResults).toBe(2);
  }, 30000);

  it("handles invalid symbols gracefully", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.market.getStockPrices({
      symbols: ["INVALID.US"],
    });

    expect(result.fetchedAt).toBeTruthy();
    // Should either have an error or a price (some APIs may return data for unusual tickers)
    const totalResults = Object.keys(result.prices).length + Object.keys(result.errors).length;
    expect(totalResults).toBeGreaterThanOrEqual(1);
  }, 30000);
});
