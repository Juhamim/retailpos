import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import { useProductStore } from "./product-store";

export interface AuditItem {
  productId: string;
  productName: string;
  productSku: string;
  systemQty: number;
  countedQty: number;
  variance: number;
  unitCost: number;
  varianceValue: number;
}

export interface AuditRecord {
  id: string;
  auditNumber: string;
  auditedAt: string;
  items: AuditItem[];
  totalVarianceQty: number;
  totalVarianceValue: number;
  notes: string;
  status: "submitted";
}

interface InventoryAuditState {
  audits: AuditRecord[];
  submitAudit: (record: Omit<AuditRecord, "id" | "auditedAt" | "status">) => AuditRecord;
}

export const useInventoryAuditStore = create<InventoryAuditState>()(
  persist(
    (set, get) => ({
      audits: [],

      submitAudit: (recordData) => {
        const id = `aud-${Date.now()}`;
        const auditedAt = new Date().toISOString();
        const newRecord: AuditRecord = {
          ...recordData,
          id,
          auditedAt,
          status: "submitted",
        };

        // Reconcile stock quantities in product store - apply signed variance directly
        const { adjustStock } = useProductStore.getState();
        for (const item of recordData.items) {
          if (item.variance !== 0) {
            adjustStock(
              item.productId,
              item.variance,
              item.variance > 0 ? "restock" : "damage",
              `Physical Stock Audit (Ref: ${recordData.auditNumber})`
            );
          }
        }

        set((state) => ({
          audits: [newRecord, ...state.audits],
        }));

        return newRecord;
      },
    }),
    {
      name: "retailflow-audits-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
