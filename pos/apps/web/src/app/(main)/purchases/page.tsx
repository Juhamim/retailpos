"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, Eye, AlertCircle, FileText, CheckCircle, Clock, Undo } from "lucide-react";
import { usePurchaseStore, PurchaseRecord, PurchaseItem } from "@/stores/purchase-store";
import { useSupplierStore } from "@/stores/supplier-store";
import { useProductStore } from "@/stores/product-store";
import { usePurchaseReturnStore } from "@/stores/purchase-return-store";
import { exportDebitNotePDF } from "@/lib/pdf-export";
import { GSTRate } from "@retailflow/shared-types";

export default function PurchasesPage() {
  const { purchases, addPurchase } = usePurchaseStore();
  const suppliers = useSupplierStore((state) => state.suppliers);
  const products = useProductStore((state) => state.products);
  const { addPurchaseReturn } = usePurchaseReturnStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  const [viewingBill, setViewingBill] = useState<PurchaseRecord | null>(null);

  // Supplier Returns State
  const [returningBill, setReturningBill] = useState<PurchaseRecord | null>(null);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [returnNotes, setReturnNotes] = useState("");

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [billItems, setBillItems] = useState<PurchaseItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");

  // Temporary Item Adder State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemCost, setItemCost] = useState(0);

  // Auto pre-fill cost price when product is selected in form
  const handleProductSelectChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setItemCost(prod.purchasePrice || 0);
    }
  };

  const handleAddItemToBill = () => {
    if (!selectedProductId || itemQty <= 0) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Check if item is already added to bill
    if (billItems.some((item) => item.productId === selectedProductId)) {
      alert("Product already added to the bill. Remove it first to adjust.");
      return;
    }

    const rateNum = parseFloat(prod.gstRate.replace(/%|gst/gi, "")) || 0;
    const lineTotalCost = itemCost * itemQty;
    const taxAmount = lineTotalCost * (rateNum / 100);

    const newItem: PurchaseItem = {
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      quantity: itemQty,
      purchasePrice: itemCost,
      taxRate: rateNum,
      taxAmount: taxAmount,
      totalAmount: lineTotalCost + taxAmount,
    };

    setBillItems([...billItems, newItem]);
    setSelectedProductId("");
    setItemQty(1);
    setItemCost(0);
  };

  const handleRemoveItemFromBill = (productId: string) => {
    setBillItems(billItems.filter((item) => item.productId !== productId));
  };

  const billTotals = useMemo(() => {
    const subtotal = billItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
    const taxAmount = billItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [billItems]);

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return alert("Please enter supplier invoice number");
    if (!selectedSupplierId) return alert("Please select a supplier");
    if (billItems.length === 0) return alert("Please add at least one item to the bill");

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;

    addPurchase({
      invoiceNumber: invoiceNumber.trim(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: billItems,
      subtotal: billTotals.subtotal,
      taxAmount: billTotals.taxAmount,
      totalAmount: billTotals.total,
      paymentMethod,
      paymentStatus,
    });

    // Reset Form
    setInvoiceNumber("");
    setSelectedSupplierId("");
    setBillItems([]);
    setPaymentMethod("CASH");
    setPaymentStatus("paid");
    setShowNewBillModal(false);
  };

  const handleProcessPurchaseReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningBill) return;

    const itemsReturned: any[] = [];
    let totalRefundAmount = 0;

    for (const item of returningBill.items) {
      const qty = returnQtys[item.productId] || 0;
      if (qty > 0) {
        if (qty > item.quantity) {
          alert(`Return quantity for ${item.productName} cannot exceed purchased quantity (${item.quantity})`);
          return;
        }

        const itemTotalCost = item.purchasePrice * qty;
        const lineTaxAmount = itemTotalCost * (item.taxRate / 100);
        const lineTotalRefund = itemTotalCost + lineTaxAmount;

        itemsReturned.push({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: qty,
          purchasePrice: item.purchasePrice,
          taxRate: item.taxRate,
          taxAmount: lineTaxAmount,
          totalAmount: lineTotalRefund,
        });

        totalRefundAmount += lineTotalRefund;
      }
    }

    if (itemsReturned.length === 0) {
      alert("Please specify return quantity of at least one item.");
      return;
    }

    const completedReturn = addPurchaseReturn({
      purchaseId: returningBill.id,
      purchaseInvoiceNumber: returningBill.invoiceNumber,
      supplierId: returningBill.supplierId,
      supplierName: returningBill.supplierName,
      itemsReturned,
      totalRefundAmount,
      notes: returnNotes,
    });

    exportDebitNotePDF(completedReturn);

    setReturningBill(null);
    setViewingBill(null);
    setReturnNotes("");
    setReturnQtys({});
  };

  // Filtered List
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || p.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchases, searchQuery, statusFilter]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const totalAsset = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const paidSum = purchases.filter((p) => p.paymentStatus === "paid").reduce((sum, p) => sum + p.totalAmount, 0);
    const pendingSum = purchases.filter((p) => p.paymentStatus === "pending").reduce((sum, p) => sum + p.totalAmount, 0);
    return { totalAsset, paidSum, pendingSum };
  }, [purchases]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Bills Register</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Record raw stock procurement invoices from suppliers to restock inventory and claim GST ITC
          </p>
        </div>
        <button
          onClick={() => setShowNewBillModal(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Record Supplier Bill
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1.5">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Stock Assets Procured</p>
          <p className="text-2xl font-black text-gray-900">₹{metrics.totalAsset.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1.5">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Paid Invoices (Settled)</p>
          <p className="text-2xl font-black text-emerald-600">₹{metrics.paidSum.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1.5">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pending Dues to Suppliers</p>
          <p className="text-2xl font-black text-amber-600">₹{metrics.pendingSum.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by supplier name or bill number..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Payment Statuses</option>
          <option value="paid">Paid (Settled)</option>
          <option value="pending">Pending (Unpaid Dues)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Bill / Invoice #</th>
                <th className="px-6 py-3.5">Supplier</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-center">Items Count</th>
                <th className="px-6 py-3.5 text-right">Bill Total</th>
                <th className="px-6 py-3.5 text-center">Payment Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.map((pur) => (
                <tr key={pur.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900 font-mono">{pur.invoiceNumber}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{pur.supplierName}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(pur.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center font-semibold text-gray-700">{pur.items.length}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">₹{pur.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        pur.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {pur.paymentStatus === "paid" ? (
                        <>
                          <CheckCircle className="h-3 w-3" /> Paid
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 animate-pulse" /> Pending
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setViewingBill(pur)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No purchase bills recorded matching filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Bill Modal */}
      {showNewBillModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto flex flex-col p-6 space-y-5">
            <div className="flex justify-between items-center border-b pb-3.5">
              <h3 className="text-base font-bold text-gray-900">Record Supplier Purchase Bill</h3>
              <button
                onClick={() => setShowNewBillModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4 flex-grow">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Supplier Invoice / Bill # *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. BILL-9942"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Select Supplier *</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item Adder Panel */}
              <div className="bg-gray-50 border p-4 rounded-xl space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add Product Item to Bill</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full h-9 px-2.5 border border-gray-200 rounded-lg text-xs bg-white"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                      className="w-full h-9 px-2 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Purchase Price / Cost (ea)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={itemCost}
                      onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 px-2 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddItemToBill}
                  className="h-8 px-4 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  + Add Item Line
                </button>
              </div>

              {/* Items List Table */}
              <div className="border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 border-b font-bold text-gray-600">
                    <tr>
                      <th className="px-4 py-2">Item Details</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Cost (ea)</th>
                      <th className="px-4 py-2 text-center">Tax %</th>
                      <th className="px-4 py-2 text-right">Line Total</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {billItems.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-2 font-semibold text-gray-800">{item.productName}</td>
                        <td className="px-4 py-2 text-center font-bold">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">₹{item.purchasePrice.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">{item.taxRate}%</td>
                        <td className="px-4 py-2 text-right font-bold">₹{item.totalAmount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromBill(item.productId)}
                            className="text-rose-600 hover:text-rose-700 font-bold underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}

                    {billItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-400 font-medium">
                          No items added to the bill yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment Methods & Status */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="CASH">Cash Settlement</option>
                    <option value="UPI">UPI / Net Banking</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="CREDIT">Supplier Credit Account</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="paid">Paid (Fully Settled)</option>
                    <option value="pending">Pending (Unpaid Dues)</option>
                  </select>
                </div>
              </div>

              {/* Summary & Submit */}
              <div className="border-t pt-4 flex justify-between items-center bg-gray-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div>
                  <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Aggregate Bill Amount</p>
                  <p className="text-xl font-black text-gray-900">₹{billTotals.total.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewBillModal(false)}
                    className="h-10 px-4 rounded-xl border border-gray-300 text-xs font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Save Procurement Invoice
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bill Details Modal */}
      {viewingBill && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 font-mono">Bill details: {viewingBill.invoiceNumber}</h3>
              <button
                onClick={() => setViewingBill(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600 grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
              <p><strong>Supplier:</strong> {viewingBill.supplierName}</p>
              <p><strong>Date Filed:</strong> {new Date(viewingBill.createdAt).toLocaleString()}</p>
              <p><strong>Payment Method:</strong> {viewingBill.paymentMethod}</p>
              <p><strong>Payment Status:</strong> {viewingBill.paymentStatus.toUpperCase()}</p>
            </div>

            {/* List */}
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 border-b font-bold text-gray-600">
                  <tr>
                    <th className="px-4 py-2">Item Details</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-right">Cost (ea)</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {viewingBill.items.map((i) => (
                    <tr key={i.productId}>
                      <td className="px-4 py-2 font-semibold text-gray-800">{i.productName}</td>
                      <td className="px-4 py-2 text-center font-bold">{i.quantity}</td>
                      <td className="px-4 py-2 text-right">₹{i.purchasePrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-bold">₹{i.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setReturningBill(viewingBill);
                  const qtys: Record<string, number> = {};
                  for (const item of viewingBill.items) {
                    qtys[item.productId] = 0;
                  }
                  setReturnQtys(qtys);
                }}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all"
              >
                <Undo className="h-4 w-4" /> File Return (Debit Note)
              </button>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Grand Total</p>
                <p className="text-lg font-black text-gray-900">₹{viewingBill.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Supplier Purchases Return Modal */}
      {returningBill && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 font-mono">File Supplier Return (Bill: {returningBill.invoiceNumber})</h3>
              <button
                type="button"
                onClick={() => setReturningBill(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessPurchaseReturn} className="space-y-4">
              <p className="text-xs text-slate-500 font-medium">Specify the quantities of items you wish to return due to defects or excess delivery.</p>

              <div className="border rounded-xl overflow-hidden bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 border-b font-bold text-gray-600">
                    <tr>
                      <th className="px-4 py-2">Product Name</th>
                      <th className="px-4 py-2 text-center">Purchased Qty</th>
                      <th className="px-4 py-2 text-center">Return Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {returningBill.items.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-2 font-semibold text-gray-800">{item.productName}</td>
                        <td className="px-4 py-2 text-center font-bold text-slate-500">{item.quantity}</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={returnQtys[item.productId] ?? 0}
                            onChange={(e) => {
                              const val = Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0));
                              setReturnQtys({ ...returnQtys, [item.productId]: val });
                            }}
                            className="w-16 h-8 px-2 border border-gray-200 rounded text-center font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Return Notes / Discrepancy Reason *</label>
                <input
                  type="text"
                  required
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Received damaged batches, packaging leakage"
                  className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setReturningBill(null)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Confirm Return & Print Debit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
