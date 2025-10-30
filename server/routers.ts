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

  // Posts routes (Bulletin/News Feed)
  posts: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional().default(50) }))
      .query(async ({ input }) => {
        return await db.getAllPosts(input.limit);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getPostById(input.id);
      }),

    search: publicProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().optional().default(50)
      }))
      .query(async ({ input }) => {
        return await db.searchPosts(input.query, input.limit);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        type: z.enum(["bulletin", "news", "diesel_tech", "announcement"]).optional(),
        excerpt: z.string().optional(),
        featured_image: z.string().optional(),
        external_link: z.string().optional(),
        tags: z.array(z.string()).optional(),
        is_pinned: z.boolean().optional(),
        is_published: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createPost({
          ...input,
          author_id: ctx.user!.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.enum(["bulletin", "news", "diesel_tech", "announcement"]).optional(),
        excerpt: z.string().optional(),
        featured_image: z.string().optional(),
        external_link: z.string().optional(),
        tags: z.array(z.string()).optional(),
        is_pinned: z.boolean().optional(),
        is_published: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePost(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await db.deletePost(input.id);
      }),
  }),

  // Documents routes (Training Center/Knowledge Hub)
  documents: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional().default(100) }))
      .query(async ({ input }) => {
        return await db.getAllDocuments(input.limit);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getDocumentById(input.id);
      }),

    getByCategory: publicProcedure
      .input(z.object({
        category: z.enum(["training_video", "equipment_manual", "safety_guideline", "inventory_guide", "faq", "general"]),
        limit: z.number().optional().default(100)
      }))
      .query(async ({ input }) => {
        return await db.getDocumentsByCategory(input.category, input.limit);
      }),

    search: publicProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().optional().default(50)
      }))
      .query(async ({ input }) => {
        return await db.searchDocuments(input.query, input.limit);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        category: z.enum(["training_video", "equipment_manual", "safety_guideline", "inventory_guide", "faq", "general"]),
        file_url: z.string().optional(),
        file_type: z.string().optional(),
        file_size: z.number().optional(),
        thumbnail_url: z.string().optional(),
        duration: z.number().optional(),
        video_platform: z.string().optional(),
        video_id: z.string().optional(),
        tags: z.array(z.string()).optional(),
        is_public: z.boolean().optional(),
        order_index: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createDocument({
          ...input,
          uploaded_by: ctx.user!.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(["training_video", "equipment_manual", "safety_guideline", "inventory_guide", "faq", "general"]).optional(),
        file_url: z.string().optional(),
        file_type: z.string().optional(),
        file_size: z.number().optional(),
        thumbnail_url: z.string().optional(),
        duration: z.number().optional(),
        video_platform: z.string().optional(),
        video_id: z.string().optional(),
        tags: z.array(z.string()).optional(),
        is_public: z.boolean().optional(),
        order_index: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateDocument(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await db.deleteDocument(input.id);
      }),

    incrementDownload: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.incrementDocumentDownload(input.id);
        return { success: true };
      }),
  }),

  // Comments routes (Universal)
  comments: router({
    list: publicProcedure
      .input(z.object({
        commentableType: z.enum(["post", "document", "training_material"]),
        commentableId: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getComments(input.commentableType, input.commentableId);
      }),

    create: protectedProcedure
      .input(z.object({
        commentableType: z.enum(["post", "document", "training_material"]),
        commentableId: z.string(),
        content: z.string(),
        parentCommentId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createComment({
          commentable_type: input.commentableType,
          commentable_id: input.commentableId,
          content: input.content,
          parent_comment_id: input.parentCommentId,
          author_id: ctx.user!.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateComment(input.id, input.content);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await db.deleteComment(input.id);
      }),
  }),

  // Reactions routes (Likes, etc.)
  reactions: router({
    getCount: publicProcedure
      .input(z.object({
        reactableType: z.string(),
        reactableId: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getReactionCount(input.reactableType, input.reactableId);
      }),

    getUserReaction: publicProcedure
      .input(z.object({
        reactableType: z.string(),
        reactableId: z.string(),
        userId: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getUserReaction(input.reactableType, input.reactableId, input.userId);
      }),

    toggle: protectedProcedure
      .input(z.object({
        reactableType: z.string(),
        reactableId: z.string(),
        reactionType: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.toggleReaction(
          input.reactableType,
          input.reactableId,
          ctx.user!.id,
          input.reactionType
        );
      }),
  }),
});

export type AppRouter = typeof appRouter;

