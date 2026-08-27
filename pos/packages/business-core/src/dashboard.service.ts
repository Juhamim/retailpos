import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import type { SaleRow } from "@retailflow/database";

export class DashboardService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  getDashboardData(dateRange?: { startDate: string; endDate: string }) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const startStr = dateRange?.startDate ?? todayStart.toISOString();
    const endStr = dateRange?.endDate ?? todayEnd.toISOString();

    const allSales = this.db.getTable<SaleRow>("sales").filter((r) => r.status === "completed");

    const todaySales = allSales.filter(
      (r) => r.created_at >= startStr && r.created_at <= endStr
    );

    const todayOrders = todaySales.length;
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
    const todayTax = todaySales.reduce((sum, s) => sum + s.tax_amount, 0);
    const estimatedProfit = todayRevenue - todayTax;
    const averageOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;

    return {
      todaySales: todayRevenue,
      todayOrders,
      todayProfit: estimatedProfit,
      averageOrderValue,
      salesComparison: {
        current: todayRevenue,
        previous: 0,
        changePercent: 0,
      },
      topSellingProducts: [],
      lowStockProducts: [],
      paymentDistribution: [],
      recentTransactions: allSales.slice(0, 10).map((s) => ({
        id: s.id,
        invoiceNumber: s.invoice_number,
        amount: s.total_amount,
        items: 0,
        paymentMethod: "",
        timestamp: s.created_at,
      })),
      hourlySales: [],
    };
  }
}
