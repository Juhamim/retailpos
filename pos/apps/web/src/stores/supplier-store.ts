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

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: "sup-1", name: "Hindustan Unilever Ltd", contactPerson: "Ramesh Sharma", phone: "9820012345", email: "orders@hul-dist.com", address: "Plot 4, Industrial Area, Bangalore", gstNumber: "29AAACH1234F1Z1", notes: "FMCG Products Distributor", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sup-2", name: "Coca-Cola Beverages Pvt Ltd", contactPerson: "Anand Verma", phone: "9820023456", email: "supplies@coca-cola.in", address: "Sector 3, Bidadi Ind Area, Bangalore", gstNumber: "29AABCC5678G1Z2", notes: "Direct Beverages Supplier", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sup-3", name: "ITC Foods & Personal Care", contactPerson: "Siddharth Rao", phone: "9820034567", email: "b2b@itcportal.com", address: "ITC Green Centre, Bangalore", gstNumber: "29AAACI9876H1Z3", notes: "Biscuits & Food Products", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sup-4", name: "Nestle India Wholesale", contactPerson: "Kavita Pillai", phone: "9820045678", email: "orders.south@nestle.com", address: "Electronic City, Bangalore", gstNumber: "29AAACN4321J1Z4", notes: "Coffee & Dairy Goods", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sup-5", name: "Amul Dairy Federation", contactPerson: "Girish Patel", phone: "9820056789", email: "fresh.blr@amul.coop", address: "Dairy Circle, Bannerghatta Rd, Bangalore", gstNumber: "29AAACA2468K1Z5", notes: "Dairy & Frozen Goods", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

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
