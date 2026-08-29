import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import type { Supplier } from "@retailflow/shared-types";

interface SupplierState {
  suppliers: Supplier[];
  searchQuery: string;

  setSuppliers: (suppliers: Supplier[]) => void;
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  removeSupplier: (id: string) => void;
  setSearchQuery: (query: string) => void;
  getFilteredSuppliers: () => Supplier[];
}

const INITIAL_SUPPLIERS: Supplier[] = [];

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      suppliers: INITIAL_SUPPLIERS,
      searchQuery: "",

      setSuppliers: (suppliers) => set({ suppliers }),

      addSupplier: (supplierData) => {
        const id = `sup-${Date.now()}`;
        const now = new Date().toISOString();
        const newSupplier: Supplier = {
          ...supplierData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ suppliers: [newSupplier, ...state.suppliers] }));
        return newSupplier;
      },

      updateSupplier: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: now } : s
          ),
        }));
      },

      removeSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        }));
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      getFilteredSuppliers: () => {
        const { suppliers, searchQuery } = get();
        if (!searchQuery) return suppliers;
        const q = searchQuery.toLowerCase();
        return suppliers.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
            (s.phone && s.phone.includes(q)) ||
            (s.gstNumber && s.gstNumber.toLowerCase().includes(q))
        );
      },
    }),
    {
      name: "retailflow-suppliers-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
