import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import { generateId, getCurrentISO } from "./utils";
import type { ProductRow } from "@retailflow/database";

export class ProductService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  getAll(options?: {
    search?: string;
    categoryId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) {
    let rows = this.db.getTable<ProductRow>("products");

    if (options?.search) {
      const term = options.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.sku.toLowerCase().includes(term) ||
          r.barcode?.toLowerCase().includes(term)
      );
    }

    if (options?.categoryId) {
      rows = rows.filter((r) => r.category_id === options.categoryId);
    }

    if (options?.status) {
      rows = rows.filter((r) => r.status === options.status);
    }

    if (options?.sortBy === "name") {
      rows.sort((a, b) =>
        options.sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    } else {
      rows.sort((a, b) =>
        options?.sortOrder === "asc"
          ? a.updated_at.localeCompare(b.updated_at)
          : b.updated_at.localeCompare(a.updated_at)
      );
    }

    if (options?.offset) {
      rows = rows.slice(options.offset);
    }

    if (options?.limit) {
      rows = rows.slice(0, options.limit);
    }

    return rows;
  }

  getById(id: string) {
    return this.db
      .getTable<ProductRow>("products")
      .find((r) => r.id === id) || null;
  }

  getByBarcode(barcode: string) {
    return this.db
      .getTable<ProductRow>("products")
      .find((r) => r.barcode === barcode) || null;
  }

  getBySku(sku: string) {
    return this.db
      .getTable<ProductRow>("products")
      .find((r) => r.sku === sku) || null;
  }

  search(term: string) {
    const lowerTerm = term.toLowerCase();
    return this.db
      .getTable<ProductRow>("products")
      .filter(
        (r) =>
          r.status === "active" &&
          (r.name.toLowerCase().includes(lowerTerm) ||
            r.sku.toLowerCase().includes(lowerTerm) ||
            r.barcode?.toLowerCase().includes(lowerTerm))
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 50);
  }

  create(data: Omit<ProductRow, "id" | "created_at" | "updated_at">) {
    const id = generateId();
    const now = getCurrentISO();
    const row: ProductRow = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    } as ProductRow;
    this.db.insert("products", row as unknown as Record<string, unknown>);
    return this.getById(id)!;
  }

  update(id: string, data: Partial<ProductRow>) {
    const now = getCurrentISO();
    this.db.update("products", { ...data, updated_at: now } as Record<string, unknown>, { id });
    return this.getById(id)!;
  }

  archive(id: string) {
    return this.update(id, { status: "archived" } as Partial<ProductRow>);
  }

  restore(id: string) {
    return this.update(id, { status: "active" } as Partial<ProductRow>);
  }

  count(options?: { status?: string; categoryId?: string }) {
    let rows = this.db.getTable<ProductRow>("products");
    if (options?.status) rows = rows.filter((r) => r.status === options.status);
    if (options?.categoryId) rows = rows.filter((r) => r.category_id === options.categoryId);
    return rows.length;
  }

  getLowStockProducts(threshold?: number) {
    return this.db
      .getTable<ProductRow>("products")
      .filter(
        (r) => r.status === "active" && r.stock_quantity <= (threshold ?? r.reorder_level)
      )
      .sort((a, b) => a.stock_quantity - b.stock_quantity);
  }

  updateStock(id: string, newQuantity: number) {
    return this.update(id, { stock_quantity: newQuantity } as Partial<ProductRow>);
  }
}
