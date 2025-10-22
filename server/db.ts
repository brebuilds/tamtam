import { eq, like, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, Product, InsertProduct } from "../drizzle/schema";

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

