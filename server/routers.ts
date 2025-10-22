import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { semanticSearch } from "./aiSearch";

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

    updateStock: protectedProcedure
      .input(z.object({
        id: z.string(),
        quantity: z.number().int(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateProductStock(input.id, input.quantity, input.note);
      }),

    adjustStock: protectedProcedure
      .input(z.object({
        id: z.string(),
        adjustment: z.number().int(),
        reason: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.adjustProductStock(input.id, input.adjustment, input.reason);
      }),

    getLowStock: publicProcedure
      .input(z.object({ limit: z.number().optional().default(50) }))
      .query(async ({ input }) => {
        return await db.getLowStockProducts(input.limit);
      }),

    semanticSearch: publicProcedure
      .input(z.object({ 
        query: z.string(),
        limit: z.number().optional().default(10)
      }))
      .query(async ({ input }) => {
        // First get all products (or a large subset)
        const allProducts = await db.getAllProducts(1000);
        // Then use AI to rank them
        return await semanticSearch(input.query, allProducts, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;

