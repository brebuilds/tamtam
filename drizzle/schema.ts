import { pgTable, text, timestamp, varchar, integer, decimal, boolean, json, index, pgEnum } from "drizzle-orm/pg-core";

/**
 * TamerX Inventory Management Database Schema
 */

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "shop_floor", "sales", "readonly"]);
export const productStatusEnum = pgEnum("product_status", ["active", "inactive", "discontinued"]);
export const poStatusEnum = pgEnum("po_status", ["draft", "sent", "acknowledged", "received", "cancelled"]);

// ============================================================================
// USERS TABLE (Authentication)
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("readonly").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// CUSTOM FORMS SYSTEM
// ============================================================================

export const formTemplates = pgTable("form_templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  version: integer("version").notNull().default(1),
  isActive: boolean("isActive").notNull().default(true),
  fields: json("fields").notNull(),
  createdBy: varchar("createdBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const formSubmissions = pgTable("form_submissions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  templateId: varchar("templateId", { length: 64 }).notNull(),
  productId: varchar("productId", { length: 64 }),
  data: json("data").notNull(),
  submittedBy: varchar("submittedBy", { length: 64 }),
  submittedAt: timestamp("submittedAt").defaultNow(),
  status: varchar("status", { length: 50 }).default("submitted"),
  notes: text("notes"),
});

export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = typeof formTemplates.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;

// ============================================================================
// PRODUCTS TABLE (Steering Rack Components)
// ============================================================================

export const products = pgTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),

  // Primary identifiers
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 128 }),

  // Access DB specific fields
  precision_number: varchar("precision_number", { length: 100 }),
  quality_number: varchar("quality_number", { length: 100 }),

  // Component part numbers
  driver_bellow: varchar("driver_bellow", { length: 100 }),
  passenger_bellow: varchar("passenger_bellow", { length: 100 }),
  tie_rod_driver: varchar("tie_rod_driver", { length: 100 }),
  tie_rod_passenger: varchar("tie_rod_passenger", { length: 100 }),

  // Technical specifications
  cast_number: varchar("cast_number", { length: 100 }),
  application: varchar("application", { length: 255 }),
  pressure_fitting: varchar("pressure_fitting", { length: 100 }),
  return_fitting: varchar("return_fitting", { length: 100 }),
  rack_sim_adapter: varchar("rack_sim_adapter", { length: 100 }),
  rack_sim_stop: varchar("rack_sim_stop", { length: 100 }),

  // Tools and components
  cutter: varchar("cutter", { length: 100 }),
  bushing: varchar("bushing", { length: 100 }),
  base: varchar("base", { length: 100 }),
  installer: varchar("installer", { length: 100 }),
  sleeve: varchar("sleeve", { length: 100 }),
  timing: varchar("timing", { length: 50 }),

  // Application info
  years: varchar("years", { length: 100 }),

  // Part classification codes
  ups: varchar("ups", { length: 100 }),
  lps: varchar("lps", { length: 100 }),
  mcs: varchar("mcs", { length: 100 }),
  bhs: varchar("bhs", { length: 100 }),
  pt_x4: varchar("pt_x4", { length: 100 }),
  ppt: varchar("ppt", { length: 100 }),

  // Components lists
  o_rings: varchar("o_rings", { length: 500 }),
  other_parts: varchar("other_parts", { length: 500 }),

  // Bushing details
  bushing_driver: varchar("bushing_driver", { length: 100 }),
  bushing_passenger: varchar("bushing_passenger", { length: 100 }),
  bushing_insert: varchar("bushing_insert", { length: 100 }),

  // Measurements
  turns: varchar("turns", { length: 50 }),
  oal: varchar("oal", { length: 50 }),

  // Additional info
  comments: text("comments"),
  oe_number: varchar("oe_number", { length: 255 }),

  // Inventory management
  stock_quantity: integer("stock_quantity").default(0),
  reorder_point: integer("reorder_point").default(5),
  unit_cost: integer("unit_cost"), // Stored in cents
  unit_price: integer("unit_price"), // Stored in cents

  // Images - JSON array of image URLs
  images: json("images"), // Array of image URLs: string[]
  primary_image: text("primary_image"), // URL of primary image

  // Status
  status: productStatusEnum("status").default("active"),

  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  skuIdx: index("sku_idx").on(table.sku),
  precisionIdx: index("precision_idx").on(table.precision_number),
  qualityIdx: index("quality_idx").on(table.quality_number),
  applicationIdx: index("application_idx").on(table.application),
  categoryIdx: index("category_idx").on(table.category),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export const vendors = pgTable("vendors", {
  id: varchar("id", { length: 64 }).primaryKey(),
  vendor_code: varchar("vendor_code", { length: 64 }).notNull().unique(),
  vendor_name: varchar("vendor_name", { length: 255 }).notNull(),
  contact_name: varchar("contact_name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  lead_time_days: integer("lead_time_days").default(0),
  payment_terms: text("payment_terms"),
  notes: text("notes"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  vendorCodeIdx: index("vendor_code_idx").on(table.vendor_code),
}));

export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  po_number: varchar("po_number", { length: 128 }).notNull().unique(),
  vendor_id: varchar("vendor_id", { length: 64 }).notNull(),
  po_date: timestamp("po_date").notNull(),
  expected_delivery_date: timestamp("expected_delivery_date"),
  actual_delivery_date: timestamp("actual_delivery_date"),
  status: poStatusEnum("status").default("draft"),
  total_amount: integer("total_amount").default(0), // Stored in cents
  notes: text("notes"),
  created_by: varchar("created_by", { length: 64 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  poNumberIdx: index("po_number_idx").on(table.po_number),
  vendorIdx: index("vendor_idx").on(table.vendor_id),
  statusIdx: index("status_idx").on(table.status),
}));

export const poLineItems = pgTable("po_line_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  po_id: varchar("po_id", { length: 64 }).notNull(),
  line_number: integer("line_number").notNull(),
  product_id: varchar("product_id", { length: 64 }),
  part_number: varchar("part_number", { length: 128 }).notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unit_price: integer("unit_price").notNull(), // Stored in cents
  total_price: integer("total_price").notNull(), // Stored in cents
  received_quantity: integer("received_quantity").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  poIdx: index("po_idx").on(table.po_id),
  productIdx: index("product_idx").on(table.product_id),
}));

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type POLineItem = typeof poLineItems.$inferSelect;
export type InsertPOLineItem = typeof poLineItems.$inferInsert;

