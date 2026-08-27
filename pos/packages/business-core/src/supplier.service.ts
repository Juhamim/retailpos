import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import { generateId, getCurrentISO } from "./utils";
import type { SupplierRow } from "@retailflow/database";

export class SupplierService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  getAll(options?: { search?: string; limit?: number; offset?: number }) {
    let rows = this.db
      .getTable<SupplierRow>("suppliers")
      .filter((r) => r.is_active === 1);

    if (options?.search) {
      const term = options.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.contact_person?.toLowerCase().includes(term)
      );
    }

    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (options?.offset) rows = rows.slice(options.offset);
    if (options?.limit) rows = rows.slice(0, options.limit);

    return rows;
  }

  getById(id: string) {
    return this.db.getTable<SupplierRow>("suppliers").find((r) => r.id === id) || null;
  }

  create(data: Omit<SupplierRow, "id" | "created_at" | "updated_at" | "is_active">) {
    const id = generateId();
    const now = getCurrentISO();
    const row: SupplierRow = {
      ...data,
      id,
      is_active: 1,
      created_at: now,
      updated_at: now,
    };
    this.db.insert("suppliers", row as unknown as Record<string, unknown>);
    return this.getById(id)!;
  }

  update(id: string, data: Partial<SupplierRow>) {
    this.db.update("suppliers", { ...data, updated_at: getCurrentISO() } as Record<string, unknown>, { id });
    return this.getById(id)!;
  }

  deactivate(id: string) {
    return this.update(id, { is_active: 0 } as Partial<SupplierRow>);
  }

  count() {
    return this.db.getTable<SupplierRow>("suppliers").filter((r) => r.is_active === 1).length;
  }
}
