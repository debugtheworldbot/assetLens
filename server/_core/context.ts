import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export type TrpcContext = Record<string, never>;

export async function createContext(
  _opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  return {};
}
