import { SalesReport, ReportDateRange } from "@retailflow/shared-types";

export function generateSalesReport(sales: Array<{
  createdAt: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
}>, range: ReportDateRange): SalesReport[] {
  const grouped: Record<string, Array<typeof sales[0]>> = {};

  for (const sale of sales) {
    const date = sale.createdAt.slice(0, 10);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(sale);
  }

  return Object.entries(grouped).map(([date, daySales]) => ({
    period: date,
    totalSales: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
    totalOrders: daySales.length,
    averageOrderValue: daySales.reduce((sum, s) => sum + s.totalAmount, 0) / daySales.length,
    totalTax: daySales.reduce((sum, s) => sum + s.taxAmount, 0),
    totalDiscount: daySales.reduce((sum, s) => sum + s.discountAmount, 0),
  }));
}
