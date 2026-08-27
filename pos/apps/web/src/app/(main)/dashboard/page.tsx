"use client";

import React, { useState, useMemo } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  CreditCard,
  ArrowUpRight,
  Wallet,
  Smartphone,
  CheckCircle,
  FileText,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { useSalesStore, CompletedSale } from "@/stores/sales-store";
import { useProductStore } from "@/stores/product-store";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";

type DateRange = "Today" | "7 Days" | "30 Days" | "All Time";

const dateFilters: DateRange[] = ["Today", "7 Days", "30 Days", "All Time"];

export default function DashboardPage() {
  const sales = useSalesStore((state) => state.sales);
  const products = useProductStore((state) => state.products);

  const [activeFilter, setActiveFilter] = useState<DateRange>("All Time");
  const [selectedInvoice, setSelectedInvoice] = useState<CompletedSale | null>(null);

  const filteredSales = useMemo(() => {
    if (activeFilter === "All Time") return sales;
    const now = new Date();
    const days = activeFilter === "Today" ? 1 : activeFilter === "7 Days" ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return sales.filter((s) => new Date(s.createdAt) >= cutoff);
  }, [sales, activeFilter]);

  // Live Metrics
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalOrders = filteredSales.length;

  let totalCost = 0;
  for (const s of filteredSales) {
    for (const item of s.items) {
      totalCost += (item.purchasePrice || item.unitPrice * 0.7) * item.quantity;
    }
  }

  const grossProfit = Math.max(0, totalRevenue - totalCost);
  const marginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Real Low Stock Products
  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= p.reorderLevel).slice(0, 5);
  }, [products]);

  // Real Top Selling Products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; units: number; revenue: number }>();
    for (const s of filteredSales) {
      for (const item of s.items) {
        const curr = map.get(item.productName) || { name: item.productName, units: 0, revenue: 0 };
        curr.units += item.quantity;
        curr.revenue += item.totalAmount;
        map.set(item.productName, curr);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredSales]);

  // Real Payment Distribution
  const paymentDistribution = useMemo(() => {
    const counts: Record<string, number> = { cash: 0, upi: 0, card: 0 };
    for (const s of filteredSales) {
      const m = s.paymentMethod?.toLowerCase() || "cash";
      counts[m] = (counts[m] || 0) + s.totalAmount;
    }
    const total = totalRevenue || 1;
    return [
      { method: "Cash", amount: counts.cash || 0, percentage: Math.round(((counts.cash || 0) / total) * 100), icon: Wallet },
      { method: "UPI / QR", amount: counts.upi || 0, percentage: Math.round(((counts.upi || 0) / total) * 100), icon: Smartphone },
      { method: "Card", amount: counts.card || 0, percentage: Math.round(((counts.card || 0) / total) * 100), icon: CreditCard },
    ];
  }, [filteredSales, totalRevenue]);

  // Real Recent Transactions
  const recentTransactions = useMemo(() => {
    return sales.slice(0, 5);
  }, [sales]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RetailFlow Store Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time sales velocity, inventory alerts, profit margins, and recent invoices
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-2xs">
          {dateFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === filter
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" /> Live
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Total Sales Revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="flex items-center gap-0.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {totalOrders} Invoices
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Completed Orders</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {marginPercent}% Margin
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">₹{Math.round(grossProfit).toLocaleString()}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Gross Profit</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Per Order
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{avgOrderValue.toLocaleString()}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Average Order Value</p>
        </div>
      </div>

      {/* Top Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Top Selling Products</h2>
            <Link href="/reports" className="text-xs font-semibold text-blue-600 hover:underline">
              Full Report →
            </Link>
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-3 p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.units} units sold</p>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ₹{product.revenue.toFixed(2)}
                </span>
              </div>
            ))}

            {topProducts.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">No sales recorded in this period</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-gray-900">Low Stock Alerts</h2>
            </div>
            <Link href="/inventory" className="text-xs font-semibold text-blue-600 hover:underline">
              Adjust →
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockItems.map((product) => {
              const isOut = product.stockQuantity === 0;
              return (
                <div
                  key={product.sku}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-3 bg-gray-50/50"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-[11px] font-mono text-gray-400">{product.sku}</p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isOut ? "text-red-700 bg-red-50 border border-red-200" : "text-amber-700 bg-amber-50 border border-amber-200"
                    }`}
                  >
                    {isOut ? "0 Left" : `${product.stockQuantity} Left`}
                  </span>
                </div>
              );
            })}

            {lowStockItems.length === 0 && (
              <div className="text-center py-6 text-emerald-600">
                <CheckCircle className="h-8 w-8 mx-auto mb-1 text-emerald-500" />
                <p className="text-xs font-semibold">All products have healthy stock levels</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Distribution & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900">Payment Modes</h2>
          <div className="space-y-4">
            {paymentDistribution.map((payment) => (
              <div key={payment.method}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <payment.icon className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-700">{payment.method}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">
                    ₹{payment.amount.toFixed(2)} ({payment.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${payment.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-6 pb-3 border-b flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Completed Invoices</h2>
              <p className="text-xs text-gray-400">Click any invoice to view and print</p>
            </div>
            <Link href="/pos" className="text-xs font-semibold text-blue-600 hover:underline">
              Open POS →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-left text-xs uppercase tracking-wider text-gray-500 border-b">
                <th className="px-6 py-3 font-semibold">Invoice #</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Time</th>
                <th className="px-6 py-3 font-semibold">Method</th>
                <th className="px-6 py-3 text-right font-semibold">Total</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  onClick={() => setSelectedInvoice(txn)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3 font-mono text-xs font-bold text-blue-600 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    {txn.invoiceNumber}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-700 font-medium">{txn.customerName}</td>
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {new Date(txn.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 uppercase">
                      {txn.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900">
                    ₹{txn.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoice(txn);
                      }}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                      title="View / Print Invoice"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice View / Print Modal */}
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
