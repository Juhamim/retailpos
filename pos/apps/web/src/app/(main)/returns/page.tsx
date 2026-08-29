"use client";

import React, { useState, useMemo } from "react";
import { useSalesStore } from "@/stores/sales-store";
import { useProductStore } from "@/stores/product-store";
import { useCustomerStore } from "@/stores/customer-store";
import { useReturnsStore, ReturnedItem } from "@/stores/returns-store";
import { RefreshCw, Search, ShieldAlert, Check, FileText, ArrowLeftRight, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReturnsPage() {
  const sales = useSalesStore((state) => state.sales);
  const updateSaleStatus = useSalesStore((state) => state.updateSaleStatus);
  const adjustStock = useProductStore((state) => state.adjustStock);
  const recordCreditTransaction = useCustomerStore((state) => state.recordCreditTransaction);
  const { returns, addReturn } = useReturnsStore();

  const [searchInvoice, setSearchInvoice] = useState("");
  const [activeInvoice, setActiveInvoice] = useState<any>(null);

  const recentCompletedSales = useMemo(() => {
    return sales.filter(s => s.status === "completed").slice(0, 5);
  }, [sales]);
  
  // State for quantities to return: Record<productId, quantity>
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState("cash");
  const [reason, setReason] = useState("Customer request / change of mind");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleInvoiceSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const sale = sales.find(s => s.invoiceNumber.toLowerCase().trim() === searchInvoice.toLowerCase().trim());
    if (sale) {
      if (sale.status === "returned") {
        setError("This invoice has already been fully returned / refunded.");
        setActiveInvoice(null);
      } else {
        setActiveInvoice(sale);
        // Initialize return quantities to 0
        const qtys: Record<string, number> = {};
        for (const item of sale.items) {
          qtys[item.productId] = 0;
        }
        setReturnQtys(qtys);
      }
    } else {
      setError("Invoice number not found in database.");
      setActiveInvoice(null);
    }
  };

  const handleQtyChange = (productId: string, val: number, maxQty: number) => {
    const qty = Math.max(0, Math.min(maxQty, val));
    setReturnQtys(prev => ({
      ...prev,
      [productId]: qty
    }));
  };

  const refundTotal = useMemo(() => {
    if (!activeInvoice) return 0;
    let sum = 0;
    for (const item of activeInvoice.items) {
      const qtyToReturn = returnQtys[item.productId] || 0;
      if (qtyToReturn > 0) {
        // Calculate item rate after discount
        const lineTotal = item.unitPrice * item.quantity;
        const discount = lineTotal * (item.discountPercent / 100);
        const pricePerUnit = (lineTotal - discount) / item.quantity;
        const itemTax = item.taxAmount / item.quantity;
        sum += (pricePerUnit + itemTax) * qtyToReturn;
      }
    }
    return Math.round(sum * 100) / 100;
  }, [activeInvoice, returnQtys]);

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (refundTotal <= 0) {
      setError("Please select at least 1 item to return.");
      return;
    }

    const itemsToReturn: ReturnedItem[] = [];
    for (const item of activeInvoice.items) {
      const qty = returnQtys[item.productId] || 0;
      if (qty > 0) {
        const lineTotal = item.unitPrice * item.quantity;
        const discount = lineTotal * (item.discountPercent / 100);
        const pricePerUnit = (lineTotal - discount) / item.quantity;
        const itemTax = item.taxAmount / item.quantity;
        
        itemsToReturn.push({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: qty,
          unitPrice: item.unitPrice,
          refundAmount: (pricePerUnit + itemTax) * qty
        });

        // 1. Restock Inventory
        adjustStock(item.productId, qty, "restock", `Sales Return Restock (Inv: ${activeInvoice.invoiceNumber})`);
      }
    }

    // 2. Issue Store Credit if selected
    if (refundMethod === "credit" && activeInvoice.customerId) {
      recordCreditTransaction(
        activeInvoice.customerId,
        "payment", // Adds credit balance (paying off invoice/returning goods credit)
        refundTotal,
        "credit",
        `Refund for invoice return ${activeInvoice.invoiceNumber}`
      );
    }

    // 3. Save Return Record
    const record = addReturn({
      invoiceNumber: activeInvoice.invoiceNumber,
      items: itemsToReturn,
      refundAmount: refundTotal,
      refundMethod,
      reason,
    });

    // 4. Update sales store status to returned if fully refunded
    updateSaleStatus(activeInvoice.invoiceNumber, "returned" as any);

    setSuccessMsg(`Return processed successfully! Refund of ₹${refundTotal} issued.`);
    generateCreditNotePDF(record);
    setActiveInvoice(null);
    setSearchInvoice("");
  };

  const generateCreditNotePDF = (record: any) => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CREDIT NOTE / REFUND RECEIPT", 14, 20);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text([
      `Credit Note ID: ${record.id}`,
      `Original Invoice Number: ${record.invoiceNumber}`,
      `Date & Time: ${new Date(record.createdAt).toLocaleString()}`,
      `Refund Method: ${record.refundMethod.toUpperCase()}`,
      `Reason: ${record.reason}`
    ], 14, 28);

    const tableRows = record.items.map((i: any) => [
      i.productName,
      i.productSku,
      String(i.quantity),
      `₹${i.unitPrice.toFixed(2)}`,
      `₹${i.refundAmount.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [["Product Details", "SKU", "Qty Returned", "Original Price", "Refund Amount"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] } // Red theme for returns
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`TOTAL REFUND AMOUNT: ₹${record.refundAmount.toFixed(2)}`, 14, finalY);

    doc.save(`CreditNote_${record.id}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ArrowLeftRight className="h-7 w-7 text-rose-600" /> Sales Returns & Refunds Manager
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 font-medium">
          Lookup billing invoices, process item restocking, and issue store credit notes or cash refunds
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Return Engine */}
        <div className="flex-1 space-y-6">
          {/* Invoice Lookup Form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
            <h3 className="font-bold text-sm text-gray-900">1. Invoice Lookup</h3>
            <form onSubmit={handleInvoiceSearch} className="flex gap-2">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-20260827-0042"
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="h-11 px-5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors"
              >
                Search Invoice
              </button>
            </form>

            {recentCompletedSales.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Quick Select:</span>
                {recentCompletedSales.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSearchInvoice(s.invoiceNumber);
                      setActiveInvoice(s);
                      setError("");
                      setSuccessMsg("");
                      // Initialize quantities
                      const qtys: Record<string, number> = {};
                      for (const item of s.items) {
                        qtys[item.productId] = 0;
                      }
                      setReturnQtys(qtys);
                    }}
                    className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors border border-slate-200/40"
                  >
                    {s.invoiceNumber} (₹{s.totalAmount})
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}

            {successMsg && (
              <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center gap-1.5">
                <Check className="h-4 w-4 shrink-0" /> {successMsg}
              </p>
            )}
          </div>

          {/* Invoice Items details and selection */}
          {activeInvoice && (
            <form onSubmit={handleProcessReturn} className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-6">
              <div>
                <h3 className="font-bold text-sm text-gray-900">2. Process Return Details</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">Invoice Number: {activeInvoice.invoiceNumber} | Customer: {activeInvoice.customerName}</p>
              </div>

              {/* Items list */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3 text-center">Purchased Qty</th>
                      <th className="px-4 py-3 text-center">Quantity to Return</th>
                      <th className="px-4 py-3 text-right">Price paid (ea)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeInvoice.items.map((item: any) => (
                      <tr key={item.productId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-400 font-mono">SKU: {item.productSku}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-3.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={returnQtys[item.productId] || 0}
                            onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 0, item.quantity)}
                            className="w-16 h-8 text-center border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                          ₹{((item.totalAmount) / item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Refund method & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">Refund Mode</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="cash">Cash Handover</option>
                    <option value="upi">UPI / Online Refund</option>
                    <option value="card">Card Reversal</option>
                    {activeInvoice.customerId && <option value="credit">Customer Store Credit (Khata Note)</option>}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">Reason for Outward Supply Return</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action row */}
              <div className="flex justify-between items-center border-t pt-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aggregate Refund Total</p>
                  <p className="text-xl font-black text-rose-600">₹{refundTotal.toLocaleString()}</p>
                </div>
                <button
                  type="submit"
                  className="h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                >
                  Confirm Restock & Refund
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Returns Log list (Sidebar layout) */}
        <div className="w-full lg:w-96 bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 self-start">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Refunds & Credit Notes Issued ({returns.length})</h3>
          
          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
            {returns.map((ret) => (
              <div key={ret.id} className="border border-gray-200 rounded-xl p-3.5 space-y-2 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-xs text-rose-600 font-mono">{ret.invoiceNumber}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(ret.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => generateCreditNotePDF(ret)}
                    className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center gap-0.5"
                    title="Print credit note receipt"
                  >
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </button>
                </div>

                <div className="text-xs text-gray-600 leading-normal">
                  <p className="truncate"><strong className="text-gray-900">Reason:</strong> {ret.reason}</p>
                  <div className="flex justify-between items-center mt-2 border-t pt-1.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Method: {ret.refundMethod}</span>
                    <span className="font-bold text-gray-900">₹{ret.refundAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}

            {returns.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No return logs recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
