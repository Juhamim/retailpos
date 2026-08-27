import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import { generateId, getCurrentISO } from "./utils";
import type { CustomerRow } from "@retailflow/database";

export class CustomerService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  getAll(options?: { search?: string; limit?: number; offset?: number }) {
    let rows = this.db
      .getTable<CustomerRow>("customers")
      .filter((r) => r.is_active === 1);

    if (options?.search) {
      const term = options.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.phone?.toLowerCase().includes(term)
      );
    }

    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (options?.offset) rows = rows.slice(options.offset);
    if (options?.limit) rows = rows.slice(0, options.limit);

    return rows;
  }

  getById(id: string) {
    return this.db.getTable<CustomerRow>("customers").find((r) => r.id === id) || null;
  }

  search(term: string) {
    const lowerTerm = term.toLowerCase();
    return this.db
      .getTable<CustomerRow>("customers")
      .filter(
        (r) =>
          r.is_active === 1 &&
          (r.name.toLowerCase().includes(lowerTerm) || r.phone?.toLowerCase().includes(lowerTerm))
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 20);
  }

  create(data: Omit<CustomerRow, "id" | "created_at" | "updated_at" | "loyalty_points" | "credit_balance" | "total_spent" | "total_orders" | "last_purchase_at" | "is_active">) {
    const id = generateId();
    const now = getCurrentISO();
    const row: CustomerRow = {
      ...data,
      id,
      loyalty_points: 0,
      credit_balance: 0,
      total_spent: 0,
      total_orders: 0,
      is_active: 1,
      created_at: now,
      updated_at: now,
    };
    this.db.insert("customers", row as unknown as Record<string, unknown>);
    return this.getById(id)!;
  }

  update(id: string, data: Partial<CustomerRow>) {
    this.db.update("customers", { ...data, updated_at: getCurrentISO() } as Record<string, unknown>, { id });
    return this.getById(id)!;
  }

  deactivate(id: string) {
    return this.update(id, { is_active: 0 } as Partial<CustomerRow>);
  }

  addLoyaltyPoints(id: string, points: number) {
    const customer = this.getById(id);
    if (!customer) return null;
    return this.update(id, { loyalty_points: customer.loyalty_points + points } as Partial<CustomerRow>);
  }

  updatePurchaseStats(id: string, amount: number) {
    const customer = this.getById(id);
    if (!customer) return null;
    return this.update(id, {
      total_spent: customer.total_spent + amount,
      total_orders: customer.total_orders + 1,
      last_purchase_at: getCurrentISO(),
      loyalty_points: customer.loyalty_points + Math.floor(amount),
    } as Partial<CustomerRow>);
  }

  count() {
    return this.db.getTable<CustomerRow>("customers").filter((r) => r.is_active === 1).length;
  }
}
