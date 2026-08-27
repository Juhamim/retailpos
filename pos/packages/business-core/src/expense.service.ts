import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import { generateId, getCurrentISO } from "./utils";
import type { ExpenseRow } from "@retailflow/database";

export class ExpenseService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  getAll(options?: { category?: string; startDate?: string; endDate?: string; limit?: number; offset?: number }) {
    let rows = this.db.getTable<ExpenseRow>("expenses");

    if (options?.category) {
      rows = rows.filter((r) => r.category === options.category);
    }
    if (options?.startDate) {
      rows = rows.filter((r) => r.date >= options.startDate!);
    }
    if (options?.endDate) {
      rows = rows.filter((r) => r.date <= options.endDate!);
    }

    rows.sort((a, b) => b.date.localeCompare(a.date));

    if (options?.offset) rows = rows.slice(options.offset);
    if (options?.limit) rows = rows.slice(0, options.limit);

    return rows;
  }

  getById(id: string) {
    return this.db.getTable<ExpenseRow>("expenses").find((r) => r.id === id) || null;
  }

  create(data: Omit<ExpenseRow, "id" | "created_at" | "updated_at">) {
    const id = generateId();
    const now = getCurrentISO();
    const row: ExpenseRow = { ...data, id, created_at: now, updated_at: now };
    this.db.insert("expenses", row as unknown as Record<string, unknown>);
    return this.getById(id)!;
  }

  update(id: string, data: Partial<ExpenseRow>) {
    this.db.update("expenses", { ...data, updated_at: getCurrentISO() } as Record<string, unknown>, { id });
    return this.getById(id)!;
  }

  delete(id: string) {
    this.db.delete("expenses", { id });
  }

  getTotalByDateRange(startDate: string, endDate: string) {
    return this.db
      .getTable<ExpenseRow>("expenses")
      .filter((r) => r.date >= startDate && r.date <= endDate)
      .reduce((sum, r) => sum + r.amount, 0);
  }

  getTodayExpenses() {
    const today = new Date().toISOString().slice(0, 10);
    return this.db
      .getTable<ExpenseRow>("expenses")
      .filter((r) => r.date === today);
  }

  getTodayTotal() {
    return this.getTodayExpenses().reduce((sum, e) => sum + e.amount, 0);
  }
}
