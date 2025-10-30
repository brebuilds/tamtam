import { pgTable, text, timestamp, varchar, integer, decimal, boolean, json, index, pgEnum } from "drizzle-orm/pg-core";

/**
 * Diesel Industry Knowledge & Inventory Hub Database Schema
 */

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "shop_floor", "sales", "readonly"]);
export const productStatusEnum = pgEnum("product_status", ["active", "inactive", "discontinued"]);
export const poStatusEnum = pgEnum("po_status", ["draft", "sent", "acknowledged", "received", "cancelled"]);
export const postTypeEnum = pgEnum("post_type", ["bulletin", "news", "diesel_tech", "announcement"]);
export const documentCategoryEnum = pgEnum("document_category", ["training_video", "equipment_manual", "safety_guideline", "inventory_guide", "faq", "general"]);
export const commentableTypeEnum = pgEnum("commentable_type", ["post", "document", "training_material"]);

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

// ============================================================================
// BULLETIN / NEWS FEED (Home Page)
// ============================================================================

export const posts = pgTable("posts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  type: postTypeEnum("type").default("bulletin").notNull(),
  
  // Rich content
  excerpt: text("excerpt"),
  featured_image: text("featured_image"),
  external_link: text("external_link"), // For external diesel news articles
  tags: json("tags"), // Array of tags: string[]
  
  // Metadata
  author_id: varchar("author_id", { length: 64 }).notNull(),
  is_pinned: boolean("is_pinned").default(false),
  is_published: boolean("is_published").default(true),
  view_count: integer("view_count").default(0),
  
  // Timestamps
  published_at: timestamp("published_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("post_type_idx").on(table.type),
  authorIdx: index("post_author_idx").on(table.author_id),
  publishedIdx: index("post_published_idx").on(table.is_published),
  pinnedIdx: index("post_pinned_idx").on(table.is_pinned),
}));

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// ============================================================================
// KNOWLEDGE HUB / TRAINING CENTER
// ============================================================================

export const documents = pgTable("documents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  category: documentCategoryEnum("category").notNull(),
  
  // File information
  file_url: text("file_url"), // URL to document/video file
  file_type: varchar("file_type", { length: 100 }), // pdf, mp4, docx, etc.
  file_size: integer("file_size"), // in bytes
  thumbnail_url: text("thumbnail_url"), // For videos
  
  // For training videos
  duration: integer("duration"), // video duration in seconds
  video_platform: varchar("video_platform", { length: 50 }), // youtube, vimeo, self-hosted
  video_id: varchar("video_id", { length: 255 }), // External video ID
  
  // Metadata
  uploaded_by: varchar("uploaded_by", { length: 64 }).notNull(),
  tags: json("tags"), // Array of tags: string[]
  is_public: boolean("is_public").default(true), // Whether all employees can view
  view_count: integer("view_count").default(0),
  download_count: integer("download_count").default(0),
  
  // For FAQs and guides
  order_index: integer("order_index").default(0), // For ordering within categories
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("doc_category_idx").on(table.category),
  uploaderIdx: index("doc_uploader_idx").on(table.uploaded_by),
  publicIdx: index("doc_public_idx").on(table.is_public),
}));

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ============================================================================
// COMMENTS SYSTEM (Universal)
// ============================================================================

export const comments = pgTable("comments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  
  // Polymorphic reference - what is being commented on
  commentable_type: commentableTypeEnum("commentable_type").notNull(),
  commentable_id: varchar("commentable_id", { length: 64 }).notNull(),
  
  // Comment content
  content: text("content").notNull(),
  
  // Threading support
  parent_comment_id: varchar("parent_comment_id", { length: 64 }), // For replies
  
  // Metadata
  author_id: varchar("author_id", { length: 64 }).notNull(),
  is_edited: boolean("is_edited").default(false),
  is_deleted: boolean("is_deleted").default(false),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  commentableIdx: index("comment_commentable_idx").on(table.commentable_type, table.commentable_id),
  authorIdx: index("comment_author_idx").on(table.author_id),
  parentIdx: index("comment_parent_idx").on(table.parent_comment_id),
}));

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// ============================================================================
// REACTIONS/LIKES (Optional enhancement)
// ============================================================================

export const reactions = pgTable("reactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  
  // What is being reacted to
  reactable_type: varchar("reactable_type", { length: 50 }).notNull(), // post, comment, document
  reactable_id: varchar("reactable_id", { length: 64 }).notNull(),
  
  // Reaction details
  user_id: varchar("user_id", { length: 64 }).notNull(),
  reaction_type: varchar("reaction_type", { length: 50 }).default("like"), // like, helpful, etc.
  
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  reactableIdx: index("reaction_reactable_idx").on(table.reactable_type, table.reactable_id),
  userIdx: index("reaction_user_idx").on(table.user_id),
  uniqueReaction: index("unique_reaction_idx").on(table.reactable_type, table.reactable_id, table.user_id),
}));

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = typeof reactions.$inferInsert;

