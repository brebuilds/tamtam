import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, decimal, boolean, json, index } from "drizzle-orm/mysql-core";

/**
 * TamerX Inventory Management Database Schema
 */

// ============================================================================
// USERS TABLE (Authentication)
// ============================================================================

export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "shop_floor", "sales", "readonly"]).default("readonly").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// CUSTOM FORMS SYSTEM
// ============================================================================

export const formTemplates = mysqlTable("form_templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  version: int("version").notNull().default(1),
  isActive: boolean("isActive").notNull().default(true),
  fields: json("fields").notNull(),
  createdBy: varchar("createdBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const formSubmissions = mysqlTable("form_submissions", {
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

export const products = mysqlTable("products", {
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
  stock_quantity: int("stock_quantity").default(0),
  reorder_point: int("reorder_point").default(5),
  unit_cost: int("unit_cost"), // Stored in cents
  unit_price: int("unit_price"), // Stored in cents
  
  // Status
  status: mysqlEnum("status", ["active", "inactive", "discontinued"]).default("active"),
  
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

