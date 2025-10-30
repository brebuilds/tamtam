import { eq, like, or, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  products,
  Product,
  InsertProduct,
  purchaseOrders,
  PurchaseOrder,
  InsertPurchaseOrder,
  vendors,
  Vendor,
  InsertVendor,
  formTemplates,
  FormTemplate,
  InsertFormTemplate,
  formSubmissions,
  FormSubmission,
  InsertFormSubmission,
  posts,
  Post,
  InsertPost,
  documents,
  Document,
  InsertDocument,
  comments,
  Comment,
  InsertComment,
  reactions,
  Reaction,
  InsertReaction
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER FUNCTIONS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(users)
    .orderBy(users.name);

  return result;
}

export async function updateUserRole(userId: string, role: string) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(users)
    .set({ role: role as any })
    .where(eq(users.id, userId));

  return await getUser(userId);
}

// ============================================================================
// PRODUCT FUNCTIONS
// ============================================================================

export async function getAllProducts(limit: number = 100): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(products)
    .where(eq(products.status, 'active'))
    .orderBy(desc(products.created_at))
    .limit(limit);

  return result;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return result[0];
}

export async function getProductBySku(sku: string): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.sku, sku))
    .limit(1);

  return result[0];
}

export async function searchProducts(query: string, limit: number = 50): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  const searchPattern = `%${query}%`;

  const result = await db
    .select()
    .from(products)
    .where(
      or(
        like(products.sku, searchPattern),
        like(products.name, searchPattern),
        like(products.application, searchPattern),
        like(products.quality_number, searchPattern),
        like(products.precision_number, searchPattern),
        like(products.oe_number, searchPattern)
      )
    )
    .limit(limit);

  return result;
}

export async function getProductStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, lowStock: 0 };

  const allProducts = await db.select().from(products);

  const stats = {
    total: allProducts.length,
    active: allProducts.filter(p => p.status === 'active').length,
    lowStock: allProducts.filter(p => 
      p.stock_quantity !== null && 
      p.reorder_point !== null && 
      p.stock_quantity <= p.reorder_point
    ).length,
  };

  return stats;
}



export async function updateProductStock(
  productId: string, 
  newQuantity: number, 
  note?: string
): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(products)
    .set({ 
      stock_quantity: newQuantity,
      updated_at: new Date()
    })
    .where(eq(products.id, productId));

  return await getProductById(productId);
}

export async function adjustProductStock(
  productId: string,
  adjustment: number,
  reason: string
): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const product = await getProductById(productId);
  if (!product) return undefined;

  const currentStock = product.stock_quantity || 0;
  const newStock = Math.max(0, currentStock + adjustment);

  await db
    .update(products)
    .set({ 
      stock_quantity: newStock,
      updated_at: new Date()
    })
    .where(eq(products.id, productId));

  return await getProductById(productId);
}

export async function getLowStockProducts(limit: number = 50): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.status, 'active'))
    .orderBy(desc(products.stock_quantity));

  // Filter for low stock items
  const lowStock = allProducts.filter(p =>
    p.stock_quantity !== null &&
    p.reorder_point !== null &&
    p.stock_quantity <= p.reorder_point
  );

  return lowStock.slice(0, limit);
}

export async function createProduct(data: InsertProduct): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { nanoid } = await import("nanoid");
  const id = nanoid();

  await db.insert(products).values({
    id,
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const product = await getProductById(id);
  if (!product) throw new Error("Failed to create product");

  return product;
}

export async function updateProduct(
  productId: string,
  data: Partial<InsertProduct>
): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(products)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(products.id, productId));

  return await getProductById(productId);
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(products)
    .where(eq(products.id, productId));

  return true;
}

// ============================================================================
// PURCHASE ORDERS FUNCTIONS
// ============================================================================

export async function getAllPurchaseOrders(limit: number = 100): Promise<PurchaseOrder[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(purchaseOrders)
    .orderBy(desc(purchaseOrders.created_at))
    .limit(limit);

  return result;
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, id))
    .limit(1);

  return result[0];
}

