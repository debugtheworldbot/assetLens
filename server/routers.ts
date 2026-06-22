import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { marketRouter } from "./routers/market";

export const appRouter = router({
  system: systemRouter,
  market: marketRouter,
});

export type AppRouter = typeof appRouter;
