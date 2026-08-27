import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import { generateId, getCurrentISO } from "./utils";
import type { CategoryRow } from "@retailflow/database";

export class CategoryService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  getAll() {
    return this.db
      .getTable<CategoryRow>("categories")
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  getActive() {
    return this.db
      .getTable<CategoryRow>("categories")
      .filter((r) => r.is_active === 1)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  getById(id: string) {
    return this.db.getTable<CategoryRow>("categories").find((r) => r.id === id) || null;
  }

  create(data: Omit<CategoryRow, "id" | "created_at" | "updated_at">) {
    const id = generateId();
    const now = getCurrentISO();
    const row = { ...data, id, created_at: now, updated_at: now } as CategoryRow;
    this.db.insert("categories", row as unknown as Record<string, unknown>);
    return this.getById(id)!;
  }

  update(id: string, data: Partial<CategoryRow>) {
    this.db.update("categories", { ...data, updated_at: getCurrentISO() } as Record<string, unknown>, { id });
    return this.getById(id)!;
  }

  delete(id: string) {
    this.db.delete("categories", { id });
  }

  count() {
    return this.db.getTable<CategoryRow>("categories").length;
  }
}