export async function createPurchaseOrder(data: any): Promise<PurchaseOrder> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { nanoid } = await import("nanoid");
  const id = nanoid();

  await db.insert(purchaseOrders).values({
    id,
    po_number: data.po_number,
    vendor_id: data.vendor_id,
    po_date: new Date(data.po_date),
    expected_delivery_date: data.expected_delivery_date ? new Date(data.expected_delivery_date) : null,
    notes: data.notes,
    status: 'draft',
    total_amount: 0,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const po = await getPurchaseOrderById(id);
  if (!po) throw new Error("Failed to create purchase order");

  return po;
}

export async function updatePurchaseOrder(
  poId: string,
  data: Partial<InsertPurchaseOrder>
): Promise<PurchaseOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(purchaseOrders)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(purchaseOrders.id, poId));

  return await getPurchaseOrderById(poId);
}

// ============================================================================
// VENDORS FUNCTIONS
// ============================================================================

export async function getAllVendors(): Promise<Vendor[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(vendors)
    .where(eq(vendors.is_active, true))
    .orderBy(vendors.vendor_name);

  return result;
}

export async function getVendorById(id: string): Promise<Vendor | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, id))
    .limit(1);

  return result[0];
}

export async function createVendor(data: InsertVendor): Promise<Vendor> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { nanoid } = await import("nanoid");
  const id = nanoid();

  await db.insert(vendors).values({
    id,
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const vendor = await getVendorById(id);
  if (!vendor) throw new Error("Failed to create vendor");

  return vendor;
}

// ============================================================================
// FORMS FUNCTIONS
// ============================================================================

export async function getAllFormTemplates(): Promise<FormTemplate[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(formTemplates)
    .orderBy(formTemplates.name);

  return result;
}

export async function createFormTemplate(data: any): Promise<FormTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { nanoid } = await import("nanoid");
  const id = nanoid();

  await db.insert(formTemplates).values({
    id,
    name: data.name,
    description: data.description,
    category: data.category,
    isActive: data.isActive ?? true,
    fields: data.fields,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const template = await db.select().from(formTemplates).where(eq(formTemplates.id, id)).limit(1);
  if (!template[0]) throw new Error("Failed to create form template");

  return template[0];
}

export async function updateFormTemplate(templateId: string, data: any): Promise<FormTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(formTemplates)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(formTemplates.id, templateId));

  const result = await db.select().from(formTemplates).where(eq(formTemplates.id, templateId)).limit(1);
  return result[0];
}

export async function deleteFormTemplate(templateId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(formTemplates).where(eq(formTemplates.id, templateId));
  return true;
}

export async function submitForm(data: any): Promise<FormSubmission> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { nanoid } = await import("nanoid");
  const id = nanoid();

  await db.insert(formSubmissions).values({
    id,
    templateId: data.templateId,
    productId: data.productId,
    data: data.data,
    submittedBy: data.submittedBy,
    submittedAt: new Date(),
    status: 'submitted',
  });

  const submission = await db.select().from(formSubmissions).where(eq(formSubmissions.id, id)).limit(1);
  if (!submission[0]) throw new Error("Failed to submit form");

  return submission[0];
}

export async function getAllFormSubmissions(limit: number = 100): Promise<FormSubmission[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(formSubmissions)
    .orderBy(desc(formSubmissions.submittedAt))
    .limit(limit);

  return result;
}

// ============================================================================
// POSTS FUNCTIONS (Bulletin/News Feed)
// ============================================================================

export async function getAllPosts(limit: number = 50): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.is_published, true))
    .orderBy(desc(posts.is_pinned), desc(posts.published_at))
    .limit(limit);

  return result;
}

export async function getPostById(id: string): Promise<Post | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  // Increment view count
  if (result[0]) {
    await db
      .update(posts)
      .set({ view_count: (result[0].view_count || 0) + 1 })
      .where(eq(posts.id, id));
  }

  return result[0];
}

export async function searchPosts(query: string, limit: number = 50): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];

  const searchPattern = `%${query}%`;

  const result = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.is_published, true),
        or(
          like(posts.title, searchPattern),
          like(posts.content, searchPattern)
        )
      )
    )
    .orderBy(desc(posts.published_at))
    .limit(limit);

  return result;
}

export async function createPost(data: Omit<InsertPost, 'id' | 'created_at' | 'updated_at'>): Promise<Post> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { nanoid } = await import("nanoid");
  const id = nanoid();

  await db.insert(posts).values({
    id,
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const post = await getPostById(id);
  if (!post) throw new Error("Failed to create post");

  return post;
}

export async function updatePost(
  postId: string,
  data: Partial<InsertPost>
): Promise<Post | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(posts)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(posts.id, postId));

  return await getPostById(postId);
}

export async function deletePost(postId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Soft delete by unpublishing
  await db
    .update(posts)
    .set({ is_published: false })
    .where(eq(posts.id, postId));

  return true;
}

