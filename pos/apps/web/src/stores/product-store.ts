import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import type { ProductWithCategory, Category, Brand } from "@retailflow/shared-types";
import { ProductStatus, GSTRate } from "@retailflow/shared-types";
import { playBeep } from "@/lib/audio";

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  quantityChange: number;
  newStock: number;
  type: "restock" | "damage" | "audit" | "sale";
  reason: string;
  createdAt: string;
}

interface ProductState {
  products: ProductWithCategory[];
  categories: Category[];
  brands: Brand[];
  stockAdjustments: StockAdjustment[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedStatus: ProductStatus | null;

  setProducts: (products: ProductWithCategory[]) => void;
  addProduct: (product: Omit<ProductWithCategory, "id" | "createdAt" | "updatedAt">) => ProductWithCategory;
  updateProduct: (id: string, updates: Partial<ProductWithCategory>) => void;
  removeProduct: (id: string) => void;
  adjustStock: (productId: string, quantityChange: number, type: "restock" | "damage" | "audit", reason?: string) => void;
  deductStockForSale: (items: { productId: string; quantity: number }[]) => void;

  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;

  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setSelectedStatus: (status: ProductStatus | null) => void;
  getFilteredProducts: () => ProductWithCategory[];
}

const INITIAL_CATEGORIES: Category[] = [];

const INITIAL_PRODUCTS: ProductWithCategory[] = [];

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,
      brands: [],
      stockAdjustments: [],
      searchQuery: "",
      selectedCategory: null,
      selectedStatus: null,

      setProducts: (products) => set({ products }),

      addProduct: (productData) => {
        const id = `prod-${Date.now()}`;
        const now = new Date().toISOString();
        const newProduct: ProductWithCategory = {
          ...productData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ products: [newProduct, ...state.products] }));
        playBeep();
        return newProduct;
      },

      updateProduct: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now } : p
          ),
        }));
      },

      removeProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },

      adjustStock: (productId, quantityChange, type, reason = "") => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;

        const previousStock = product.stockQuantity;
        const newStock = Math.max(0, previousStock + quantityChange);
        const now = new Date().toISOString();

        const adjustment: StockAdjustment = {
          id: `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId,
          productName: product.name,
          previousStock,
          quantityChange,
          newStock,
          type,
          reason: reason || (type === "restock" ? "Stock In / Restock" : type === "damage" ? "Damaged / Expired" : "Stock Audit Adjustment"),
          createdAt: now,
        };

        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, stockQuantity: newStock, updatedAt: now } : p
          ),
          stockAdjustments: [adjustment, ...s.stockAdjustments],
        }));
      },

      deductStockForSale: (items) => {
        const now = new Date().toISOString();
        set((state) => {
          const itemMap = new Map(items.map((i) => [i.productId, i.quantity]));
          return {
            products: state.products.map((p) => {
              const qty = itemMap.get(p.id);
              if (qty !== undefined) {
                return {
                  ...p,
                  stockQuantity: Math.max(0, p.stockQuantity - qty),
                  updatedAt: now,
                };
              }
              return p;
            }),
          };
        });
      },

      setCategories: (categories) => set({ categories }),
      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setSelectedStatus: (selectedStatus) => set({ selectedStatus }),

      getFilteredProducts: () => {
        const { products, searchQuery, selectedCategory, selectedStatus } = get();
        return products.filter((p) => {
          const q = searchQuery.toLowerCase();
          const matchesSearch =
            !searchQuery ||
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.includes(searchQuery));
          const matchesCategory =
            !selectedCategory || p.categoryId === selectedCategory || p.categoryName === selectedCategory;
          const matchesStatus = !selectedStatus || p.status === selectedStatus;
          return matchesSearch && matchesCategory && matchesStatus;
        });
      },
    }),
    {
      name: "retailflow-products-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
