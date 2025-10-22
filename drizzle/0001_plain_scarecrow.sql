CREATE TABLE `automationLog` (
	`id` varchar(64) NOT NULL,
	`logId` varchar(128) NOT NULL,
	`automationType` varchar(128) NOT NULL,
	`status` enum('Success','Partial Success','Failed') NOT NULL,
	`recordsProcessed` int DEFAULT 0,
	`recordsSucceeded` int DEFAULT 0,
	`recordsFailed` int DEFAULT 0,
	`details` text,
	`errorMessage` text,
	`executionTimeMs` int,
	`triggeredBy` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `automationLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crossReferences` (
	`id` varchar(64) NOT NULL,
	`productId` varchar(64) NOT NULL,
	`alternatePartNumber` varchar(128) NOT NULL,
	`source` varchar(128),
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `crossReferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataQualityIssues` (
	`id` varchar(64) NOT NULL,
	`issueId` varchar(128) NOT NULL,
	`issueType` enum('Missing Image','Missing Description','Missing Category','Potential Duplicate','Invalid Price','Low Stock','Other') NOT NULL,
	`severity` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
	`relatedTable` varchar(64),
	`relatedRecordId` varchar(64),
	`description` text NOT NULL,
	`status` enum('Open','In Progress','Resolved','Ignored') NOT NULL DEFAULT 'Open',
	`assignedTo` varchar(64),
	`resolvedAt` timestamp,
	`resolvedBy` varchar(64),
	`resolutionNotes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `dataQualityIssues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poLineItems` (
	`id` varchar(64) NOT NULL,
	`poId` varchar(64) NOT NULL,
	`lineNumber` int NOT NULL,
	`productId` varchar(64),
	`subPartId` varchar(64),
	`partNumber` varchar(128) NOT NULL,
	`description` text,
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`totalPrice` int NOT NULL,
	`receivedQuantity` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `poLineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(64) NOT NULL,
	`partNumber` varchar(128) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` varchar(128),
	`unitCost` int DEFAULT 0,
	`sellingPrice` int DEFAULT 0,
	`stockQuantity` int DEFAULT 0,
	`reorderPoint` int DEFAULT 0,
	`magentoSku` varchar(128),
	`imageUrl` text,
	`weight` int,
	`dimensions` text,
	`compatibility` text,
	`specifications` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrders` (
	`id` varchar(64) NOT NULL,
	`poNumber` varchar(128) NOT NULL,
	`vendorId` varchar(64) NOT NULL,
	`poDate` timestamp NOT NULL,
	`expectedDeliveryDate` timestamp,
	`actualDeliveryDate` timestamp,
	`status` enum('Draft','Sent','Acknowledged','Received','Cancelled') NOT NULL DEFAULT 'Draft',
	`totalAmount` int DEFAULT 0,
	`notes` text,
	`aiMatchConfidence` int,
	`aiMatchReasoning` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `purchaseOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchHistory` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64),
	`searchQuery` text NOT NULL,
	`searchType` varchar(64) NOT NULL,
	`resultsCount` int DEFAULT 0,
	`topResultId` varchar(64),
	`executionTimeMs` int,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `searchHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subParts` (
	`id` varchar(64) NOT NULL,
	`partNumber` varchar(128) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` varchar(128),
	`unitCost` int DEFAULT 0,
	`stockQuantity` int DEFAULT 0,
	`reorderPoint` int DEFAULT 0,
	`vendorId` varchar(64),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `subParts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` varchar(64) NOT NULL,
	`vendorCode` varchar(64) NOT NULL,
	`vendorName` text NOT NULL,
	`contactName` text,
	`email` varchar(320),
	`phone` varchar(32),
	`address` text,
	`leadTimeDays` int DEFAULT 0,
	`paymentTerms` text,
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','purchasing','shop_floor','sales') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `automation_type_idx` ON `automationLog` (`automationType`);--> statement-breakpoint
CREATE INDEX `automation_status_idx` ON `automationLog` (`status`);--> statement-breakpoint
CREATE INDEX `automation_created_idx` ON `automationLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `crossRef_product_idx` ON `crossReferences` (`productId`);--> statement-breakpoint
CREATE INDEX `crossRef_alternate_idx` ON `crossReferences` (`alternatePartNumber`);--> statement-breakpoint
CREATE INDEX `issue_type_idx` ON `dataQualityIssues` (`issueType`);--> statement-breakpoint
CREATE INDEX `issue_status_idx` ON `dataQualityIssues` (`status`);--> statement-breakpoint
CREATE INDEX `issue_related_idx` ON `dataQualityIssues` (`relatedRecordId`);--> statement-breakpoint
CREATE INDEX `lineItem_po_idx` ON `poLineItems` (`poId`);--> statement-breakpoint
CREATE INDEX `lineItem_product_idx` ON `poLineItems` (`productId`);--> statement-breakpoint
CREATE INDEX `lineItem_subPart_idx` ON `poLineItems` (`subPartId`);--> statement-breakpoint
CREATE INDEX `partNumber_idx` ON `products` (`partNumber`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `magentoSku_idx` ON `products` (`magentoSku`);--> statement-breakpoint
CREATE INDEX `poNumber_idx` ON `purchaseOrders` (`poNumber`);--> statement-breakpoint
CREATE INDEX `po_vendor_idx` ON `purchaseOrders` (`vendorId`);--> statement-breakpoint
CREATE INDEX `po_status_idx` ON `purchaseOrders` (`status`);--> statement-breakpoint
CREATE INDEX `search_user_idx` ON `searchHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `search_created_idx` ON `searchHistory` (`createdAt`);--> statement-breakpoint
CREATE INDEX `subPart_partNumber_idx` ON `subParts` (`partNumber`);--> statement-breakpoint
CREATE INDEX `subPart_vendor_idx` ON `subParts` (`vendorId`);--> statement-breakpoint
CREATE INDEX `vendorCode_idx` ON `vendors` (`vendorCode`);