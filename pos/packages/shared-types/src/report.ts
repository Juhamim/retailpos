export interface SalesReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalTax: number;
  totalDiscount: number;
}

export interface ProductReport {
  productId: string;
  productName: string;
  sku: string;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
}

export interface InventoryReport {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  stockValue: number;
  reorderLevel: number;
  status: "ok" | "low" | "out";
}

export interface FinancialReport {
  period: string;
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface PaymentReport {
  method: string;
  count: number;
  total: number;
  percentage: number;
}

export interface ReportDateRange {
  startDate: string;
  endDate: string;
}
