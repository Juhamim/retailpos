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

const INITIAL_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Beverages", sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-2", name: "Snacks", sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-3", name: "Food", sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-4", name: "Dairy", sortOrder: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-5", name: "Personal Care", sortOrder: 5, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-6", name: "Household", sortOrder: 6, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-7", name: "Stationery", sortOrder: 7, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const INITIAL_PRODUCTS: ProductWithCategory[] = [
  { id: "prod-1", name: "Coca-Cola 500ml", sku: "CC500", barcode: "8901234567890", categoryId: "cat-1", categoryName: "Beverages", purchasePrice: 28, sellingPrice: 40, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 150, reorderLevel: 20, unit: "bottle", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-2", name: "Pepsi 500ml", sku: "PEP500", barcode: "8901234567891", categoryId: "cat-1", categoryName: "Beverages", purchasePrice: 28, sellingPrice: 40, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 120, reorderLevel: 20, unit: "bottle", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-3", name: "Lays Classic Salted", sku: "LCS100", barcode: "8901234567892", categoryId: "cat-2", categoryName: "Snacks", purchasePrice: 12, sellingPrice: 20, gstRate: GSTRate.TWELVE, discountPercent: 0, stockQuantity: 200, reorderLevel: 30, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-4", name: "Maggi Noodles 70g", sku: "MAG70", barcode: "8901234567893", categoryId: "cat-3", categoryName: "Food", purchasePrice: 9, sellingPrice: 14, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 180, reorderLevel: 25, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-5", name: "Dove Soap 100g", sku: "DOV100", barcode: "8901234567894", categoryId: "cat-5", categoryName: "Personal Care", purchasePrice: 42, sellingPrice: 58, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 75, reorderLevel: 15, unit: "pcs", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-6", name: "Colgate Toothpaste 150g", sku: "COL150", barcode: "8901234567895", categoryId: "cat-5", categoryName: "Personal Care", purchasePrice: 68, sellingPrice: 95, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 60, reorderLevel: 15, unit: "pcs", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-7", name: "Britannia Biscuits", sku: "BRB250", barcode: "8901234567896", categoryId: "cat-2", categoryName: "Snacks", purchasePrice: 22, sellingPrice: 30, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 90, reorderLevel: 20, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-8", name: "Parle-G 100g", sku: "PGL100", barcode: "8901234567897", categoryId: "cat-2", categoryName: "Snacks", purchasePrice: 6, sellingPrice: 10, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 300, reorderLevel: 50, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-9", name: "Amul Butter 100g", sku: "AMB100", barcode: "8901234567898", categoryId: "cat-4", categoryName: "Dairy", purchasePrice: 44, sellingPrice: 56, gstRate: GSTRate.TWELVE, discountPercent: 0, stockQuantity: 30, reorderLevel: 10, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-10", name: "Nescafe Classic 50g", sku: "NES50", barcode: "8901234567899", categoryId: "cat-1", categoryName: "Beverages", purchasePrice: 110, sellingPrice: 145, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 45, reorderLevel: 10, unit: "bottle", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-11", name: "Tata Salt 1kg", sku: "TAS1K", barcode: "8901234567800", categoryId: "cat-3", categoryName: "Food", purchasePrice: 20, sellingPrice: 28, gstRate: GSTRate.ZERO, discountPercent: 0, stockQuantity: 100, reorderLevel: 20, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-12", name: "Fortune Oil 1L", sku: "FRO1L", barcode: "8901234567801", categoryId: "cat-3", categoryName: "Food", purchasePrice: 155, sellingPrice: 185, gstRate: GSTRate.FIVE, discountPercent: 0, stockQuantity: 25, reorderLevel: 10, unit: "bottle", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-13", name: "Surf Excel 500g", sku: "SFX500", barcode: "8901234567802", categoryId: "cat-6", categoryName: "Household", purchasePrice: 48, sellingPrice: 62, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 80, reorderLevel: 15, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-14", name: "Vim Dishwash 250ml", sku: "VIM250", barcode: "8901234567803", categoryId: "cat-6", categoryName: "Household", purchasePrice: 25, sellingPrice: 35, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 70, reorderLevel: 15, unit: "bottle", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-15", name: "Harpic Power Plus 500ml", sku: "HPP500", barcode: "8901234567804", categoryId: "cat-6", categoryName: "Household", purchasePrice: 72, sellingPrice: 99, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 40, reorderLevel: 10, unit: "bottle", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-16", name: "Close-Up Toothpaste 150g", sku: "CUP150", barcode: "8901234567805", categoryId: "cat-5", categoryName: "Personal Care", purchasePrice: 65, sellingPrice: 90, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 55, reorderLevel: 12, unit: "pcs", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-17", name: "Milk Bikis 250g", sku: "MBS250", barcode: "8901234567806", categoryId: "cat-2", categoryName: "Snacks", purchasePrice: 18, sellingPrice: 25, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 120, reorderLevel: 25, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-18", name: "Thums Up 300ml", sku: "TU300", barcode: "8901234567807", categoryId: "cat-1", categoryName: "Beverages", purchasePrice: 14, sellingPrice: 20, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 0, reorderLevel: 20, unit: "can", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-19", name: "Red Bull 250ml", sku: "RDB250", barcode: "8901234567808", categoryId: "cat-1", categoryName: "Beverages", purchasePrice: 85, sellingPrice: 115, gstRate: GSTRate.EIGHTEEN, discountPercent: 0, stockQuantity: 20, reorderLevel: 10, unit: "can", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-20", name: "Haldiram Aloo Bhujia 200g", sku: "HAB200", barcode: "8901234567809", categoryId: "cat-2", categoryName: "Snacks", purchasePrice: 32, sellingPrice: 45, gstRate: GSTRate.TWELVE, discountPercent: 0, stockQuantity: 65, reorderLevel: 15, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-21", name: "Minute Maid 400ml", sku: "MMM400", barcode: "8901234567810", categoryId: "cat-1", categoryName: "Beverages", purchasePrice: 20, sellingPrice: 30, gstRate: GSTRate.TWELVE, discountPercent: 0, stockQuantity: 40, reorderLevel: 10, unit: "bottle", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-22", name: "Nataraj Pencils Box", sku: "NPB10", barcode: "8901234567811", categoryId: "cat-7", categoryName: "Stationery", purchasePrice: 30, sellingPrice: 45, gstRate: GSTRate.TWELVE, discountPercent: 0, stockQuantity: 100, reorderLevel: 20, unit: "box", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-23", name: "Linc Pen Pack", sku: "LPN5", barcode: "8901234567812", categoryId: "cat-7", categoryName: "Stationery", purchasePrice: 35, sellingPrice: 50, gstRate: GSTRate.TWELVE, discountPercent: 0, stockQuantity: 80, reorderLevel: 15, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-24", name: "Kurkure 90g", sku: "KRK90", barcode: "8901234567813", categoryId: "cat-2", categoryName: "Snacks", purchasePrice: 12, sellingPrice: 20, gstRate: GSTRate.TWELVE, discountPercent: 0, stockQuantity: 150, reorderLevel: 30, unit: "pack", status: ProductStatus.ACTIVE, isWeighable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

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
