import { pgTable, text, timestamp, varchar, integer, boolean, serial, pgEnum } from "drizzle-orm/pg-core";

// Enums para PostgreSQL
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const accountTypeEnum = pgEnum("account_type", ["receita", "despesa"]);
export const importTypeEnum = pgEnum("import_type", ["receita", "despesa"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Plano de Contas
 */
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull(), // Código da conta (ex: 1.1, 2.1.1)
  name: varchar("name", { length: 255 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  parentId: integer("parentId"), // Referência à conta pai (para subcontas)
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Safras
 */
export const safras = pgTable("safras", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: Safra 2025/2026
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  active: boolean("active").default(true).notNull(), // Se false, não aparece em lançamentos
  finalized: boolean("finalized").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Safra = typeof safras.$inferSelect;
export type InsertSafra = typeof safras.$inferInsert;

/**
 * Produtos da leiteria
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Preço em centavos
  unit: varchar("unit", { length: 50 }).default("unidade"), // unidade, litro, kg, etc
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Clientes
 */
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Custos/Despesas (com conta/subconta e período mensal)
 */
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  accountId: integer("accountId").notNull(), // Referência ao centro
  subAccountId: integer("subAccountId"), // Referência ao subcentro (opcional)
  safraId: integer("safraId"), // Referência à safra (opcional)
  description: varchar("description", { length: 255 }).notNull(),
  amount: integer("amount").notNull(), // Valor em centavos
  month: integer("month").notNull(), // Mês (1-12)
  year: integer("year").notNull(), // Ano
  date: timestamp("date").notNull(), // Data específica do lançamento
  paid: boolean("paid").default(false).notNull(),
  notes: text("notes"),
  importBatchId: varchar("importBatchId", { length: 100 }), // ID do lote de importação
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Receitas (com conta/subconta/quantidade/valor unitário)
 */
export const revenues = pgTable("revenues", {
  id: serial("id").primaryKey(),
  accountId: integer("accountId").notNull(), // Referência ao centro
  subAccountId: integer("subAccountId"), // Referência ao subcentro (opcional)
  safraId: integer("safraId"), // Referência à safra (opcional)
  description: varchar("description", { length: 255 }).notNull(),
  quantity: integer("quantity").default(1).notNull(), // Quantidade (litros)
  unitPrice: integer("unitPrice").notNull(), // Valor unitário em centavos
  totalAmount: integer("totalAmount").notNull(), // Valor total em centavos (quantity * unitPrice)
  customerId: integer("customerId"), // Referência ao cliente (opcional)
  productId: integer("productId"), // Referência ao produto (opcional)
  date: timestamp("date").notNull(),
  received: boolean("received").default(false).notNull(), // Se foi recebido
  notes: text("notes"),
  importBatchId: varchar("importBatchId", { length: 100 }), // ID do lote de importação
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Revenue = typeof revenues.$inferSelect;
export type InsertRevenue = typeof revenues.$inferInsert;

/**
 * Vendas (mantido para compatibilidade)
 */
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customerId"),
  productId: integer("productId").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unitPrice").notNull(), // Preço unitário em centavos
  totalAmount: integer("totalAmount").notNull(), // Valor total em centavos
  date: timestamp("date").notNull(),
  paid: boolean("paid").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * Histórico de Importações
 */
export const importHistory = pgTable("importHistory", {
  id: serial("id").primaryKey(),
  batchId: varchar("batchId", { length: 100 }).notNull().unique(),
  type: importTypeEnum("type").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  recordsCount: integer("recordsCount").notNull(),
  successCount: integer("successCount").notNull(),
  errorCount: integer("errorCount").notNull(),
  errors: text("errors"), // JSON com erros
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ImportHistory = typeof importHistory.$inferSelect;
export type InsertImportHistory = typeof importHistory.$inferInsert;

