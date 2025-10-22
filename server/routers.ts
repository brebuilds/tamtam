import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Product routes
  products: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional().default(100) }))
      .query(async ({ input }) => {
        return await db.getAllProducts(input.limit);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),

    getBySku: publicProcedure
      .input(z.object({ sku: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductBySku(input.sku);
      }),

    search: publicProcedure
      .input(z.object({ 
        query: z.string(),
        limit: z.number().optional().default(50)
      }))
      .query(async ({ input }) => {
        return await db.searchProducts(input.query, input.limit);
      }),

    stats: publicProcedure.query(async () => {
      return await db.getProductStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;

