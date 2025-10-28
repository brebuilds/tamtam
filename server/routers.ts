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

  // Users management
  users: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    updateRole: protectedProcedure
      .input(z.object({
        userId: z.string(),
        role: z.enum(["admin", "manager", "shop_floor", "sales", "readonly"]),
      }))
      .mutation(async ({ input }) => {
        return await db.updateUserRole(input.userId, input.role);
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

    create: protectedProcedure
      .input(z.object({
        sku: z.string(),
        name: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        application: z.string().optional(),
        years: z.string().optional(),
        stock_quantity: z.number().int().optional(),
        reorder_point: z.number().int().optional(),
        unit_cost: z.number().int().optional(),
        unit_price: z.number().int().optional(),
        primary_image: z.string().optional(),
        images: z.array(z.string()).optional(),
        status: z.enum(["active", "inactive", "discontinued"]).optional(),
        precision_number: z.string().optional(),
        quality_number: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProduct(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        sku: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        application: z.string().optional(),
        years: z.string().optional(),
        stock_quantity: z.number().int().optional(),
        reorder_point: z.number().int().optional(),
        unit_cost: z.number().int().optional(),
        unit_price: z.number().int().optional(),
        primary_image: z.string().optional(),
        images: z.array(z.string()).optional(),
        status: z.enum(["active", "inactive", "discontinued"]).optional(),
        precision_number: z.string().optional(),
        quality_number: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateProduct(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await db.deleteProduct(input.id);
      }),
  }),

  // Purchase Orders routes
  purchaseOrders: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional().default(100) }).optional())
      .query(async ({ input }) => {
        return await db.getAllPurchaseOrders(input?.limit || 100);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getPurchaseOrderById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        po_number: z.string(),
        vendor_id: z.string(),
        po_date: z.string(),
        expected_delivery_date: z.string().optional(),
        notes: z.string().optional(),
        line_items: z.array(z.any()).optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createPurchaseOrder(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["draft", "sent", "acknowledged", "received", "cancelled"]).optional(),
        actual_delivery_date: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePurchaseOrder(id, data);
      }),
  }),

  // Vendors routes
  vendors: router({
    list: publicProcedure.query(async () => {
      return await db.getAllVendors();
    }),

    create: protectedProcedure
      .input(z.object({
        vendor_code: z.string(),
        vendor_name: z.string(),
        contact_name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createVendor(input);
      }),
  }),

  // Forms routes
  forms: router({
    listTemplates: publicProcedure.query(async () => {
      return await db.getAllFormTemplates();
    }),

    createTemplate: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
        fields: z.array(z.any()),
      }))
      .mutation(async ({ input }) => {
        return await db.createFormTemplate(input);
      }),

    updateTemplate: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
        fields: z.array(z.any()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateFormTemplate(id, data);
      }),

    deleteTemplate: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await db.deleteFormTemplate(input.id);
      }),

    submitForm: protectedProcedure
      .input(z.object({
        templateId: z.string(),
        productId: z.string().optional(),
        data: z.record(z.any()),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.submitForm({
          templateId: input.templateId,
          productId: input.productId,
          data: input.data,
          submittedBy: ctx.user?.id
        });
      }),

    listSubmissions: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllFormSubmissions(input?.limit || 100);
      }),
  }),
});

export type AppRouter = typeof appRouter;

