import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { nanoid } from "nanoid";

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

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  products: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllProducts();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),

    getByPartNumber: protectedProcedure
      .input(z.object({ partNumber: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductByPartNumber(input.partNumber);
      }),

    search: protectedProcedure
      .input(z.object({ 
        query: z.string(),
        limit: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await db.searchProducts(input.query, input.limit);
      }),

    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductsByCategory(input.category);
      }),

    getLowStock: protectedProcedure.query(async () => {
      return await db.getLowStockProducts();
    }),

    create: protectedProcedure
      .input(z.object({
        partNumber: z.string(),
        title: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        unitCost: z.number().optional(),
        sellingPrice: z.number().optional(),
        stockQuantity: z.number().optional(),
        reorderPoint: z.number().optional(),
        magentoSku: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const product = {
          id: nanoid(),
          ...input,
          isActive: true,
        };
        return await db.createProduct(product);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        updates: z.object({
          partNumber: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          unitCost: z.number().optional(),
          sellingPrice: z.number().optional(),
          stockQuantity: z.number().optional(),
          reorderPoint: z.number().optional(),
          imageUrl: z.string().optional(),
        })
      }))
      .mutation(async ({ input }) => {
        await db.updateProduct(input.id, input.updates);
        return { success: true };
      }),

    updateStock: protectedProcedure
      .input(z.object({
        id: z.string(),
        quantity: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.updateProductStock(input.id, input.quantity);
        return { success: true };
      }),
  }),

  // ============================================================================
  // SUBPARTS
  // ============================================================================

  subParts: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllSubParts();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getSubPartById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        partNumber: z.string(),
        title: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        unitCost: z.number().optional(),
        stockQuantity: z.number().optional(),
        reorderPoint: z.number().optional(),
        vendorId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const subPart = {
          id: nanoid(),
          ...input,
          isActive: true,
        };
        return await db.createSubPart(subPart);
      }),

    updateStock: protectedProcedure
      .input(z.object({
        id: z.string(),
        quantity: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.updateSubPartStock(input.id, input.quantity);
        return { success: true };
      }),
  }),

  // ============================================================================
  // VENDORS
  // ============================================================================

  vendors: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllVendors();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getVendorById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        vendorCode: z.string(),
        vendorName: z.string(),
        contactName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        leadTimeDays: z.number().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const vendor = {
          id: nanoid(),
          ...input,
          isActive: true,
        };
        return await db.createVendor(vendor);
      }),
  }),

  // ============================================================================
  // PURCHASE ORDERS
  // ============================================================================

  purchaseOrders: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllPurchaseOrders();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getPurchaseOrderById(input.id);
      }),

    getByNumber: protectedProcedure
      .input(z.object({ poNumber: z.string() }))
      .query(async ({ input }) => {
        return await db.getPurchaseOrderByNumber(input.poNumber);
      }),

    getOpen: protectedProcedure.query(async () => {
      return await db.getOpenPurchaseOrders();
    }),

    getLineItems: protectedProcedure
      .input(z.object({ poId: z.string() }))
      .query(async ({ input }) => {
        return await db.getLineItemsByPO(input.poId);
      }),

    create: protectedProcedure
      .input(z.object({
        poNumber: z.string(),
        vendorId: z.string(),
        poDate: z.date(),
        expectedDeliveryDate: z.date().optional(),
        status: z.enum(["Draft", "Sent", "Acknowledged", "Received", "Cancelled"]).optional(),
        totalAmount: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const po = {
          id: nanoid(),
          ...input,
          status: input.status || "Draft" as const,
        };
        return await db.createPurchaseOrder(po);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        updates: z.object({
          status: z.enum(["Draft", "Sent", "Acknowledged", "Received", "Cancelled"]).optional(),
          expectedDeliveryDate: z.date().optional(),
          actualDeliveryDate: z.date().optional(),
          totalAmount: z.number().optional(),
          notes: z.string().optional(),
          aiMatchConfidence: z.number().optional(),
          aiMatchReasoning: z.string().optional(),
        })
      }))
      .mutation(async ({ input }) => {
        await db.updatePurchaseOrder(input.id, input.updates);
        return { success: true };
      }),

    addLineItem: protectedProcedure
      .input(z.object({
        poId: z.string(),
        lineNumber: z.number(),
        partNumber: z.string(),
        description: z.string().optional(),
        quantity: z.number(),
        unitPrice: z.number(),
        productId: z.string().optional(),
        subPartId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const lineItem = {
          id: nanoid(),
          ...input,
          totalPrice: input.quantity * input.unitPrice,
          receivedQuantity: 0,
        };
        return await db.createPoLineItem(lineItem);
      }),
  }),

  // ============================================================================
  // CROSS REFERENCES
  // ============================================================================

  crossReferences: router({
    getByProduct: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        return await db.getCrossReferencesByProduct(input.productId);
      }),

    findByAlternate: protectedProcedure
      .input(z.object({ alternatePartNumber: z.string() }))
      .query(async ({ input }) => {
        return await db.findProductByAlternatePart(input.alternatePartNumber);
      }),

    create: protectedProcedure
      .input(z.object({
        productId: z.string(),
        alternatePartNumber: z.string(),
        source: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const crossRef = {
          id: nanoid(),
          ...input,
        };
        return await db.createCrossReference(crossRef);
      }),
  }),

  // ============================================================================
  // DATA QUALITY
  // ============================================================================

  dataQuality: router({
    getOpenIssues: protectedProcedure.query(async () => {
      return await db.getOpenDataQualityIssues();
    }),

    create: protectedProcedure
      .input(z.object({
        issueType: z.enum(["Missing Image", "Missing Description", "Missing Category", "Potential Duplicate", "Invalid Price", "Low Stock", "Other"]),
        severity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
        relatedTable: z.string().optional(),
        relatedRecordId: z.string().optional(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        const issue = {
          id: nanoid(),
          issueId: `DQ-${Date.now()}`,
          ...input,
          severity: input.severity || "Medium" as const,
          status: "Open" as const,
        };
        return await db.createDataQualityIssue(issue);
      }),

    resolve: protectedProcedure
      .input(z.object({
        id: z.string(),
        resolutionNotes: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.resolveDataQualityIssue(input.id, ctx.user.id, input.resolutionNotes);
        return { success: true };
      }),
  }),

  // ============================================================================
  // AUTOMATION
  // ============================================================================

  automation: router({
    getRecentLogs: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getRecentAutomationLogs(input.limit);
      }),

    createLog: protectedProcedure
      .input(z.object({
        automationType: z.string(),
        status: z.enum(["Success", "Partial Success", "Failed"]),
        recordsProcessed: z.number().optional(),
        recordsSucceeded: z.number().optional(),
        recordsFailed: z.number().optional(),
        details: z.string().optional(),
        errorMessage: z.string().optional(),
        executionTimeMs: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const log = {
          id: nanoid(),
          logId: `AUTO-${Date.now()}`,
          ...input,
          triggeredBy: ctx.user.id,
        };
        return await db.createAutomationLog(log);
      }),
  }),

  // ============================================================================
  // SEARCH
  // ============================================================================

  search: router({
    logSearch: protectedProcedure
      .input(z.object({
        searchQuery: z.string(),
        searchType: z.string(),
        resultsCount: z.number(),
        topResultId: z.string().optional(),
        executionTimeMs: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.logSearch({
          id: nanoid(),
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    getPopular: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getPopularSearches(input.limit);
      }),
  }),

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  dashboard: router({
    getStats: protectedProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;

