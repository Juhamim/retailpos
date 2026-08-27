import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import { generateId, getCurrentISO } from "./utils";
import type { InventoryRow, InventoryTransactionRow } from "@retailflow/database";

export class InventoryService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  getStock(productId: string) {
    return this.db
      .getTable<InventoryRow>("inventory")
      .find((r) => r.product_id === productId) || null;
  }

  adjustStock(
    productId: string,
    type: string,
    quantityChange: number,
    reason: string,
    userId: string,
    referenceId?: string
  ) {
    const current = this.getStock(productId);
    const previousQuantity = current?.quantity ?? 0;
    const newQuantity = previousQuantity + quantityChange;

    if (newQuantity < 0) {
      throw new Error("Insufficient stock");
    }

    const now = getCurrentISO();
    const transactionId = generateId();

    if (current) {
      this.db.update("inventory", { quantity: newQuantity, updated_at: now } as Record<string, unknown>, { product_id: productId });
    } else {
      this.db.insert("inventory", {
        id: generateId(),
        product_id: productId,
        quantity: newQuantity,
        reorder_level: 10,
        updated_at: now,
      } as unknown as Record<string, unknown>);
    }

    this.db.insert("inventory_transactions", {
      id: transactionId,
      product_id: productId,
      type,
      quantity_change: quantityChange,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      reason,
      reference_id: referenceId,
      user_id: userId,
      created_at: now,
    } as unknown as Record<string, unknown>);

    return { transactionId, previousQuantity, newQuantity };
  }

  restock(productId: string, quantity: number, userId: string, referenceId?: string) {
    return this.adjustStock(productId, "restock", quantity, "Inventory restocked", userId, referenceId);
  }

  deductForSale(productId: string, quantity: number, userId: string, saleId: string) {
    return this.adjustStock(productId, "sale", -quantity, "POS Sale", userId, saleId);
  }

  returnToStock(productId: string, quantity: number, userId: string, saleId: string) {
    return this.adjustStock(productId, "return", quantity, "Sale return", userId, saleId);
  }

  getTransactions(productId: string, options?: { limit?: number }) {
    return this.db
      .getTable<InventoryTransactionRow>("inventory_transactions")
      .filter((r) => r.product_id === productId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, options?.limit ?? 100);
  }

  getAllStock() {
    return this.db.getTable<InventoryRow>("inventory");
  }

  getLowStockProducts() {
    return this.db
      .getTable<InventoryRow>("inventory")
      .filter((r) => r.quantity <= r.reorder_level);
  }
}
