CREATE TYPE "public"."account_type" AS ENUM('receita', 'despesa');--> statement-breakpoint
CREATE TYPE "public"."import_type" AS ENUM('receita', 'despesa');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "account_type" NOT NULL,
	"parentId" integer,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"address" text,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"accountId" integer NOT NULL,
	"subAccountId" integer,
	"safraId" integer,
	"description" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"date" timestamp NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"notes" text,
	"importBatchId" varchar(100),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "importHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"batchId" varchar(100) NOT NULL,
	"type" "import_type" NOT NULL,
	"fileName" varchar(255),
	"recordsCount" integer NOT NULL,
	"successCount" integer NOT NULL,
	"errorCount" integer NOT NULL,
	"errors" text,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "importHistory_batchId_unique" UNIQUE("batchId")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"unit" varchar(50) DEFAULT 'unidade',
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "revenues" (
	"id" serial PRIMARY KEY NOT NULL,
	"accountId" integer NOT NULL,
	"subAccountId" integer,
	"safraId" integer,
	"description" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" integer NOT NULL,
	"totalAmount" integer NOT NULL,
	"customerId" integer,
	"productId" integer,
	"date" timestamp NOT NULL,
	"received" boolean DEFAULT false NOT NULL,
	"notes" text,
	"importBatchId" varchar(100),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "safras" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"finalized" boolean DEFAULT false NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" integer,
	"productId" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unitPrice" integer NOT NULL,
	"totalAmount" integer NOT NULL,
	"date" timestamp NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"lastSignedIn" timestamp DEFAULT now()
);
