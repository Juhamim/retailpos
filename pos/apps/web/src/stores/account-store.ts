import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";

export type AccountType = "cash" | "bank";
export type AdjustmentType = "in" | "out";

export interface TreasuryAdjustment {
  id: string;
  account: AccountType;
  type: AdjustmentType;
  amount: number;
  category: string; // e.g. "Owner Capital", "Cash Drop to Bank", "Petty Cash", "Change Addition", "Bank Fee"
  note?: string;
  performedBy?: string;
  createdAt: string;
}

interface AccountState {
  initialCashBalance: number;
  initialBankBalance: number;
  adjustments: TreasuryAdjustment[];
  
  setInitialCashBalance: (amount: number) => void;
  setInitialBankBalance: (amount: number) => void;
  recordAdjustment: (data: Omit<TreasuryAdjustment, "id" | "createdAt">) => TreasuryAdjustment;
  deleteAdjustment: (id: string) => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      initialCashBalance: 2500, // Default baseline cash float in drawer
      initialBankBalance: 25000, // Default baseline bank/UPI account balance
      adjustments: [],

      setInitialCashBalance: (amount) => set({ initialCashBalance: Math.max(0, amount) }),
      setInitialBankBalance: (amount) => set({ initialBankBalance: Math.max(0, amount) }),

      recordAdjustment: (data) => {
        const id = `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newAdj: TreasuryAdjustment = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          adjustments: [newAdj, ...state.adjustments],
        }));
        return newAdj;
      },

      deleteAdjustment: (id) =>
        set((state) => ({
          adjustments: state.adjustments.filter((a) => a.id !== id),
        })),
    }),
    {
      name: "retailflow-account-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
