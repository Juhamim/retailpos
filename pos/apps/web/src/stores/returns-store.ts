import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";

export interface ReturnedItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
}

export interface ReturnRecord {
  id: string;
  invoiceNumber: string;
  items: ReturnedItem[];
  refundAmount: number;
  refundMethod: string;
  reason: string;
  createdAt: string;
}

interface ReturnsState {
  returns: ReturnRecord[];
  addReturn: (record: Omit<ReturnRecord, "id" | "createdAt">) => ReturnRecord;
}

export const useReturnsStore = create<ReturnsState>()(
  persist(
    (set, get) => ({
      returns: [],

      addReturn: (recordData) => {
        const newRecord: ReturnRecord = {
          ...recordData,
          id: `ret-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          returns: [newRecord, ...state.returns],
        }));

        return newRecord;
      },
    }),
    {
      name: "retailflow-returns-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
