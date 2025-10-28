import { drizzle } from "drizzle-orm/mysql2";
import { expenses, revenues } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

console.log("=== Checking Expenses ===");
const expensesList = await db.select().from(expenses);
console.log("Total expenses:", expensesList.length);
console.log("Expenses:", JSON.stringify(expensesList, null, 2));

console.log("\n=== Checking Revenues ===");
const revenuesList = await db.select().from(revenues);
console.log("Total revenues:", revenuesList.length);
console.log("Revenues:", JSON.stringify(revenuesList, null, 2));
