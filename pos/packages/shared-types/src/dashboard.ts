export interface DashboardData {
  todaySales: number;
  todayOrders: number;
  todayProfit: number;
  averageOrderValue: number;
  salesComparison: {
    current: number;
    previous: number;
    changePercent: number;
  };
  topSellingProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
  paymentDistribution: PaymentDistribution[];
  recentTransactions: RecentTransaction[];
  hourlySales: HourlySales[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
}

export interface PaymentDistribution {
  method: string;
  count: number;
  total: number;
}

export interface RecentTransaction {
  id: string;
  invoiceNumber: string;
  amount: number;
  items: number;
  paymentMethod: string;
  timestamp: string;
}

export interface HourlySales {
  hour: number;
  sales: number;
  orders: number;
}

export interface DashboardDateFilter {
  type: "today" | "yesterday" | "7days" | "30days" | "custom";
  startDate?: string;
  endDate?: string;
}
