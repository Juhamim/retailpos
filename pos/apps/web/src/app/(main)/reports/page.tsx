"use client";

import React, { useState, useMemo } from "react";
import { DollarSign, TrendingUp, Package, Receipt, Download, CreditCard, Wallet, Smartphone, Printer, Eye, FileText, FileSpreadsheet } from "lucide-react";
import { useSalesStore, CompletedSale } from "@/stores/sales-store";
import { useExpenseStore } from "@/stores/expense-store";
import { useProductStore } from "@/stores/product-store";
import { usePurchaseStore } from "@/stores/purchase-store";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import { exportFinancialReportPDF, exportInventoryValuationPDF, exportGstReportCSV, exportGstr2Csv, exportGstr3bPDF } from "@/lib/pdf-export";


export default function ReportsPage() {
  const sales = useSalesStore((state) => state.sales);
  const expenses = useExpenseStore((state) => state.expenses);
  const products = useProductStore((state) => state.products);
  const purchases = usePurchaseStore((state) => state.purchases);


  const [dateFilter, setDateFilter] = useState<"Today" | "7 Days" | "30 Days" | "All">("All");
  const [selectedInvoice, setSelectedInvoice] = useState<CompletedSale | null>(null);

  const filteredSales = useMemo(() => {
    if (dateFilter === "All") return sales;
    const now = new Date();
    const days = dateFilter === "Today" ? 1 : dateFilter === "7 Days" ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return sales.filter((s) => new Date(s.createdAt) >= cutoff);
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
  const netProfit = grossProfit - (dateFilter === "All" ? totalExpenses : totalExpenses / 4);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const counts: Record<string, number> = { cash: 0, upi: 0, card: 0 };
    for (const s of filteredSales) {
      const m = s.paymentMethod?.toLowerCase() || "cash";
      counts[m] = (counts[m] || 0) + s.totalAmount;
    }
    const total = grossRevenue || 1;
    return [
      { name: "Cash", amount: counts.cash || 0, percent: Math.round(((counts.cash || 0) / total) * 100), icon: Wallet },
      { name: "UPI / QR", amount: counts.upi || 0, percent: Math.round(((counts.upi || 0) / total) * 100), icon: Smartphone },
      { name: "Card", amount: counts.card || 0, percent: Math.round(((counts.card || 0) / total) * 100), icon: CreditCard },
    ];
  }, [filteredSales, grossRevenue]);

  // Product sales aggregate
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

  const handleExportCSV = () => {
    const headers = ["Invoice Number", "Customer", "Subtotal", "Tax", "Discount", "Total Amount", "Payment Method", "Date"];
    const rows = filteredSales.map((s) => [
      s.invoiceNumber,
      `"${s.customerName}"`,
      s.subtotal.toFixed(2),
      s.taxAmount.toFixed(2),
      s.discountAmount.toFixed(2),
      s.totalAmount.toFixed(2),
      s.paymentMethod,
      `"${new Date(s.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `retailflow_sales_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Financial Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Profit margins, sales velocity, GST output liability, and printable invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-2xs">
            {(["Today", "7 Days", "30 Days", "All"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateFilter === f ? "bg-blue-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors shadow-2xs"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>

          <button
            onClick={() => exportFinancialReportPDF(filteredSales, expenses, dateFilter)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
          >
            <FileText className="h-4 w-4" /> Export PDF
          </button>

          <button
            onClick={() => exportInventoryValuationPDF(products)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
          >
            <Package className="h-4 w-4" /> Stock Value PDF
          </button>

          <button
            onClick={() => exportGstReportCSV(filteredSales, dateFilter)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4" /> GST Portal Report
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{grossRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{filteredSales.length} total orders recorded</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost of Goods (COGS)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{Math.round(totalCOGS).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Acquisition & wholesale cost</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Profit Margin</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">₹{Math.round(grossProfit).toLocaleString()}</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">
            {marginPercent}% Overall Profit Margin
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">GST Tax Collected</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700">₹{totalTax.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Output GST liability</p>
        </div>
      </div>

      {/* Top Products & Payment Modes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-2xs p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Top Performing Products</h2>
          <div className="space-y-3">
            {topProducts.map((p, idx) => {
              const maxRevenue = topProducts.length > 0 ? Math.max(...topProducts.map(tp => tp.revenue)) : 1;
              const percent = Math.round((p.revenue / maxRevenue) * 100);
              return (
                <div key={p.name} className="relative p-3.5 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-between transition-all hover:border-slate-300">
                  {/* CSS Visual Bar Chart Layer */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-blue-500/5 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-100">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{p.name}</p>
                      <p className="text-xs text-gray-400 font-medium">{p.units} units sold • {percent}% of top seller</p>
                    </div>
                  </div>
                  <span className="relative z-10 font-bold text-sm text-slate-900">₹{p.revenue.toFixed(2)}</span>
                </div>
              );
            })}

            {topProducts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No sales recorded yet</p>
            )}
          </div>
        </div>

        {/* Payment Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900">Payment Modes</h2>
          <div className="space-y-4">
            {paymentBreakdown.map((pm) => (
              <div key={pm.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <pm.icon className="h-4 w-4 text-blue-600" /> {pm.name}
                  </span>
                  <span className="text-gray-900">₹{pm.amount.toFixed(2)} ({pm.percent}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${pm.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GST Compliance Returns Centre */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">GST Returns Compliance Centre</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Download legal GST portal filing CSVs and consolidated liability returns reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* GSTR-1 */}
          <div className="border border-slate-100 rounded-xl p-4 space-y-2.5 bg-slate-50/30 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">GSTR-1 Outward Supplies</p>
              <p className="text-[10px] text-gray-400 mt-0.5">CSV report listing all client sales bills, CGST/SGST breakdowns, and client registration types for portal upload.</p>
            </div>
            <button
              type="button"
              onClick={() => exportGstReportCSV(filteredSales, dateFilter)}
              className="flex items-center justify-center gap-1.5 h-9 w-full rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-2xs"
            >
              <FileSpreadsheet className="h-4 w-4" /> Download GSTR-1 CSV
            </button>
          </div>

          {/* GSTR-2 */}
          <div className="border border-slate-100 rounded-xl p-4 space-y-2.5 bg-slate-50/30 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">GSTR-2 Inward Supplies (ITC)</p>
              <p className="text-[10px] text-gray-400 mt-0.5">CSV report listing all supplier purchase bills and tax inputs paid, enabling calculation of eligible Input Tax Credits (ITC).</p>
            </div>
            <button
              type="button"
              onClick={() => exportGstr2Csv(purchases, dateFilter)}
              className="flex items-center justify-center gap-1.5 h-9 w-full rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs"
            >
              <FileSpreadsheet className="h-4 w-4" /> Download GSTR-2 CSV
            </button>
          </div>

          {/* GSTR-3B */}
          <div className="border border-slate-100 rounded-xl p-4 space-y-2.5 bg-slate-50/30 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">GSTR-3B Consolidated Return</p>
              <p className="text-[10px] text-gray-400 mt-0.5">PDF audit document reconciling total outward supplies, total inward ITC, and net GST payable to the tax department.</p>
            </div>
            <button
              type="button"
              onClick={() => exportGstr3bPDF(filteredSales, purchases, dateFilter)}
              className="flex items-center justify-center gap-1.5 h-9 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs"
            >
              <FileText className="h-4 w-4" /> Export GSTR-3B PDF
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Transaction Log */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">Sales Invoices Log ({filteredSales.length})</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click any invoice to view, print, or download</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
              <th className="px-6 py-3.5">Invoice #</th>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Date & Time</th>
              <th className="px-6 py-3.5">Items</th>
              <th className="px-6 py-3.5">Payment</th>
              <th className="px-6 py-3.5 text-right">Grand Total (₹)</th>
              <th className="px-6 py-3.5 text-right">Invoice Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSales.map((s) => (
              <tr
                key={s.id}
                onClick={() => setSelectedInvoice(s)}
                className="hover:bg-blue-50/50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-3.5 font-mono text-xs font-bold text-blue-600 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {s.invoiceNumber}
                </td>
                <td className="px-6 py-3.5 text-xs text-gray-700 font-medium">{s.customerName}</td>
                <td className="px-6 py-3.5 text-xs text-gray-500 font-mono">
                  {new Date(s.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-3.5 text-xs text-gray-600">
                  {s.items.reduce((sum, i) => sum + i.quantity, 0)} units ({s.items.length} items)
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 uppercase">
                    {s.paymentMethod}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                  ₹{s.totalAmount.toFixed(2)}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInvoice(s);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" /> View / Print
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