// ============================================================================
// DOCUMENTS FUNCTIONS (Training Center/Knowledge Hub)
// ============================================================================

export async function getAllDocuments(limit: number = 100): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(documents)
    .where(eq(documents.is_public, true))
    .orderBy(documents.category, documents.order_index, desc(documents.created_at))
    .limit(limit);

  return result;
}

export async function getDocumentsByCategory(category: string, limit: number = 100): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.category, category as any),
        eq(documents.is_public, true)
      )
    )
    .orderBy(documents.order_index, desc(documents.created_at))
    .limit(limit);

  return result;
}

export async function getDocumentById(id: string): Promise<Document | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  // Increment view count
  if (result[0]) {
    await db
      .update(documents)
      .set({ view_count: (result[0].view_count || 0) + 1 })
      .where(eq(documents.id, id));
  }

  return result[0];
}

export async function searchDocuments(query: string, limit: number = 50): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];

  const searchPattern = `%${query}%`;

  const result = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.is_public, true),
        or(
          like(documents.title, searchPattern),
          like(documents.description, searchPattern)
        )
      )
    )
    .orderBy(desc(documents.created_at))
    .limit(limit);

  return result;
}

export async function createDocument(data: Omit<InsertDocument, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { nanoid } = await import("nanoid");
  const id = nanoid();

  await db.insert(documents).values({
    id,
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const document = await getDocumentById(id);
  if (!document) throw new Error("Failed to create document");

  return document;
}

export async function updateDocument(
  documentId: string,
  data: Partial<InsertDocument>
): Promise<Document | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(documents)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(documents.id, documentId));

  return await getDocumentById(documentId);
}

export async function deleteDocument(documentId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(documents)
    .where(eq(documents.id, documentId));

  return true;
}

export async function incrementDocumentDownload(documentId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const doc = await getDocumentById(documentId);
  if (doc) {
    await db
      .update(documents)
      .set({ download_count: (doc.download_count || 0) + 1 })
      .where(eq(documents.id, documentId));
  }
}

// ============================================================================
// COMMENTS FUNCTIONS (Universal Commenting System)
// ============================================================================

export async function getComments(
  commentableType: string,
  commentableId: string
): Promise<Comment[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.commentable_type, commentableType as any),
        eq(comments.commentable_id, commentableId),
        eq(comments.is_deleted, false)
      )
    )
    .orderBy(comments.created_at);

  return result;
}

export async function getCommentById(id: string): Promise<Comment | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);

  return result[0];
}

export async function createComment(data: Omit<InsertComment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { nanoid } = await import("nanoid");
  const id = nanoid();

  await db.insert(comments).values({
    id,
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const comment = await getCommentById(id);
  if (!comment) throw new Error("Failed to create comment");

  return comment;
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<Comment | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(comments)
    .set({
      content,
      is_edited: true,
      updated_at: new Date(),
    })
    .where(eq(comments.id, commentId));

  return await getCommentById(commentId);
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Soft delete
  await db
    .update(comments)
    .set({ is_deleted: true })
    .where(eq(comments.id, commentId));

  return true;
}

// ============================================================================
// REACTIONS FUNCTIONS (Likes, etc.)
// ============================================================================

export async function getReactionCount(
  reactableType: string,
  reactableId: string
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.reactable_type, reactableType),
        eq(reactions.reactable_id, reactableId)
      )
    );

  return result.length;
}

export async function getUserReaction(
  reactableType: string,
  reactableId: string,
  userId: string
): Promise<Reaction | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.reactable_type, reactableType),
        eq(reactions.reactable_id, reactableId),
        eq(reactions.user_id, userId)
      )
    )
    .limit(1);

  return result[0];
}

export async function toggleReaction(
  reactableType: string,
  reactableId: string,
  userId: string,
  reactionType: string = "like"
): Promise<{ added: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserReaction(reactableType, reactableId, userId);

  if (existing) {
    // Remove reaction
    await db
      .delete(reactions)
      .where(eq(reactions.id, existing.id));
    return { added: false };
  } else {
    // Add reaction
    const { nanoid } = await import("nanoid");
    const id = nanoid();

    await db.insert(reactions).values({
      id,
      reactable_type: reactableType,
      reactable_id: reactableId,
      user_id: userId,
      reaction_type: reactionType,
      created_at: new Date(),
    });
    return { added: true };
  }
}

