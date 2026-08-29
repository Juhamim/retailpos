import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import { PaymentMethod } from "@retailflow/shared-types";

export interface Shift {
  id: string;
  userId: string;
  username: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  closingFloat?: number;
  salesTotal: number;
  salesCount: number;
  paymentBreakdown: Record<PaymentMethod, number>;
  expectedCash: number;
  actualCash?: number;
  notes?: string;
  status: "open" | "closed";
}

interface ShiftState {
  shifts: Shift[];
  activeShift: Shift | null;
  openShift: (userId: string, username: string, openingFloat: number) => void;
  closeShift: (closingFloat: number, notes?: string) => void;
  addSaleToShift: (amount: number, paymentMethods: { method: PaymentMethod; amount: number }[]) => void;
}

const INITIAL_BREAKDOWN: Record<PaymentMethod, number> = {
  [PaymentMethod.CASH]: 0,
  [PaymentMethod.UPI]: 0,
  [PaymentMethod.CARD]: 0,
  [PaymentMethod.BANK_TRANSFER]: 0,
  [PaymentMethod.CREDIT]: 0,
  [PaymentMethod.GIFT_CARD]: 0,
};

export const useShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      shifts: [],
      activeShift: null,

      openShift: (userId, username, openingFloat) => {
        const active = get().activeShift;
        if (active) return; // Shift already open

        const newShift: Shift = {
          id: `shift-${Date.now()}`,
          userId,
          username,
          openedAt: new Date().toISOString(),
          openingFloat,
          salesTotal: 0,
          salesCount: 0,
          paymentBreakdown: { ...INITIAL_BREAKDOWN },
          expectedCash: openingFloat,
          status: "open",
        };

        set({ activeShift: newShift });
      },

      closeShift: (closingFloat, notes) => {
        const active = get().activeShift;
        if (!active) return;

        const closedShift: Shift = {
          ...active,
          closedAt: new Date().toISOString(),
          closingFloat,
          actualCash: closingFloat,
          notes,
          status: "closed",
        };

        set((state) => ({
          shifts: [closedShift, ...state.shifts],
          activeShift: null,
        }));
      },

      addSaleToShift: (amount, paymentMethods) => {
        const active = get().activeShift;
        if (!active) return;

        const updatedBreakdown = { ...active.paymentBreakdown };
        let cashAdded = 0;

        for (const pm of paymentMethods) {
          updatedBreakdown[pm.method] = (updatedBreakdown[pm.method] || 0) + pm.amount;
          if (pm.method === PaymentMethod.CASH) {
            cashAdded += pm.amount;
          }
        }

        const updatedShift: Shift = {
          ...active,
          salesTotal: active.salesTotal + amount,
          salesCount: active.salesCount + 1,
          paymentBreakdown: updatedBreakdown,
          expectedCash: active.expectedCash + cashAdded,
        };

        set({ activeShift: updatedShift });
      },
    }),
    {
      name: "retailflow-shift-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
