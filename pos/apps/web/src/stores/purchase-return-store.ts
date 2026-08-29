import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import { useProductStore } from "./product-store";

export interface PurchaseReturnItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  purchasePrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface PurchaseReturnRecord {
  id: string;
  purchaseId: string;
  purchaseInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
  itemsReturned: PurchaseReturnItem[];
  totalRefundAmount: number;
  debitNoteNumber: string;
  notes: string;
  createdAt: string;
}

interface PurchaseReturnState {
  returns: PurchaseReturnRecord[];
  addPurchaseReturn: (record: Omit<PurchaseReturnRecord, "id" | "createdAt" | "debitNoteNumber">) => PurchaseReturnRecord;
}

export const usePurchaseReturnStore = create<PurchaseReturnState>()(
  persist(
    (set, get) => ({
      returns: [],

      addPurchaseReturn: (recordData) => {
        const id = `pret-${Date.now()}`;
        const debitNoteNumber = `DN-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
        const newRecord: PurchaseReturnRecord = {
          ...recordData,
          id,
          debitNoteNumber,
          createdAt: new Date().toISOString(),
        };

        // Deduct quantities from product catalog (defective return out)
        const { adjustStock } = useProductStore.getState();
        for (const item of recordData.itemsReturned) {
          adjustStock(
            item.productId,
            -item.quantity, // Negative delta to deduct stock
            "damage",
            `Supplier Purchase Return (Debit Note: ${debitNoteNumber})`
          );
        }

        set((state) => ({
          returns: [newRecord, ...state.returns],
        }));

        return newRecord;
      },
    }),
    {
      name: "retailflow-purchase-returns-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
