import { create } from "zustand";
import type {
  Inventory,
  InventoryTransaction,
} from "@retailflow/shared-types";
import { InventoryTransactionType } from "@retailflow/shared-types";

interface InventoryState {
  inventory: Inventory[];
  transactions: InventoryTransaction[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  showLowStockOnly: boolean;

  setInventory: (inventory: Inventory[]) => void;
  updateStock: (productId: string, quantity: number) => void;
  setTransactions: (transactions: InventoryTransaction[]) => void;
  addTransaction: (transaction: InventoryTransaction) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowLowStockOnly: (show: boolean) => void;
  getFilteredInventory: (products: { id: string; name: string }[]) => Inventory[];
  getLowStockProducts: (products: { id: string; name: string }[]) => { id: string; name: string; quantity: number; reorderLevel: number }[];
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  inventory: [],
  transactions: [],
  loading: false,
  error: null,
  searchQuery: "",
  showLowStockOnly: false,

  setInventory: (inventory) => set({ inventory }),
  updateStock: (productId, quantity) =>
    set((state) => ({
      inventory: state.inventory.map((inv) =>
        inv.productId === productId ? { ...inv, quantity } : inv
      ),
    })),
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowLowStockOnly: (show) => set({ showLowStockOnly: show }),

  getFilteredInventory: (products) => {
    const { inventory, searchQuery, showLowStockOnly } = get();
    return inventory.filter((inv) => {
      const product = products.find((p) => p.id === inv.productId);
      if (!product) return false;
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLowStock = !showLowStockOnly || inv.quantity <= inv.reorderLevel;
      return matchesSearch && matchesLowStock;
    });
  },

  getLowStockProducts: (products) => {
    const { inventory } = get();
    return inventory
      .filter((inv) => inv.quantity <= inv.reorderLevel)
      .map((inv) => {
        const product = products.find((p) => p.id === inv.productId);
        return {
          id: inv.productId,
          name: product?.name ?? "Unknown",
          quantity: inv.quantity,
          reorderLevel: inv.reorderLevel,
        };
      });
  },
}));
