import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import { generateId, getCurrentISO } from "./utils";
import type { UserRow } from "@retailflow/database";

export class UserService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  getAll() {
    return this.db
      .getTable<UserRow>("users")
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  getById(id: string) {
    return this.db.getTable<UserRow>("users").find((r) => r.id === id) || null;
  }

  getByUsername(username: string) {
    return this.db.getTable<UserRow>("users").find((r) => r.username === username) || null;
  }

  create(data: { username: string; email: string; password_hash: string; first_name: string; last_name: string; role: string; pin?: string }) {
    const id = generateId();
    const now = getCurrentISO();
    const row: UserRow = {
      ...data,
      id,
      is_active: 1,
      created_at: now,
      updated_at: now,
    };
    this.db.insert("users", row as unknown as Record<string, unknown>);
    return this.getById(id)!;
  }

  update(id: string, data: Partial<UserRow>) {
    this.db.update("users", { ...data, updated_at: getCurrentISO() } as Record<string, unknown>, { id });
    return this.getById(id)!;
  }

  updateLastLogin(id: string) {
    this.db.update("users", { last_login_at: getCurrentISO(), updated_at: getCurrentISO() } as Record<string, unknown>, { id });
  }

  getByPin(pin: string) {
    return this.db
      .getTable<UserRow>("users")
      .find((r) => r.pin === pin && r.is_active === 1) || null;
  }

  count() {
    return this.db.getTable<UserRow>("users").length;
  }
}
