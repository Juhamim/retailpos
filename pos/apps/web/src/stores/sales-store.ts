import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import type { CartItem } from "@retailflow/shared-types";
import { PaymentMethod, SaleStatus } from "@retailflow/shared-types";

export interface CompletedSale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  payments: { method: PaymentMethod; amount: number; reference?: string }[];
  status: SaleStatus;
  notes?: string;
  cashierName: string;
  createdAt: string;
}

interface SalesState {
  sales: CompletedSale[];
  recordSale: (sale: Omit<CompletedSale, "id" | "createdAt">) => CompletedSale;
  getSaleByInvoice: (invoiceNumber: string) => CompletedSale | undefined;
  getRecentSales: (limit?: number) => CompletedSale[];
  updateSaleStatus: (invoiceNumber: string, status: SaleStatus) => void;
  getSalesSummary: () => {
    totalRevenue: number;
    totalOrders: number;
    totalProfit: number;
    todaySales: number;
    todayOrders: number;
  };
}

const INITIAL_SALES: CompletedSale[] = [];

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      sales: INITIAL_SALES,

      recordSale: (saleData) => {
        const id = `sale-${Date.now()}`;
        const newSale: CompletedSale = {
          ...saleData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ sales: [newSale, ...state.sales] }));
        return newSale;
      },

      getSaleByInvoice: (invoiceNumber) => {
        return get().sales.find((s) => s.invoiceNumber === invoiceNumber);
      },

      getRecentSales: (limit = 10) => {
        return get().sales.slice(0, limit);
      },

      updateSaleStatus: (invoiceNumber, status) => {
        set((state) => ({
          sales: state.sales.map((s) =>
            s.invoiceNumber === invoiceNumber ? { ...s, status } : s
          ),
        }));
      },

      getSalesSummary: () => {
        const sales = get().sales;
        const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        const totalOrders = sales.length;

        let totalCost = 0;
        for (const sale of sales) {
          for (const item of sale.items) {
            totalCost += (item.purchasePrice || item.unitPrice * 0.7) * item.quantity;
          }
        }
        const totalProfit = Math.max(0, totalRevenue - totalCost);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todaySalesList = sales.filter(
          (s) => new Date(s.createdAt) >= todayStart
        );
        const todaySales = todaySalesList.reduce((sum, s) => sum + s.totalAmount, 0);
        const todayOrders = todaySalesList.length;

        return {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders,
          totalProfit: Math.round(totalProfit * 100) / 100,
          todaySales: Math.round(todaySales * 100) / 100,
          todayOrders,
        };
      },
    }),
    {
      name: "retailflow-sales-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
