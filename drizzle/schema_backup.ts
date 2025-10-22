import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean, decimal, index } from "drizzle-orm/mysql-core";

/**
 * TamerX Inventory Management Database Schema
 * 
 * This schema supports the complete inventory management system including:
 * - Products and SubParts
 * - Vendors and Purchase Orders
 * - Cross-references and compatibility
 * - Data quality tracking
 * - Automation logging
 */

// ============================================================================
// USERS TABLE (Authentication)
// ============================================================================

export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "purchasing", "shop_floor", "sales"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// PRODUCTS TABLE (Main inventory items)
// ============================================================================

export const products = mysqlTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  partNumber: varchar("partNumber", { length: 128 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 128 }),
  unitCost: int("unitCost").default(0), // Stored in cents
  sellingPrice: int("sellingPrice").default(0), // Stored in cents
  stockQuantity: int("stockQuantity").default(0),
  reorderPoint: int("reorderPoint").default(0),
  magentoSku: varchar("magentoSku", { length: 128 }),
  imageUrl: text("imageUrl"),
  weight: int("weight"), // Weight in grams
  dimensions: text("dimensions"), // JSON string: {length, width, height}
  compatibility: text("compatibility"), // JSON string: array of compatible engines/vehicles
  specifications: text("specifications"), // JSON string: key-value pairs
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  partNumberIdx: index("partNumber_idx").on(table.partNumber),
  categoryIdx: index("category_idx").on(table.category),
  magentoSkuIdx: index("magentoSku_idx").on(table.magentoSku),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============================================================================
// SUBPARTS & CONSUMABLES TABLE (Components used in assemblies)
// ============================================================================

export const subParts = mysqlTable("subParts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  partNumber: varchar("partNumber", { length: 128 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 128 }),
  unitCost: int("unitCost").default(0), // Stored in cents
  stockQuantity: int("stockQuantity").default(0),
  reorderPoint: int("reorderPoint").default(0),
  vendorId: varchar("vendorId", { length: 64 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  partNumberIdx: index("subPart_partNumber_idx").on(table.partNumber),
  vendorIdx: index("subPart_vendor_idx").on(table.vendorId),
}));

export type SubPart = typeof subParts.$inferSelect;
export type InsertSubPart = typeof subParts.$inferInsert;

// ============================================================================
// VENDORS TABLE (Supplier information)
// ============================================================================

export const vendors = mysqlTable("vendors", {
  id: varchar("id", { length: 64 }).primaryKey(),
  vendorCode: varchar("vendorCode", { length: 64 }).notNull(),
  vendorName: text("vendorName").notNull(),
  contactName: text("contactName"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  leadTimeDays: int("leadTimeDays").default(0),
  paymentTerms: text("paymentTerms"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  vendorCodeIdx: index("vendorCode_idx").on(table.vendorCode),
}));

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

// ============================================================================
// PURCHASE ORDERS TABLE (PO tracking)
// ============================================================================

export const purchaseOrders = mysqlTable("purchaseOrders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  poNumber: varchar("poNumber", { length: 128 }).notNull(),
  vendorId: varchar("vendorId", { length: 64 }).notNull(),
  poDate: timestamp("poDate").notNull(),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  actualDeliveryDate: timestamp("actualDeliveryDate"),
  status: mysqlEnum("status", ["Draft", "Sent", "Acknowledged", "Received", "Cancelled"]).default("Draft").notNull(),
  totalAmount: int("totalAmount").default(0), // Stored in cents
  notes: text("notes"),
  aiMatchConfidence: int("aiMatchConfidence"), // 0-100 for AI reconciliation confidence
  aiMatchReasoning: text("aiMatchReasoning"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  poNumberIdx: index("poNumber_idx").on(table.poNumber),
  vendorIdx: index("po_vendor_idx").on(table.vendorId),
  statusIdx: index("po_status_idx").on(table.status),
}));

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// ============================================================================
// PO LINE ITEMS TABLE (Individual items in a PO)
// ============================================================================

export const poLineItems = mysqlTable("poLineItems", {
  id: varchar("id", { length: 64 }).primaryKey(),
  poId: varchar("poId", { length: 64 }).notNull(),
  lineNumber: int("lineNumber").notNull(),
  productId: varchar("productId", { length: 64 }),
  subPartId: varchar("subPartId", { length: 64 }),
  partNumber: varchar("partNumber", { length: 128 }).notNull(),
  description: text("description"),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(), // Stored in cents
  totalPrice: int("totalPrice").notNull(), // Stored in cents
  receivedQuantity: int("receivedQuantity").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  poIdx: index("lineItem_po_idx").on(table.poId),
  productIdx: index("lineItem_product_idx").on(table.productId),
  subPartIdx: index("lineItem_subPart_idx").on(table.subPartId),
}));

