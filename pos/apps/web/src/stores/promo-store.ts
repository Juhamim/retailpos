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

const INITIAL_RULES: PromoRule[] = [];

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
