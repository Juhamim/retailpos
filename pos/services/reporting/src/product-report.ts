import { ProductReport } from "@retailflow/shared-types";

export function generateProductReport(saleItems: Array<{
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  totalAmount: number;
}>): ProductReport[] {
  const grouped: Record<string, {
    productName: string;
    sku: string;
    totalSold: number;
    totalRevenue: number;
  }> = {};

  for (const item of saleItems) {
    if (!grouped[item.productId]) {
      grouped[item.productId] = {
        productName: item.productName,
        sku: item.productSku,
        totalSold: 0,
        totalRevenue: 0,
      };
    }
    grouped[item.productId].totalSold += item.quantity;
    grouped[item.productId].totalRevenue += item.totalAmount;
  }

  return Object.entries(grouped).map(([productId, data]) => ({
    productId,
    productName: data.productName,
    sku: data.sku,
    totalSold: data.totalSold,
    totalRevenue: data.totalRevenue,
    totalCost: 0,
    profit: data.totalRevenue,
  }));
}
