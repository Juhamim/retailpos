import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import { useProductStore } from "./product-store";

export interface PurchaseItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  purchasePrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface PurchaseRecord {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: "paid" | "pending";
  createdAt: string;
}

interface PurchaseState {
  purchases: PurchaseRecord[];
  addPurchase: (record: Omit<PurchaseRecord, "id" | "createdAt">) => PurchaseRecord;
}

export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set, get) => ({
      purchases: [],

      addPurchase: (recordData) => {
        const id = `pur-${Date.now()}`;
        const newRecord: PurchaseRecord = {
          ...recordData,
          id,
          createdAt: new Date().toISOString(),
        };

        // Automatically restock products in the inventory catalog
        const { adjustStock } = useProductStore.getState();
        for (const item of recordData.items) {
          adjustStock(
            item.productId,
            item.quantity,
            "restock",
            `Supplier Purchase Restock (Bill: ${recordData.invoiceNumber})`
          );
        }

        set((state) => ({
          purchases: [newRecord, ...state.purchases],
        }));

        return newRecord;
      },
    }),
    {
      name: "retailflow-purchases-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
