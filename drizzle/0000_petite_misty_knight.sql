CREATE TYPE "public"."po_status" AS ENUM('draft', 'sent', 'acknowledged', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'shop_floor', 'sales', 'readonly');--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"templateId" varchar(64) NOT NULL,
	"productId" varchar(64),
	"data" json NOT NULL,
	"submittedBy" varchar(64),
	"submittedAt" timestamp DEFAULT now(),
	"status" varchar(50) DEFAULT 'submitted',
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "form_templates" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"version" integer DEFAULT 1 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"fields" json NOT NULL,
	"createdBy" varchar(64),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "po_line_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"po_id" varchar(64) NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" varchar(64),
	"part_number" varchar(128) NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"received_quantity" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(128),
	"precision_number" varchar(100),
	"quality_number" varchar(100),
	"driver_bellow" varchar(100),
	"passenger_bellow" varchar(100),
	"tie_rod_driver" varchar(100),
	"tie_rod_passenger" varchar(100),
	"cast_number" varchar(100),
	"application" varchar(255),
	"pressure_fitting" varchar(100),
	"return_fitting" varchar(100),
	"rack_sim_adapter" varchar(100),
	"rack_sim_stop" varchar(100),
	"cutter" varchar(100),
	"bushing" varchar(100),
	"base" varchar(100),
	"installer" varchar(100),
	"sleeve" varchar(100),
	"timing" varchar(50),
	"years" varchar(100),
	"ups" varchar(100),
	"lps" varchar(100),
	"mcs" varchar(100),
	"bhs" varchar(100),
	"pt_x4" varchar(100),
	"ppt" varchar(100),
	"o_rings" varchar(500),
	"other_parts" varchar(500),
	"bushing_driver" varchar(100),
	"bushing_passenger" varchar(100),
	"bushing_insert" varchar(100),
	"turns" varchar(50),
	"oal" varchar(50),
	"comments" text,
	"oe_number" varchar(255),
	"stock_quantity" integer DEFAULT 0,
	"reorder_point" integer DEFAULT 5,
	"unit_cost" integer,
	"unit_price" integer,
	"images" json,
	"primary_image" text,
	"status" "product_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"po_number" varchar(128) NOT NULL,
	"vendor_id" varchar(64) NOT NULL,
	"po_date" timestamp NOT NULL,
	"expected_delivery_date" timestamp,
	"actual_delivery_date" timestamp,
	"status" "po_status" DEFAULT 'draft',
	"total_amount" integer DEFAULT 0,
	"notes" text,
	"created_by" varchar(64),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'readonly' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"lastSignedIn" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"vendor_code" varchar(64) NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"contact_name" varchar(255),
	"email" varchar(320),
	"phone" varchar(32),
	"address" text,
	"lead_time_days" integer DEFAULT 0,
	"payment_terms" text,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendors_vendor_code_unique" UNIQUE("vendor_code")
);
--> statement-breakpoint
CREATE INDEX "po_idx" ON "po_line_items" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX "product_idx" ON "po_line_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "precision_idx" ON "products" USING btree ("precision_number");--> statement-breakpoint
CREATE INDEX "quality_idx" ON "products" USING btree ("quality_number");--> statement-breakpoint
CREATE INDEX "application_idx" ON "products" USING btree ("application");--> statement-breakpoint
CREATE INDEX "category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "po_number_idx" ON "purchase_orders" USING btree ("po_number");--> statement-breakpoint
CREATE INDEX "vendor_idx" ON "purchase_orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendor_code_idx" ON "vendors" USING btree ("vendor_code");