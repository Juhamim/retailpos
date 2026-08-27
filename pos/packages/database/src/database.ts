export interface DatabaseAdapter {
  select<T>(table: string, conditions?: unknown[], options?: { orderBy?: string; limit?: number; offset?: number }): T[];
  insert(table: string, data: Record<string, unknown>): void;
  update(table: string, data: Record<string, unknown>, conditions: Record<string, unknown>): void;
  delete(table: string, conditions: Record<string, unknown>): void;
  transaction(fn: (adapter: DatabaseAdapter) => void): void;
  getTable<T>(name: string): T[];
  setTable<T>(name: string, data: T[]): void;
}

class InMemoryDatabase implements DatabaseAdapter {
  private tables: Map<string, unknown[]> = new Map();

  select<T>(table: string, conditions?: unknown[], options?: { orderBy?: string; limit?: number; offset?: number }): T[] {
    let rows = (this.tables.get(table) || []) as T[];
    if (options?.limit) rows = rows.slice(0, options.limit);
    if (options?.offset) rows = rows.slice(options.offset);
    return rows;
  }

  insert(table: string, data: Record<string, unknown>): void {
    const rows = this.tables.get(table) || [];
    rows.push(data);
    this.tables.set(table, rows);
  }

  update(table: string, data: Record<string, unknown>, conditions: Record<string, unknown>): void {
    const rows = (this.tables.get(table) || []) as Record<string, unknown>[];
    const key = Object.keys(conditions)[0];
    const val = conditions[key];
    for (const row of rows) {
      if (row[key] === val) {
        Object.assign(row, data);
      }
    }
  }

  delete(table: string, conditions: Record<string, unknown>): void {
    const rows = (this.tables.get(table) || []) as Record<string, unknown>[];
    const key = Object.keys(conditions)[0];
    const val = conditions[key];
    this.tables.set(table, rows.filter((row) => row[key] !== val));
  }

  transaction(fn: (adapter: DatabaseAdapter) => void): void {
    fn(this);
  }

  getTable<T>(name: string): T[] {
    return (this.tables.get(name) || []) as T[];
  }

  setTable<T>(name: string, data: T[]): void {
    this.tables.set(name, data);
  }
}

let dbInstance: InMemoryDatabase | null = null;

export function getDatabase(dbPath?: string): InMemoryDatabase {
  if (dbInstance) return dbInstance;
  dbInstance = new InMemoryDatabase();
  return dbInstance;
}

export function closeDatabase(): void {
  dbInstance = null;
}

export type { InMemoryDatabase };
