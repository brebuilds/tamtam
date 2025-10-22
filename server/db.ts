import { eq, desc, and, or, like, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  products, InsertProduct,
  subParts, InsertSubPart,
  vendors, InsertVendor,
  purchaseOrders, InsertPurchaseOrder,
  poLineItems, InsertPoLineItem,
  crossReferences, InsertCrossReference,
  dataQualityIssues, InsertDataQualityIssue,
  automationLog, InsertAutomationLog,
  searchHistory, InsertSearchHistory
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
// USER MANAGEMENT
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
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
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
// PRODUCTS
// ============================================================================

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
}

export async function getProductById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductByPartNumber(partNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(products).where(eq(products.partNumber, partNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchProducts(query: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${query}%`;
  return await db.select().from(products)
    .where(
      and(
        eq(products.isActive, true),
        or(
          like(products.partNumber, searchPattern),
          like(products.title, searchPattern),
          like(products.description, searchPattern),
          like(products.category, searchPattern)
        )
      )
    )
    .limit(limit);
}

export async function getProductsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(products)
    .where(and(eq(products.category, category), eq(products.isActive, true)))
    .orderBy(desc(products.createdAt));
}

export async function getLowStockProducts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(products)
    .where(
      and(
        eq(products.isActive, true),
        sql`${products.stockQuantity} <= ${products.reorderPoint}`
      )
    )
    .orderBy(products.stockQuantity);
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(products).values(product);
  return product;
}

export async function updateProduct(id: string, updates: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products).set({ ...updates, updatedAt: new Date() }).where(eq(products.id, id));
}

export async function updateProductStock(id: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products).set({ stockQuantity: quantity, updatedAt: new Date() }).where(eq(products.id, id));
}

// ============================================================================
// SUBPARTS & CONSUMABLES
// ============================================================================

export async function getAllSubParts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(subParts).where(eq(subParts.isActive, true)).orderBy(desc(subParts.createdAt));
}

export async function getSubPartById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(subParts).where(eq(subParts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSubPart(subPart: InsertSubPart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(subParts).values(subPart);
  return subPart;
}

export async function updateSubPartStock(id: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(subParts).set({ stockQuantity: quantity, updatedAt: new Date() }).where(eq(subParts.id, id));
}

// ============================================================================
// VENDORS
// ============================================================================

export async function getAllVendors() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(vendors).where(eq(vendors.isActive, true)).orderBy(vendors.vendorName);
}

export async function getVendorById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createVendor(vendor: InsertVendor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(vendors).values(vendor);
  return vendor;
}

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export async function getAllPurchaseOrders() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.poDate));
}

export async function getPurchaseOrderById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPurchaseOrderByNumber(poNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.poNumber, poNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOpenPurchaseOrders() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(purchaseOrders)
    .where(or(eq(purchaseOrders.status, "Sent"), eq(purchaseOrders.status, "Acknowledged")))
    .orderBy(desc(purchaseOrders.poDate));
}

export async function createPurchaseOrder(po: InsertPurchaseOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(purchaseOrders).values(po);
  return po;
}

export async function updatePurchaseOrder(id: string, updates: Partial<InsertPurchaseOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(purchaseOrders).set({ ...updates, updatedAt: new Date() }).where(eq(purchaseOrders.id, id));
}

// ============================================================================
// PO LINE ITEMS
// ============================================================================

export async function getLineItemsByPO(poId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(poLineItems).where(eq(poLineItems.poId, poId)).orderBy(poLineItems.lineNumber);
}

export async function createPoLineItem(lineItem: InsertPoLineItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(poLineItems).values(lineItem);
  return lineItem;
}

// ============================================================================
// CROSS REFERENCES
// ============================================================================

export async function getCrossReferencesByProduct(productId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(crossReferences).where(eq(crossReferences.productId, productId));
}

export async function findProductByAlternatePart(alternatePartNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(crossReferences).where(eq(crossReferences.alternatePartNumber, alternatePartNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCrossReference(crossRef: InsertCrossReference) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(crossReferences).values(crossRef);
  return crossRef;
}

// ============================================================================
// DATA QUALITY ISSUES
// ============================================================================

export async function getOpenDataQualityIssues() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(dataQualityIssues)
    .where(or(eq(dataQualityIssues.status, "Open"), eq(dataQualityIssues.status, "In Progress")))
    .orderBy(desc(dataQualityIssues.createdAt));
}

export async function createDataQualityIssue(issue: InsertDataQualityIssue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(dataQualityIssues).values(issue);
  return issue;
}

export async function resolveDataQualityIssue(id: string, resolvedBy: string, resolutionNotes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(dataQualityIssues).set({
    status: "Resolved",
    resolvedAt: new Date(),
    resolvedBy,
    resolutionNotes,
    updatedAt: new Date()
  }).where(eq(dataQualityIssues.id, id));
}

// ============================================================================
// AUTOMATION LOG
// ============================================================================

export async function getRecentAutomationLogs(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(automationLog).orderBy(desc(automationLog.createdAt)).limit(limit);
}

export async function createAutomationLog(log: InsertAutomationLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(automationLog).values(log);
  return log;
}

// ============================================================================
// SEARCH HISTORY
// ============================================================================

export async function logSearch(search: InsertSearchHistory) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(searchHistory).values(search);
}

export async function getPopularSearches(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    searchQuery: searchHistory.searchQuery,
    count: count(searchHistory.id)
  })
    .from(searchHistory)
    .groupBy(searchHistory.searchQuery)
    .orderBy(desc(count(searchHistory.id)))
    .limit(limit);
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  const [
    totalProducts,
    totalVendors,
    openPOs,
    lowStockItems,
    openIssues
  ] = await Promise.all([
    db.select({ count: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ count: count() }).from(vendors).where(eq(vendors.isActive, true)),
    db.select({ count: count() }).from(purchaseOrders).where(or(eq(purchaseOrders.status, "Sent"), eq(purchaseOrders.status, "Acknowledged"))),
    db.select({ count: count() }).from(products).where(and(eq(products.isActive, true), sql`${products.stockQuantity} <= ${products.reorderPoint}`)),
    db.select({ count: count() }).from(dataQualityIssues).where(or(eq(dataQualityIssues.status, "Open"), eq(dataQualityIssues.status, "In Progress")))
  ]);
  
  return {
    totalProducts: totalProducts[0].count,
    totalVendors: totalVendors[0].count,
    openPurchaseOrders: openPOs[0].count,
    lowStockItems: lowStockItems[0].count,
    openDataQualityIssues: openIssues[0].count
  };
}

