import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  getSalesSummary: () => {
    totalRevenue: number;
    totalOrders: number;
    totalProfit: number;
    todaySales: number;
    todayOrders: number;
  };
}

const INITIAL_SALES: CompletedSale[] = [
  {
    id: "sale-1",
    invoiceNumber: "INV-20260827-0042",
    customerName: "Walk-in",
    items: [
      { productId: "prod-1", productName: "Coca-Cola 500ml", productSku: "CC500", quantity: 2, unitPrice: 40, purchasePrice: 28, discountPercent: 0, taxRate: 18, taxAmount: 14.4, totalAmount: 94.4 },
      { productId: "prod-3", productName: "Lays Classic Salted", productSku: "LCS100", quantity: 3, unitPrice: 20, purchasePrice: 12, discountPercent: 0, taxRate: 12, taxAmount: 7.2, totalAmount: 67.2 },
    ],
    subtotal: 140,
    taxAmount: 21.6,
    discountAmount: 0,
    totalAmount: 161.6,
    paymentMethod: PaymentMethod.CASH,
    payments: [{ method: PaymentMethod.CASH, amount: 161.6 }],
    status: SaleStatus.COMPLETED,
    cashierName: "Admin",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "sale-2",
    invoiceNumber: "INV-20260827-0041",
    customerName: "Rajesh Kumar",
    customerId: "c1",
    items: [
      { productId: "prod-10", productName: "Nescafe Classic 50g", productSku: "NES50", quantity: 2, unitPrice: 145, purchasePrice: 110, discountPercent: 5, taxRate: 18, taxAmount: 49.59, totalAmount: 325.09 },
      { productId: "prod-9", productName: "Amul Butter 100g", productSku: "AMB100", quantity: 2, unitPrice: 56, purchasePrice: 44, discountPercent: 0, taxRate: 12, taxAmount: 13.44, totalAmount: 125.44 },
    ],
    subtotal: 402,
    taxAmount: 63.03,
    discountAmount: 14.5,
    totalAmount: 450.53,
    paymentMethod: PaymentMethod.UPI,
    payments: [{ method: PaymentMethod.UPI, amount: 450.53, reference: "UPI/2608271041" }],
    status: SaleStatus.COMPLETED,
    cashierName: "Admin",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "sale-3",
    invoiceNumber: "INV-20260827-0040",
    customerName: "Priya Sharma",
    customerId: "c2",
    items: [
      { productId: "prod-6", productName: "Colgate Toothpaste 150g", productSku: "COL150", quantity: 2, unitPrice: 95, purchasePrice: 68, discountPercent: 0, taxRate: 18, taxAmount: 34.2, totalAmount: 224.2 },
      { productId: "prod-5", productName: "Dove Soap 100g", productSku: "DOV100", quantity: 3, unitPrice: 58, purchasePrice: 42, discountPercent: 0, taxRate: 18, taxAmount: 31.32, totalAmount: 205.32 },
    ],
    subtotal: 364,
    taxAmount: 65.52,
    discountAmount: 0,
    totalAmount: 429.52,
    paymentMethod: PaymentMethod.CARD,
    payments: [{ method: PaymentMethod.CARD, amount: 429.52, reference: "CARD-4821" }],
    status: SaleStatus.COMPLETED,
    cashierName: "Admin",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

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
    }
  )
);
