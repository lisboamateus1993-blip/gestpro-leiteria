import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Plano de Contas
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 50 }).notNull(), // Código da conta (ex: 1.1, 2.1.1)
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["receita", "despesa"]).notNull(),
  parentId: int("parentId"), // Referência à conta pai (para subcontas)
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Safras
 */
export const safras = mysqlTable("safras", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: Safra 2025/2026
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  active: boolean("active").default(true).notNull(), // Se false, não aparece em lançamentos
  finalized: boolean("finalized").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Safra = typeof safras.$inferSelect;
export type InsertSafra = typeof safras.$inferInsert;

/**
 * Produtos da leiteria
 */
export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: int("price").notNull(), // Preço em centavos
  unit: varchar("unit", { length: 50 }).default("unidade"), // unidade, litro, kg, etc
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Clientes
 */
export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Custos/Despesas (com conta/subconta e período mensal)
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").primaryKey().autoincrement(),
  accountId: int("accountId").notNull(), // Referência ao centro
  subAccountId: int("subAccountId"), // Referência ao subcentro (opcional)
  safraId: int("safraId"), // Referência à safra (opcional)
  description: varchar("description", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // Valor em centavos
  month: int("month").notNull(), // Mês (1-12)
  year: int("year").notNull(), // Ano
  date: timestamp("date").notNull(), // Data específica do lançamento
  paid: boolean("paid").default(false).notNull(),
  notes: text("notes"),
  importBatchId: varchar("importBatchId", { length: 100 }), // ID do lote de importação
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Receitas (com conta/subconta/quantidade/valor unitário)
 */
export const revenues = mysqlTable("revenues", {
  id: int("id").primaryKey().autoincrement(),
  accountId: int("accountId").notNull(), // Referência ao centro
  subAccountId: int("subAccountId"), // Referência ao subcentro (opcional)
  safraId: int("safraId"), // Referência à safra (opcional)
  description: varchar("description", { length: 255 }).notNull(),
  quantity: int("quantity").default(1).notNull(), // Quantidade (litros)
  unitPrice: int("unitPrice").notNull(), // Valor unitário em centavos
  totalAmount: int("totalAmount").notNull(), // Valor total em centavos (quantity * unitPrice)
  customerId: int("customerId"), // Referência ao cliente (opcional)
  productId: int("productId"), // Referência ao produto (opcional)
  date: timestamp("date").notNull(),
  received: boolean("received").default(false).notNull(), // Se foi recebido
  notes: text("notes"),
  importBatchId: varchar("importBatchId", { length: 100 }), // ID do lote de importação
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Revenue = typeof revenues.$inferSelect;
export type InsertRevenue = typeof revenues.$inferInsert;

/**
 * Vendas (mantido para compatibilidade)
 */
export const sales = mysqlTable("sales", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customerId"),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(), // Preço unitário em centavos
  totalAmount: int("totalAmount").notNull(), // Valor total em centavos
  date: timestamp("date").notNull(),
  paid: boolean("paid").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * Histórico de Importações
 */
export const importHistory = mysqlTable("importHistory", {
  id: int("id").primaryKey().autoincrement(),
  batchId: varchar("batchId", { length: 100 }).notNull().unique(),
  type: mysqlEnum("type", ["receita", "despesa"]).notNull(),
  fileName: varchar("fileName", { length: 255 }),
  recordsCount: int("recordsCount").notNull(),
  successCount: int("successCount").notNull(),
  errorCount: int("errorCount").notNull(),
  errors: text("errors"), // JSON com erros
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ImportHistory = typeof importHistory.$inferSelect;
export type InsertImportHistory = typeof importHistory.$inferInsert;

