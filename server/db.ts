import { eq, like, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
  InsertFormSubmission
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

