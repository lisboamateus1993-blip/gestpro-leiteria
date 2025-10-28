CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('receita','despesa') NOT NULL,
	`parentId` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`subAccountId` int,
	`description` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`date` timestamp NOT NULL,
	`paid` boolean NOT NULL DEFAULT false,
	`notes` text,
	`importBatchId` varchar(100),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `importHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` varchar(100) NOT NULL,
	`type` enum('receita','despesa') NOT NULL,
	`fileName` varchar(255),
	`recordsCount` int NOT NULL,
	`successCount` int NOT NULL,
	`errorCount` int NOT NULL,
	`errors` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `importHistory_id` PRIMARY KEY(`id`),
	CONSTRAINT `importHistory_batchId_unique` UNIQUE(`batchId`)
);
--> statement-breakpoint
CREATE TABLE `revenues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`subAccountId` int,
	`description` varchar(255) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` int NOT NULL,
	`totalAmount` int NOT NULL,
	`customerId` int,
	`productId` int,
	`date` timestamp NOT NULL,
	`received` boolean NOT NULL DEFAULT false,
	`notes` text,
	`importBatchId` varchar(100),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revenues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `transactions`;