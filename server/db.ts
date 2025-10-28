import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, users, 
  products, InsertProduct, 
  customers, InsertCustomer, 
  sales, InsertSale,
  accounts, InsertAccount,
  expenses, InsertExpense,
  revenues, InsertRevenue,
  importHistory, InsertImportHistory,
  safras, InsertSafra
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, {
        // Configurar timezone para Brasília (GMT-3)
        prepare: false,
        onnotice: () => {}, // Silenciar avisos
      });
      _db = drizzle(client);
      // Configurar timezone da sessão
      await client`SET timezone = 'America/Sao_Paulo'`;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.id,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== PLANO DE CONTAS =====
export async function getAllAccounts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(accounts).orderBy(accounts.code);
}

export async function getAccountsByType(type: "receita" | "despesa") {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(accounts).where(eq(accounts.type, type)).orderBy(accounts.code);
}

export async function getAccountById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAccount(account: InsertAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accounts).values(account);
  return result;
}

export async function updateAccount(id: number, account: Partial<InsertAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(accounts).set(account).where(eq(accounts.id, id));
}

export async function deleteAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(accounts).where(eq(accounts.id, id));
}

// ===== PRODUTOS =====
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getActiveProducts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).where(eq(products.active, true)).orderBy(products.name);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(product);
  return result;
}

export async function updateProduct(id: number, product: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(product).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, id));
}

// ===== CLIENTES =====
export async function getAllCustomers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customers).orderBy(customers.name);
}

export async function getActiveCustomers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customers).where(eq(customers.active, true)).orderBy(customers.name);
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCustomer(customer: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customers).values(customer);
  return result;
}

export async function updateCustomer(id: number, customer: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customers).set(customer).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customers).where(eq(customers.id, id));
}

// ===== DESPESAS/CUSTOS =====
export async function getAllExpenses() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(expenses).orderBy(desc(expenses.date));
}

export async function getExpensesByMonth(month: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(expenses)
    .where(and(eq(expenses.month, month), eq(expenses.year, year)))
    .orderBy(desc(expenses.date));
}

export async function getExpensesByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(expenses)
    .where(and(gte(expenses.date, startDate), lte(expenses.date, endDate)))
    .orderBy(desc(expenses.date));
}

export async function getExpenseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createExpense(expense: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(expenses).values(expense);
  return result;
}

export async function createExpenseBatch(expenseList: InsertExpense[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(expenses).values(expenseList);
  return result;
}

export async function updateExpense(id: number, expense: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(expenses).set(expense).where(eq(expenses.id, id));
}

export async function deleteExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(expenses).where(eq(expenses.id, id));
}

// ===== RECEITAS =====
export async function getAllRevenues() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(revenues).orderBy(desc(revenues.date));
}

export async function getRevenuesByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(revenues)
    .where(and(gte(revenues.date, startDate), lte(revenues.date, endDate)))
    .orderBy(desc(revenues.date));
}

export async function getRevenueById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(revenues).where(eq(revenues.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createRevenue(revenue: InsertRevenue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(revenues).values(revenue);
  return result;
}

export async function createRevenueBatch(revenueList: InsertRevenue[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(revenues).values(revenueList);
  return result;
}

export async function updateRevenue(id: number, revenue: Partial<InsertRevenue>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(revenues).set(revenue).where(eq(revenues.id, id));
}

export async function deleteRevenue(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(revenues).where(eq(revenues.id, id));
}

// ===== VENDAS =====
export async function getAllSales() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sales).orderBy(desc(sales.date));
}

export async function getSalesByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sales)
    .where(and(gte(sales.date, startDate), lte(sales.date, endDate)))
    .orderBy(desc(sales.date));
}

export async function getSaleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSale(sale: InsertSale) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sales).values(sale);
  return result;
}

export async function updateSale(id: number, sale: Partial<InsertSale>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sales).set(sale).where(eq(sales.id, id));
}

export async function deleteSale(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sales).where(eq(sales.id, id));
}

// ===== HISTÓRICO DE IMPORTAÇÃO =====
export async function getAllImportHistory() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(importHistory).orderBy(desc(importHistory.createdAt));
}

export async function createImportHistory(history: InsertImportHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(importHistory).values(history);
  return result;
}

