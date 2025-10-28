import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ===== PLANO DE CONTAS =====
  accounts: router({
    list: publicProcedure.query(async () => {
      return await db.getAllAccounts();
    }),

    listByType: publicProcedure
      .input(z.object({ type: z.enum(["receita", "despesa"]) }))
      .query(async ({ input }) => {
        return await db.getAccountsByType(input.type);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAccountById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        code: z.string(),
        name: z.string(),
        type: z.enum(["receita", "despesa"]),
        parentId: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createAccount(input);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        type: z.enum(["receita", "despesa"]).optional(),
        parentId: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAccount(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAccount(input.id);
        return { success: true };
      }),
  }),

  // ===== PRODUTOS =====
  products: router({
    list: publicProcedure.query(async () => {
      return await db.getAllProducts();
    }),
    
    listActive: publicProcedure.query(async () => {
      return await db.getActiveProducts();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
        unit: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProduct(input);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        unit: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProduct(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true };
      }),
  }),

  // ===== CLIENTES =====
  customers: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCustomers();
    }),

    listActive: publicProcedure.query(async () => {
      return await db.getActiveCustomers();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCustomerById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCustomer(input);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCustomer(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCustomer(input.id);
        return { success: true };
      }),
  }),

  // ===== DESPESAS/CUSTOS =====
  expenses: router({
    list: publicProcedure.query(async () => {
      return await db.getAllExpenses();
    }),

    listByMonth: publicProcedure
      .input(z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getExpensesByMonth(input.month, input.year);
      }),

    listByDateRange: publicProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getExpensesByDateRange(input.startDate, input.endDate);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getExpenseById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        accountId: z.number(),
        subAccountId: z.number().optional(),
        safraId: z.number().optional(),
        description: z.string(),
        amount: z.number(),
        month: z.number().min(1).max(12),
        year: z.number(),
        date: z.date(),
        paid: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createExpense(input);
      }),

    importBatch: publicProcedure
      .input(z.object({
        expenses: z.array(z.object({
          accountId: z.number(),
          subAccountId: z.number().optional(),
          description: z.string(),
          amount: z.number(),
          month: z.number().min(1).max(12),
          year: z.number(),
          date: z.date(),
          paid: z.boolean().optional(),
          notes: z.string().optional(),
        })),
        batchId: z.string(),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { expenses: expenseList, batchId, fileName } = input;
        
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        try {
          const expensesWithBatchId = expenseList.map(exp => ({
            ...exp,
            importBatchId: batchId,
          }));
          
          await db.createExpenseBatch(expensesWithBatchId);
          successCount = expenseList.length;
        } catch (error) {
          errorCount = expenseList.length;
          errors.push(error instanceof Error ? error.message : "Erro desconhecido");
        }

        // Salvar histórico de importação
        await db.createImportHistory({
          batchId,
          type: "despesa",
          fileName,
          recordsCount: expenseList.length,
          successCount,
          errorCount,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
        });

        return { 
          success: errorCount === 0, 
          successCount, 
          errorCount,
          errors 
        };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        accountId: z.number().optional(),
        subAccountId: z.number().optional(),
        safraId: z.number().optional(),
        description: z.string().optional(),
        amount: z.number().optional(),
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
        date: z.date().optional(),
        paid: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateExpense(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteExpense(input.id);
        return { success: true };
      }),
  }),

  // ===== RECEITAS =====
  revenues: router({
    list: publicProcedure.query(async () => {
      return await db.getAllRevenues();
    }),

    listByDateRange: publicProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getRevenuesByDateRange(input.startDate, input.endDate);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getRevenueById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        accountId: z.number(),
        subAccountId: z.number().optional(),
        safraId: z.number().optional(),
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        totalAmount: z.number(),
        customerId: z.number().optional(),
        productId: z.number().optional(),
        date: z.date(),
        received: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createRevenue(input);
      }),

    importBatch: publicProcedure
      .input(z.object({
        revenues: z.array(z.object({
          accountId: z.number(),
          subAccountId: z.number().optional(),
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          totalAmount: z.number(),
          customerId: z.number().optional(),
          productId: z.number().optional(),
          date: z.date(),
          received: z.boolean().optional(),
          notes: z.string().optional(),
        })),
        batchId: z.string(),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { revenues: revenueList, batchId, fileName } = input;
        
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        try {
          const revenuesWithBatchId = revenueList.map(rev => ({
            ...rev,
            importBatchId: batchId,
          }));
          
          await db.createRevenueBatch(revenuesWithBatchId);
          successCount = revenueList.length;
        } catch (error) {
          errorCount = revenueList.length;
          errors.push(error instanceof Error ? error.message : "Erro desconhecido");
        }

        // Salvar histórico de importação
        await db.createImportHistory({
          batchId,
          type: "receita",
          fileName,
          recordsCount: revenueList.length,
          successCount,
          errorCount,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
        });

        return { 
          success: errorCount === 0, 
          successCount, 
          errorCount,
          errors 
        };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        accountId: z.number().optional(),
        subAccountId: z.number().optional(),
        safraId: z.number().optional(),
        description: z.string(),
        quantity: z.number().optional(),
        unitPrice: z.number().optional(),
        totalAmount: z.number().optional(),
        customerId: z.number().optional(),
        productId: z.number().optional(),
        date: z.date().optional(),
        received: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateRevenue(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRevenue(input.id);
        return { success: true };
      }),
  }),

  // ===== VENDAS =====
  sales: router({
    list: publicProcedure.query(async () => {
      return await db.getAllSales();
    }),

    listByDateRange: publicProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getSalesByDateRange(input.startDate, input.endDate);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSaleById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        customerId: z.number().optional(),
        productId: z.number(),
        quantity: z.number(),
        unitPrice: z.number(),
        totalAmount: z.number(),
        date: z.date(),
        paid: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createSale(input);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        customerId: z.number().optional(),
        productId: z.number().optional(),
        quantity: z.number().optional(),
        unitPrice: z.number().optional(),
        totalAmount: z.number().optional(),
        date: z.date().optional(),
        paid: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSale(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSale(input.id);
        return { success: true };
      }),
  }),

  // ===== HISTÓRICO DE IMPORTAÇÃO =====
  importHistory: router({
    list: publicProcedure.query(async () => {
      return await db.getAllImportHistory();
    }),
  }),

  // ===== SAFRAS =====
  safras: router({
    list: publicProcedure.query(async () => {
      return await db.getAllSafras();
    }),

    listActive: publicProcedure.query(async () => {
      return await db.getActiveSafras();
    }),

    summary: publicProcedure.query(async () => {
      return await db.getSafrasSummary();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSafraById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string(),
        startDate: z.date(),
        endDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createSafra({
          ...input,
          active: true,
          finalized: false,
        });
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSafra(id, data);
        return { success: true };
      }),

    finalize: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.finalizeSafra(input.id);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSafra(input.id);
        return { success: true };
      }),
  }),

  // ===== RELATÓRIOS =====
  reports: router({
    financialSummary: publicProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getFinancialSummary(input.startDate, input.endDate);
      }),
    
    dataByYear: publicProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ input }) => {
        return await db.getFinancialDataByYear(input.year);
      }),
  }),
});

export type AppRouter = typeof appRouter;

