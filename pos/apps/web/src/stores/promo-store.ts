import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";

export interface PromoRule {
  id: string;
  name: string;
  type: "bogo" | "category_discount" | "volume_discount";
  conditions: {
    buyProductId?: string;
    buyQty?: number;
    categoryId?: string;
    minQty?: number;
  };
  actions: {
    freeProductId?: string;
    freeQty?: number;
    discountPercent?: number;
    volumePrice?: number;
  };
  status: "active" | "inactive";
  createdAt: string;
}

interface PromoStoreState {
  rules: PromoRule[];
  addRule: (rule: Omit<PromoRule, "id" | "createdAt">) => PromoRule;
  toggleRuleStatus: (id: string) => void;
  deleteRule: (id: string) => void;
}

const INITIAL_RULES: PromoRule[] = [
  {
    id: "promo-1",
    name: "Mega BOGO: Buy 2 Coca-Cola, Get 1 Free!",
    type: "bogo",
    conditions: {
      buyProductId: "p1", // Coca-Cola
      buyQty: 2,
    },
    actions: {
      freeProductId: "p1",
      freeQty: 1,
    },
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "promo-2",
    name: "Weekend Special: 10% Off Beverages",
    type: "category_discount",
    conditions: {
      categoryId: "cat1", // Beverages
      minQty: 1,
    },
    actions: {
      discountPercent: 10,
    },
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "promo-3",
    name: "Volume Deal: Buy 3+ Organic Milk, get each at ₹40 (Save ₹10/ea)",
    type: "volume_discount",
    conditions: {
      buyProductId: "p2", // Organic Milk
      minQty: 3,
    },
    actions: {
      volumePrice: 40,
    },
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

export const usePromoStore = create<PromoStoreState>()(
  persist(
    (set, get) => ({
      rules: INITIAL_RULES,

      addRule: (ruleData) => {
        const id = `promo-${Date.now()}`;
        const newRule: PromoRule = {
          ...ruleData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ rules: [newRule, ...state.rules] }));
        return newRule;
      },

      toggleRuleStatus: (id) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, status: r.status === "active" ? "inactive" : "active" } : r
          ),
        }));
      },

      deleteRule: (id) => {
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
        }));
      },
    }),
    {
      name: "retailflow-promos-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