// ===== RELATÓRIOS =====
export async function getFinancialSummary(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { totalReceitas: 0, totalDespesas: 0, saldo: 0, totalLitros: 0 };
  
  // Buscar todos os dados e filtrar em JavaScript
  const allRevenues = await db.select().from(revenues);
  const allExpenses = await db.select().from(expenses);
  
  // Filtrar por data
  const filteredRevenues = allRevenues.filter(r => {
    const date = new Date(r.date);
    return date >= startDate && date <= endDate;
  });
  
  const filteredExpenses = allExpenses.filter(e => {
    const date = new Date(e.date);
    return date >= startDate && date <= endDate;
  });
  
  // Calcular totais
  const totalReceitas = filteredRevenues.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalDespesas = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalLitros = filteredRevenues.reduce((sum, r) => sum + r.quantity, 0);

  return {
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas,
    totalLitros,
  };
}



// ===== SAFRAS =====
export async function getAllSafras() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(safras).orderBy(desc(safras.createdAt));
}

export async function getActiveSafras() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(safras)
    .where(and(eq(safras.active, true), eq(safras.finalized, false)))
    .orderBy(desc(safras.createdAt));
}

export async function getSafraById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(safras).where(eq(safras.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSafra(safra: InsertSafra) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(safras).values(safra);
  return result;
}

export async function updateSafra(id: number, data: Partial<InsertSafra>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(safras).set(data).where(eq(safras.id, id));
}

export async function finalizeSafra(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(safras).set({ 
    finalized: true, 
    active: false,
    endDate: new Date() 
  }).where(eq(safras.id, id));
}

export async function deleteSafra(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(safras).where(eq(safras.id, id));
}

// Resumo de safra
export async function getSafrasSummary() {
  const db = await getDb();
  if (!db) return [];
  
  const allSafras = await db.select().from(safras).orderBy(desc(safras.createdAt));
  
  const summaries = await Promise.all(
    allSafras.map(async (safra) => {
      // Total de receitas
      const revenuesResult = await db.select({
        total: sql<number>`SUM(${revenues.totalAmount})`,
        litros: sql<number>`SUM(${revenues.quantity})`,
      })
      .from(revenues)
      .where(eq(revenues.safraId, safra.id));

      // Total de despesas
      const expensesResult = await db.select({
        total: sql<number>`SUM(${expenses.amount})`,
      })
      .from(expenses)
      .where(eq(expenses.safraId, safra.id));

      const totalReceitas = Number(revenuesResult[0]?.total) || 0;
      const totalDespesas = Number(expensesResult[0]?.total) || 0;
      const totalLitros = Number(revenuesResult[0]?.litros) || 0;

      return {
        ...safra,
        totalReceitas,
        totalDespesas,
        resultado: totalReceitas - totalDespesas,
        totalLitros,
        receitaPorLitro: totalLitros > 0 ? totalReceitas / totalLitros : 0,
        custoPorLitro: totalLitros > 0 ? totalDespesas / totalLitros : 0,
        resultadoPorLitro: totalLitros > 0 ? (totalReceitas - totalDespesas) / totalLitros : 0,
      };
    })
  );
  
  return summaries;
}



export async function getFinancialDataByYear(year: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar receitas e despesas do ano especificado
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const [revenuesData] = await db.execute(sql`
    SELECT 
      COALESCE(SUM(totalAmount), 0) as totalReceita,
      COALESCE(SUM(quantity), 0) as totalLitros
    FROM revenues
    WHERE DATE(date) BETWEEN ${startDate} AND ${endDate}
  `);

  const [expensesData] = await db.execute(sql`
    SELECT COALESCE(SUM(amount), 0) as totalCusto
    FROM expenses
    WHERE DATE(date) BETWEEN ${startDate} AND ${endDate}
  `);

  const revenues = (revenuesData as any)[0];
  const expenses = (expensesData as any)[0];

  const totalReceita = Number(revenues?.totalReceita || 0) / 100; // Converter de centavos
  const totalLitros = Number(revenues?.totalLitros || 0) / 100; // Converter de centésimos
  const totalCusto = Number(expenses?.totalCusto || 0) / 100; // Converter de centavos

  // Calcular preço médio de venda e custo médio por litro
  const precoVendaMedio = totalLitros > 0 ? totalReceita / totalLitros : 0;
  const custoMedioPorLitro = totalLitros > 0 ? totalCusto / totalLitros : 0;

  return {
    year,
    totalReceita,
    totalCusto,
    totalLitros,
    precoVendaMedio,
    custoMedioPorLitro,
    margem: precoVendaMedio - custoMedioPorLitro,
  };
}

