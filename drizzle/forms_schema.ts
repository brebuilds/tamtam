import { mysqlTable, varchar, text, json, timestamp, boolean, int } from "drizzle-orm/mysql-core";

// ============================================================================
// CUSTOM FORMS SYSTEM
// ============================================================================

export const formTemplates = mysqlTable("form_templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // "product_intake", "inspection", "quality_control", etc.
  version: int("version").notNull().default(1),
  isActive: boolean("isActive").notNull().default(true),
  fields: json("fields").notNull(), // Array of field definitions
  createdBy: varchar("createdBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const formSubmissions = mysqlTable("form_submissions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  templateId: varchar("templateId", { length: 64 }).notNull(),
  productId: varchar("productId", { length: 64 }), // Optional link to product
  data: json("data").notNull(), // Form field values
  submittedBy: varchar("submittedBy", { length: 64 }),
  submittedAt: timestamp("submittedAt").defaultNow(),
  status: varchar("status", { length: 50 }).default("submitted"), // "submitted", "approved", "rejected"
  notes: text("notes"),
});

export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = typeof formTemplates.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;

// Field type definitions
export interface FormField {
  id: string;
  type: "text" | "number" | "select" | "multiselect" | "date" | "checkbox" | "textarea" | "file" | "barcode";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

