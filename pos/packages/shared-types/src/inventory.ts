import { InventoryTransactionType } from "./enums";

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  reorderLevel: number;
  lastRestockedAt?: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: InventoryTransactionType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceId?: string;
  userId: string;
  createdAt: string;
}