export type PoLineItem = typeof poLineItems.$inferSelect;
export type InsertPoLineItem = typeof poLineItems.$inferInsert;

// ============================================================================
// CROSS REFERENCES TABLE (Alternate part numbers)
// ============================================================================

export const crossReferences = mysqlTable("crossReferences", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("productId", { length: 64 }).notNull(),
  alternatePartNumber: varchar("alternatePartNumber", { length: 128 }).notNull(),
  source: varchar("source", { length: 128 }), // e.g., "OEM", "Competitor", "Vendor"
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  productIdx: index("crossRef_product_idx").on(table.productId),
  alternateIdx: index("crossRef_alternate_idx").on(table.alternatePartNumber),
}));

export type CrossReference = typeof crossReferences.$inferSelect;
export type InsertCrossReference = typeof crossReferences.$inferInsert;

// ============================================================================
// DATA QUALITY ISSUES TABLE (Track data problems)
// ============================================================================

export const dataQualityIssues = mysqlTable("dataQualityIssues", {
  id: varchar("id", { length: 64 }).primaryKey(),
  issueId: varchar("issueId", { length: 128 }).notNull(),
  issueType: mysqlEnum("issueType", [
    "Missing Image",
    "Missing Description",
    "Missing Category",
    "Potential Duplicate",
    "Invalid Price",
    "Low Stock",
    "Other"
  ]).notNull(),
  severity: mysqlEnum("severity", ["Low", "Medium", "High", "Critical"]).default("Medium").notNull(),
  relatedTable: varchar("relatedTable", { length: 64 }), // "products", "subParts", etc.
  relatedRecordId: varchar("relatedRecordId", { length: 64 }),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["Open", "In Progress", "Resolved", "Ignored"]).default("Open").notNull(),
  assignedTo: varchar("assignedTo", { length: 64 }),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: varchar("resolvedBy", { length: 64 }),
  resolutionNotes: text("resolutionNotes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  issueTypeIdx: index("issue_type_idx").on(table.issueType),
  statusIdx: index("issue_status_idx").on(table.status),
  relatedRecordIdx: index("issue_related_idx").on(table.relatedRecordId),
}));

export type DataQualityIssue = typeof dataQualityIssues.$inferSelect;
export type InsertDataQualityIssue = typeof dataQualityIssues.$inferInsert;

// ============================================================================
// AUTOMATION LOG TABLE (Track AI automation activities)
// ============================================================================

export const automationLog = mysqlTable("automationLog", {
  id: varchar("id", { length: 64 }).primaryKey(),
  logId: varchar("logId", { length: 128 }).notNull(),
  automationType: varchar("automationType", { length: 128 }).notNull(), // "PO Reconciliation", "Data Quality", "Search", etc.
  status: mysqlEnum("status", ["Success", "Partial Success", "Failed"]).notNull(),
  recordsProcessed: int("recordsProcessed").default(0),
  recordsSucceeded: int("recordsSucceeded").default(0),
  recordsFailed: int("recordsFailed").default(0),
  details: text("details"), // JSON string with detailed results
  errorMessage: text("errorMessage"),
  executionTimeMs: int("executionTimeMs"),
  triggeredBy: varchar("triggeredBy", { length: 64 }), // User ID or "System"
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  automationTypeIdx: index("automation_type_idx").on(table.automationType),
  statusIdx: index("automation_status_idx").on(table.status),
  createdAtIdx: index("automation_created_idx").on(table.createdAt),
}));

export type AutomationLog = typeof automationLog.$inferSelect;
export type InsertAutomationLog = typeof automationLog.$inferInsert;

// ============================================================================
// SEARCH HISTORY TABLE (Track searches for analytics)
// ============================================================================

export const searchHistory = mysqlTable("searchHistory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }),
  searchQuery: text("searchQuery").notNull(),
  searchType: varchar("searchType", { length: 64 }).notNull(), // "keyword", "semantic", "barcode"
  resultsCount: int("resultsCount").default(0),
  topResultId: varchar("topResultId", { length: 64 }),
  executionTimeMs: int("executionTimeMs"),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  userIdx: index("search_user_idx").on(table.userId),
  createdAtIdx: index("search_created_idx").on(table.createdAt),
}));

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

