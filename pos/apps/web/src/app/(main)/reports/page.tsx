"use client";

import React, { useState, useMemo } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Receipt, 
  Download, 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Printer, 
  Eye, 
  FileText, 
  FileSpreadsheet,
  BarChart3,
  PieChart,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  PackageX,
  Users,
  HardDriveDownload,
  Flame,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";
import { useSalesStore, CompletedSale } from "@/stores/sales-store";
import { useExpenseStore } from "@/stores/expense-store";
import { useProductStore } from "@/stores/product-store";
import { usePurchaseStore } from "@/stores/purchase-store";
import { useShiftStore } from "@/stores/shift-store";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import { 
  exportFinancialReportPDF, 
  exportInventoryValuationPDF, 
  exportStockInventoryReportPDF,
  exportCashierPerformanceReportPDF,
  exportGstReportCSV, 
  exportGstr2Csv, 
  exportGstr3bPDF 
} from "@/lib/pdf-export";
import { SalesTrendChart } from "@/components/reports/sales-trend-chart";
import { CategoryDonutChart } from "@/components/reports/category-donut-chart";
import { HourlyVelocityChart, HourlySalesData } from "@/components/reports/hourly-velocity-chart";
import { InventoryHealthChart } from "@/components/reports/inventory-health-chart";

type ReportTab = "sales" | "inventory" | "categories" | "shifts" | "hourly" | "gst";
type DateFilter = "Today" | "Yesterday" | "7 Days" | "30 Days" | "All";

export default function ReportsPage() {
  const sales = useSalesStore((state) => state.sales);
  const expenses = useExpenseStore((state) => state.expenses);
  const products = useProductStore((state) => state.products);
  const purchases = usePurchaseStore((state) => state.purchases);
  const shifts = useShiftStore((state) => state.shifts);

  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [dateFilter, setDateFilter] = useState<DateFilter>("7 Days");
  const [selectedInvoice, setSelectedInvoice] = useState<CompletedSale | null>(null);

  // Filter sales based on chosen date range
  const filteredSales = useMemo(() => {
    const now = new Date();
    if (dateFilter === "All") return sales;
    
    if (dateFilter === "Today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return sales.filter((s) => new Date(s.createdAt).getTime() >= todayStart);
    }
    
    if (dateFilter === "Yesterday") {
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return sales.filter((s) => {
        const time = new Date(s.createdAt).getTime();
        return time >= yesterdayStart && time < todayStart;
      });
    }

    const days = dateFilter === "7 Days" ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).getTime();
    return sales.filter((s) => new Date(s.createdAt).getTime() >= cutoff);
  }, [sales, dateFilter]);

  // Financial Metrics
  const grossRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTax = filteredSales.reduce((sum, s) => sum + s.taxAmount, 0);

  let totalCOGS = 0;
  for (const s of filteredSales) {
    for (const item of s.items) {
      totalCOGS += (item.purchasePrice || item.unitPrice * 0.7) * item.quantity;
    }
  }

  const grossProfit = Math.max(0, grossRevenue - totalCOGS);
  const marginPercent = grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 100) : 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const averageOrderValue = filteredSales.length > 0 ? grossRevenue / filteredSales.length : 0;

  // Daily Trendline Data for Chart
  const salesTrendData = useMemo(() => {
    const map = new Map<string, { revenue: number; profit: number; orders: number }>();
    const sortedSales = [...filteredSales].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    for (const s of sortedSales) {
      const d = new Date(s.createdAt);
      const dateKey = `${d.getMonth() + 1}/${d.getDate()}`;
      const existing = map.get(dateKey) || { revenue: 0, profit: 0, orders: 0 };
      
      let itemCOGS = 0;
      for (const it of s.items) {
        itemCOGS += (it.purchasePrice || it.unitPrice * 0.7) * it.quantity;
      }
      
      existing.revenue += s.totalAmount;
      existing.profit += Math.max(0, s.totalAmount - itemCOGS);
      existing.orders += 1;
      map.set(dateKey, existing);
    }

    if (map.size === 0) {
      return [{ label: "Today", revenue: 0, profit: 0, orders: 0 }];
    }

    return Array.from(map.entries()).map(([label, val]) => ({
      label,
      revenue: Math.round(val.revenue * 100) / 100,
      profit: Math.round(val.profit * 100) / 100,
      orders: val.orders,
    }));
  }, [filteredSales]);

  // Hourly Velocity Data
  const hourlyData: HourlySalesData[] = useMemo(() => {
    const hours: HourlySalesData[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`,
      orders: 0,
      revenue: 0,
    }));

    for (const s of filteredSales) {
      const h = new Date(s.createdAt).getHours();
      if (hours[h]) {
        hours[h].orders += 1;
        hours[h].revenue += s.totalAmount;
      }
    }

    return hours;
  }, [filteredSales]);

  // Category Aggregate
  const categoryData = useMemo(() => {
    const map = new Map<string, { revenue: number; units: number }>();
    for (const s of filteredSales) {
      for (const it of s.items) {
        const prod = products.find((p) => p.id === it.productId);
        const catName = prod?.categoryName || "General";
        const curr = map.get(catName) || { revenue: 0, units: 0 };
        curr.revenue += it.totalAmount;
        curr.units += it.quantity;
        map.set(catName, curr);
      }
    }

    return Array.from(map.entries()).map(([name, val]) => ({
      name,
      revenue: val.revenue,
      units: val.units,
      color: "",
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const counts: Record<string, number> = { cash: 0, upi: 0, card: 0, credit: 0 };
    for (const s of filteredSales) {
      const m = s.paymentMethod?.toLowerCase() || "cash";
      counts[m] = (counts[m] || 0) + s.totalAmount;
    }
    const total = grossRevenue || 1;
    return [
      { name: "Cash Drawer", amount: counts.cash || 0, percent: Math.round(((counts.cash || 0) / total) * 100), icon: Wallet },
      { name: "UPI / QR", amount: counts.upi || 0, percent: Math.round(((counts.upi || 0) / total) * 100), icon: Smartphone },
      { name: "Card Swipes", amount: counts.card || 0, percent: Math.round(((counts.card || 0) / total) * 100), icon: CreditCard },
      { name: "Store Credit", amount: counts.credit || 0, percent: Math.round(((counts.credit || 0) / total) * 100), icon: Receipt },
    ];
  }, [filteredSales, grossRevenue]);

  // Inventory Stock Metrics
  const inventoryMetrics = useMemo(() => {
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let healthyCount = 0;
    let overstockedCount = 0;

    for (const p of products) {
      const cost = (p.purchasePrice || 0) * (p.stockQuantity || 0);
      const retail = (p.sellingPrice || 0) * (p.stockQuantity || 0);
      totalCostValuation += cost;
      totalRetailValuation += retail;

      if (p.stockQuantity <= 0) outOfStockCount++;
      else if (p.stockQuantity <= (p.reorderLevel || 5)) lowStockCount++;
      else if (p.stockQuantity > 100) overstockedCount++;
      else healthyCount++;
    }

    const potentialMargin = totalRetailValuation - totalCostValuation;

    const productSalesMap = new Map<string, number>();
    for (const s of filteredSales) {
      for (const it of s.items) {
        productSalesMap.set(it.productId, (productSalesMap.get(it.productId) || 0) + it.quantity);
      }
    }

    const fastMoving = [...products]
      .map((p) => ({ ...p, unitsSold: productSalesMap.get(p.id) || 0 }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 8);

    const deadStock = [...products]
      .filter((p) => (productSalesMap.get(p.id) || 0) === 0 && p.stockQuantity > 0)
      .slice(0, 8);

    return {
      totalCostValuation,
      totalRetailValuation,
      potentialMargin,
      healthyCount,
      lowStockCount,
      outOfStockCount,
      overstockedCount,
      fastMoving,
      deadStock,
    };
  }, [products, filteredSales]);

  // Cashier Performance breakdown
  const cashierMetrics = useMemo(() => {
    const map = new Map<string, { cashierName: string; totalRevenue: number; ordersCount: number; cashTotal: number }>();

    for (const s of filteredSales) {
      const name = s.cashierName || "Terminal Cashier";
      const curr = map.get(name) || { cashierName: name, totalRevenue: 0, ordersCount: 0, cashTotal: 0 };
      curr.totalRevenue += s.totalAmount;
      curr.ordersCount += 1;
      if (s.paymentMethod?.toLowerCase() === "cash") {
        curr.cashTotal += s.totalAmount;
      }
      map.set(name, curr);
    }

    return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredSales]);

  // CSV Exporter for detailed sales
  const handleExportCSV = () => {
    const headers = ["Invoice Number", "Customer", "Subtotal", "Tax", "Discount", "Total Amount", "Payment Method", "Cashier", "Date"];
    const rows = filteredSales.map((s) => [
      s.invoiceNumber,
      `"${s.customerName}"`,
      s.subtotal.toFixed(2),
      s.taxAmount.toFixed(2),
      s.discountAmount.toFixed(2),
      s.totalAmount.toFixed(2),
      s.paymentMethod,
      `"${s.cashierName || "Cashier"}"`,
      `"${new Date(s.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RetailFlow_Sales_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Exporter for stock inventory
  const handleExportStockCSV = () => {
    const headers = ["Product Name", "SKU", "Barcode", "Category", "In Stock", "Min Level", "Cost Price", "Selling Price", "Total Valuation", "Status"];
    const rows = products.map((p) => {
      const val = (p.purchasePrice || 0) * (p.stockQuantity || 0);
      const status = p.stockQuantity <= 0 ? "Out of Stock" : p.stockQuantity <= (p.reorderLevel || 5) ? "Low Stock" : "Healthy";
      return [
        `"${p.name}"`,
        p.sku,
        p.barcode || "N/A",
        `"${p.categoryName || "General"}"`,
        p.stockQuantity,
        p.reorderLevel || 5,
        p.purchasePrice.toFixed(2),
        p.sellingPrice.toFixed(2),
        val.toFixed(2),
        status
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RetailFlow_Stock_Inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      {/* Top Header & Global Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" /> Reports & Store Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Financial performance, catalog stock valuation, velocity heatmaps, and GST returns
          </p>
        </div>

        {/* Global Date Range & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            {(["Today", "Yesterday", "7 Days", "30 Days", "All"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateFilter === f ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs"
            title="Download sales table as Excel CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" /> Export CSV
          </button>

          <button
            type="button"
            onClick={() => exportFinancialReportPDF(filteredSales, expenses, dateFilter)}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-2xs"
            title="Export complete financial analytics PDF"
          >
            <FileText className="h-3.5 w-3.5" /> Financial PDF
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1 text-xs font-bold">
        {[
          { id: "sales", label: "Sales & Profit Margins", icon: DollarSign, count: `${filteredSales.length} bills` },
          { id: "inventory", label: "Stock & Inventory Valuation", icon: Package, count: `${products.length} SKUs` },
          { id: "categories", label: "Category Analytics", icon: PieChart, count: `${categoryData.length} depts` },
          { id: "hourly", label: "Peak Hours & Velocity", icon: Clock, count: "24h graph" },
          { id: "shifts", label: "Cashier Shift Audits", icon: Users, count: `${shifts.length} shifts` },
          { id: "gst", label: "GST Compliance (GSTR)", icon: FileSpreadsheet, count: "Portal CSVs" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                isActive ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SALES & PROFIT MARGINS */}
      {/* ========================================================================= */}
      {activeTab === "sales" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">₹{grossRevenue.toLocaleString()}</p>
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{filteredSales.length} total orders</span>
                <span>AOV: ₹{averageOrderValue.toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wholesale Cost (COGS)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">₹{Math.round(totalCOGS).toLocaleString()}</p>
              <p className="text-xs text-slate-400">Total acquisition wholesale cost</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Profit Margin</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">₹{Math.round(grossProfit).toLocaleString()}</p>
              <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>{marginPercent}% Realized Margin</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">GST Output Collected</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-700">₹{totalTax.toFixed(2)}</p>
              <p className="text-xs text-slate-400">CGST (50%) + SGST (50%) liability</p>
            </div>
          </div>

          {/* Interactive Sales & Profit Trend Area Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Revenue & Profit Margins Trajectory</h2>
                <p className="text-xs text-slate-400 mt-0.5">Interactive daily sales velocity curve and gross margins</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                {dateFilter} Window
              </span>
            </div>

            <SalesTrendChart data={salesTrendData} height={250} />
          </div>

          {/* Payment Methods Breakdown & Invoices Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Allocation */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Payment Modes Breakdown</h2>
              <div className="space-y-4">
                {paymentBreakdown.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <div key={pm.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <Icon className="h-4 w-4 text-blue-600" /> {pm.name}
                        </span>
                        <span className="text-slate-900 font-mono">₹{pm.amount.toFixed(2)} ({pm.percent}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${pm.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices Record Preview */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Sales Invoices ({filteredSales.length})</h2>
                  <p className="text-xs text-slate-400">Click any bill to view, print, or download A4 Tax Invoice</p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-left">
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.slice(0, 15).map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedInvoice(s)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{s.invoiceNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{s.customerName}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 uppercase font-bold text-slate-600">{s.paymentMethod}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{s.totalAmount.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(s);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px]"
                          >
                            Print A4
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredSales.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                          No sales recorded in this date window.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STOCK & INVENTORY VALUATION */}
      {/* ========================================================================= */}
      {activeTab === "inventory" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Inventory Valuation Light Header Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" /> Catalog Stock Valuation & Turnover
              </h2>
              <p className="text-xs text-slate-500">
                Asset value calculations, safety buffer reorders, and dead stock identification
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportStockCSV}
                className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" /> Export Stock CSV
              </button>
              <button
                type="button"
                onClick={() => exportStockInventoryReportPDF(products, sales)}
                className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <FileText className="h-3.5 w-3.5" /> Download Valuation PDF
              </button>
            </div>
          </div>

          {/* Stock KPI Valuation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Asset Value (Cost)</span>
              <p className="text-2xl font-black text-slate-900">₹{inventoryMetrics.totalCostValuation.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Total capital invested at purchase price</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retail Realizable Value</span>
              <p className="text-2xl font-black text-blue-600">₹{inventoryMetrics.totalRetailValuation.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Expected sales revenue from stock</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projected Unrealized Margin</span>
              <p className="text-2xl font-black text-emerald-600">₹{inventoryMetrics.potentialMargin.toLocaleString()}</p>
              <p className="text-xs text-emerald-700 font-bold">
                {Math.round((inventoryMetrics.potentialMargin / (inventoryMetrics.totalRetailValuation || 1)) * 100)}% Expected Gross Margin
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Reorder Alerts</span>
              <p className="text-2xl font-black text-rose-600">
                {inventoryMetrics.lowStockCount + inventoryMetrics.outOfStockCount} SKUs
              </p>
              <p className="text-xs text-rose-700 font-semibold">
                {inventoryMetrics.outOfStockCount} out of stock • {inventoryMetrics.lowStockCount} low
              </p>
            </div>
          </div>

          {/* Catalog Health & Depletion Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Stock Levels Health Meter</h3>
            <InventoryHealthChart
              totalSkus={products.length}
              healthyCount={inventoryMetrics.healthyCount}
              lowStockCount={inventoryMetrics.lowStockCount}
              outOfStockCount={inventoryMetrics.outOfStockCount}
              overstockedCount={inventoryMetrics.overstockedCount}
            />
          </div>

          {/* Fast Moving vs Dead Stock Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fast Moving SKUs */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-500" /> Fast-Moving High Velocity SKUs
                </span>
                <span className="text-xs font-bold text-blue-600">{dateFilter}</span>
              </div>

              <div className="space-y-2">
                {inventoryMetrics.fastMoving.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="overflow-hidden pr-2">
                      <p className="font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} • {p.stockQuantity} remaining</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-emerald-600">{p.unitsSold} sold</span>
                      <span className="block text-[10px] text-slate-400 font-mono">₹{p.sellingPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {inventoryMetrics.fastMoving.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No sales activity recorded yet.</p>
                )}
              </div>
            </div>

            {/* Dead / Slow-Moving Stock */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4 text-rose-500" /> Slow / Idle Stock (0 Sales)
                </span>
                <span className="text-xs font-bold text-slate-400">Capital Tied Up</span>
              </div>

              <div className="space-y-2">
                {inventoryMetrics.deadStock.map((p) => {
                  const tiedUp = (p.purchasePrice || 0) * (p.stockQuantity || 0);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="overflow-hidden pr-2">
                        <p className="font-bold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.stockQuantity} units in store</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-rose-600">₹{tiedUp.toFixed(0)}</span>
                        <span className="block text-[10px] text-slate-400">Tied capital</span>
                      </div>
                    </div>
                  );
                })}

                {inventoryMetrics.deadStock.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">All stock lines are active or stock is clean!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CATEGORY & DEPARTMENT ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === "categories" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Donut Ring */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Category Revenue Contribution</h2>
              <CategoryDonutChart data={categoryData} totalRevenue={grossRevenue} />
            </div>

            {/* Category Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Category Performance Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-left">
                      <th className="py-2.5 px-3">Category Name</th>
                      <th className="py-2.5 px-3 text-center">Units Sold</th>
                      <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                      <th className="py-2.5 px-3 text-right">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categoryData.map((c) => {
                      const share = grossRevenue > 0 ? (c.revenue / grossRevenue) * 100 : 0;
                      return (
                        <tr key={c.name} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{c.name}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{c.units}</td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{c.revenue.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">{share.toFixed(1)}%</td>
                        </tr>
                      );
                    })}

                    {categoryData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                          No category revenue recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PEAK HOURS & VELOCITY */}
      {/* ========================================================================= */}
      {activeTab === "hourly" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">24-Hour Sales Velocity & Rush Hour Heatmap</h2>
            <p className="text-xs text-slate-400">Identify high-traffic register hours to optimize staffing schedules</p>
            <HourlyVelocityChart data={hourlyData} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CASHIER SHIFT RECONCILIATION */}
      {/* ========================================================================= */}
      {activeTab === "shifts" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Cashier Register Shifts & Cash Reconciliations</h2>
              <p className="text-xs text-slate-400">Drawer float balances, shift sales totals, and cash discrepancies</p>
            </div>

            <button
              type="button"
              onClick={() => exportCashierPerformanceReportPDF(shifts, sales)}
              className="h-9 px-3.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" /> Export Shift Audits PDF
            </button>
          </div>

          {/* Cashier Leaderboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cashierMetrics.map((cm, idx) => (
              <div key={cm.cashierName} className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{cm.cashierName}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">Rank #{idx + 1}</span>
                </div>
                <p className="text-xl font-black text-blue-600">₹{cm.totalRevenue.toFixed(2)}</p>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{cm.ordersCount} transactions</span>
                  <span>Cash: ₹{cm.cashTotal.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Shift Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-left">
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Shift Opened</th>
                  <th className="py-3 px-4">Shift Closed</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Sales Total</th>
                  <th className="py-3 px-4 text-right">Counted Cash</th>
                  <th className="py-3 px-4 text-center">Discrepancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((s) => {
                  const discrepancy = (s.actualCash ?? 0) - s.expectedCash;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.username}</td>
                      <td className="py-3 px-4 text-slate-600">{new Date(s.openedAt).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600">{s.closedAt ? new Date(s.closedAt).toLocaleString() : "Active"}</td>
                      <td className="py-3 px-4 text-center font-semibold">{s.salesCount}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{s.salesTotal.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">₹{(s.actualCash ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          discrepancy === 0 ? "bg-emerald-100 text-emerald-800" : discrepancy > 0 ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {discrepancy === 0 ? "Exact Match" : discrepancy > 0 ? `+₹${discrepancy.toFixed(0)}` : `-₹${Math.abs(discrepancy).toFixed(0)}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {shifts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No shift records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: GST RETURNS COMPLIANCE */}
      {/* ========================================================================= */}
      {activeTab === "gst" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">GST Portal Returns & Inward ITC Reconciliation</h2>
              <p className="text-xs text-slate-400 mt-0.5">Download government compliance CSVs for GSTR-1, GSTR-2, and consolidated GSTR-3B</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white flex flex-col justify-between shadow-2xs">
                <div>
                  <p className="text-xs font-black text-slate-900">GSTR-1 Outward Supplies</p>
                  <p className="text-[11px] text-slate-500 mt-1">Client sales tax invoices formatted for the government GST portal upload.</p>
                </div>
                <button
                  type="button"
                  onClick={() => exportGstReportCSV(filteredSales, dateFilter)}
                  className="h-9 w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Download GSTR-1 CSV
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white flex flex-col justify-between shadow-2xs">
                <div>
                  <p className="text-xs font-black text-slate-900">GSTR-2 Inward Supplies (ITC)</p>
                  <p className="text-[11px] text-slate-500 mt-1">Purchases ledger to claim eligible Input Tax Credit on vendor bills.</p>
                </div>
                <button
                  type="button"
                  onClick={() => exportGstr2Csv(purchases, dateFilter)}
                  className="h-9 w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Download GSTR-2 CSV
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white flex flex-col justify-between shadow-2xs">
                <div>
                  <p className="text-xs font-black text-slate-900">GSTR-3B Consolidated Return</p>
                  <p className="text-[11px] text-slate-500 mt-1">Audit sheet reconciling outward liability vs inward tax credits.</p>
                </div>
                <button
                  type="button"
                  onClick={() => exportGstr3bPDF(filteredSales, purchases, dateFilter)}
                  className="h-9 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <FileText className="h-4 w-4" /> Export GSTR-3B PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice View / Print Dialog */}
      {selectedInvoice && (
        <ReceiptDialog
          invoiceNumber={selectedInvoice.invoiceNumber}
          total={selectedInvoice.totalAmount}
          items={selectedInvoice.items}
          customerName={selectedInvoice.customerName}
          paymentMethod={selectedInvoice.paymentMethod}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
