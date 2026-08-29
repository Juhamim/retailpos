"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, Package, Plus, Minus, RefreshCw, X, History, Check, FileText, ClipboardList } from "lucide-react";
import { useProductStore } from "@/stores/product-store";
import { useInventoryAuditStore, AuditItem, AuditRecord } from "@/stores/inventory-audit-store";
import type { ProductWithCategory } from "@retailflow/shared-types";

type FilterTab = "all" | "low" | "out" | "history" | "audit";

export default function InventoryPage() {
  const products = useProductStore((state) => state.products);
  const stockAdjustments = useProductStore((state) => state.stockAdjustments);
  const adjustStock = useProductStore((state) => state.adjustStock);
  const { audits, submitAudit } = useInventoryAuditStore();

  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [adjustType, setAdjustType] = useState<"restock" | "damage" | "audit">("restock");
  const [quantityInput, setQuantityInput] = useState<string>("10");
  const [reasonInput, setReasonInput] = useState<string>("");

  // Audit Form State
  const [auditNumber, setAuditNumber] = useState("");
  const [auditorName, setAuditorName] = useState("");
  const [auditNotes, setAuditNotes] = useState("");
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [selectedAuditProductId, setSelectedAuditProductId] = useState("");
  const [countedQty, setCountedQty] = useState(0);

  const lowCount = products.filter((i) => i.stockQuantity <= i.reorderLevel && i.stockQuantity > 0).length;
  const outCount = products.filter((i) => i.stockQuantity === 0).length;

  const filtered = products.filter((item) => {
    if (filter === "low") return item.stockQuantity <= item.reorderLevel && item.stockQuantity > 0;
    if (filter === "out") return item.stockQuantity === 0;
    return true;
  });

  const handleOpenAdjust = (product: ProductWithCategory) => {
    setSelectedProduct(product);
    setQuantityInput("10");
    setReasonInput("");
    setAdjustType("restock");
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = Number(quantityInput) || 0;
    if (qty <= 0) return;

    const delta = adjustType === "restock" ? qty : adjustType === "damage" ? -qty : qty - selectedProduct.stockQuantity;

    adjustStock(selectedProduct.id, delta, adjustType, reasonInput);
    setSelectedProduct(null);
  };

  // Audit Line item prefill count
  const handleAuditProductSelect = (productId: string) => {
    setSelectedAuditProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setCountedQty(prod.stockQuantity);
    }
  };

  const handleAddAuditItem = () => {
    if (!selectedAuditProductId) return;
    const prod = products.find((p) => p.id === selectedAuditProductId);
    if (!prod) return;

    // Check duplicate
    if (auditItems.some((item) => item.productId === selectedAuditProductId)) {
      alert("Product already added to current audit sheet.");
      return;
    }

    const variance = countedQty - prod.stockQuantity;
    const itemCost = prod.purchasePrice || 0;

    const newItem: AuditItem = {
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      systemQty: prod.stockQuantity,
      countedQty,
      variance,
      unitCost: itemCost,
      varianceValue: variance * itemCost,
    };

    setAuditItems([...auditItems, newItem]);
    setSelectedAuditProductId("");
    setCountedQty(0);
  };

  const handleRemoveAuditItem = (productId: string) => {
    setAuditItems(auditItems.filter((i) => i.productId !== productId));
  };

  const auditTotals = useMemo(() => {
    const totalVarianceQty = auditItems.reduce((sum, item) => sum + item.variance, 0);
    const totalVarianceValue = auditItems.reduce((sum, item) => sum + item.varianceValue, 0);
    return { totalVarianceQty, totalVarianceValue };
  }, [auditItems]);

  const handleSubmitAuditForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditNumber.trim()) return alert("Please enter audit sheet reference number");
    if (!auditorName.trim()) return alert("Please enter auditor name");
    if (auditItems.length === 0) return alert("Please add at least one counted item");

    submitAudit({
      auditNumber: auditNumber.trim(),
      items: auditItems,
      totalVarianceQty: auditTotals.totalVarianceQty,
      totalVarianceValue: auditTotals.totalVarianceValue,
      notes: auditNotes,
    });

    // Reset Form
    setAuditNumber("");
    setAuditorName("");
    setAuditNotes("");
    setAuditItems([]);
    alert("Physical Stock Audit submitted successfully! Database inventory reconciled.");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock Control</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time stock tracking, physical stock variance audits, and catalog adjustments
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Products</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{lowCount}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock Items</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{outCount}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Out of Stock</p>
          </div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="flex flex-wrap gap-2">
        {(["all", "low", "out", "history", "audit"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === tab
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab === "all"
              ? `All Stock (${products.length})`
              : tab === "low"
              ? `Low Stock (${lowCount})`
              : tab === "out"
              ? `Out of Stock (${outCount})`
              : tab === "history"
              ? `Stock Movements (${stockAdjustments.length})`
              : `Physical Audits (${audits.length})`}
          </button>
        ))}
      </div>

      {/* Main Content Sections */}
      {filter !== "history" && filter !== "audit" ? (
        // Stock Lists Table
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5">SKU / Barcode</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-center">Current Stock</th>
                <th className="px-6 py-3.5 text-center">Reorder Level</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((item) => {
                const isOut = item.stockQuantity === 0;
                const isLow = item.stockQuantity <= item.reorderLevel && !isOut;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.sku} / {item.barcode}</td>
                    <td className="px-6 py-4 text-gray-600">{item.categoryName || "General"}</td>
                    <td className="px-6 py-4 text-center font-extrabold text-gray-900">
                      {item.stockQuantity} {item.unit || "pcs"}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">{item.reorderLevel}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isOut
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : isLow
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isOut ? "Out of Stock" : isLow ? "Low Stock" : "Healthy"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenAdjust(item)}
                        className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : filter === "history" ? (
        // Stock Adjustments History
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-slate-500" />
            <h3 className="font-bold text-sm text-gray-900">Stock Movements History</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5 text-center">Adjustment Type</th>
                <th className="px-6 py-3.5 text-center">Quantity Delta</th>
                <th className="px-6 py-3.5">Reason / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {stockAdjustments.map((adj) => (
                <tr key={adj.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">{new Date(adj.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{adj.productName}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        adj.type === "restock"
                          ? "bg-emerald-50 text-emerald-700"
                          : adj.type === "damage"
                          ? "bg-red-50 text-red-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {adj.type === "restock" ? "Stock In" : adj.type === "damage" ? "Damage Out" : "Audit"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold">
                    {adj.quantityChange > 0 ? `+${adj.quantityChange}` : adj.quantityChange}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{adj.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Physical Stock Auditing Dashboard
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Audit Sheet Creator */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-base text-gray-900">Conduct Physical Stock Audit</h3>
            </div>

            <form onSubmit={handleSubmitAuditForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Audit Sheet Ref # *</label>
                  <input
                    type="text"
                    required
                    value={auditNumber}
                    onChange={(e) => setAuditNumber(e.target.value)}
                    placeholder="e.g. AUD-20260828"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Auditor Name *</label>
                  <input
                    type="text"
                    required
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    placeholder="e.g. Inspector John"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Item Counter Panel */}
              <div className="bg-slate-50 border p-4 rounded-xl space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Count Shelf Stock</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Product</label>
                    <select
                      value={selectedAuditProductId}
                      onChange={(e) => handleAuditProductSelect(e.target.value)}
                      className="w-full h-9 px-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Current: {p.stockQuantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Physical Counted Qty</label>
                    <input
                      type="number"
                      value={countedQty}
                      onChange={(e) => setCountedQty(parseInt(e.target.value) || 0)}
                      className="w-full h-9 px-2 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddAuditItem}
                  className="h-8 px-4 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Add Counted Item
                </button>
              </div>

              {/* Sheet Items Table */}
              <div className="border rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 border-b font-bold text-gray-600">
                    <tr>
                      <th className="px-4 py-2">Item Details</th>
                      <th className="px-4 py-2 text-center">System Qty</th>
                      <th className="px-4 py-2 text-center">Counted Qty</th>
                      <th className="px-4 py-2 text-center">Variance</th>
                      <th className="px-4 py-2 text-right">Variance Value</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {auditItems.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-2 font-semibold text-gray-800">{item.productName}</td>
                        <td className="px-4 py-2 text-center font-bold text-gray-600">{item.systemQty}</td>
                        <td className="px-4 py-2 text-center font-bold text-gray-900">{item.countedQty}</td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              item.variance === 0
                                ? "bg-slate-100 text-slate-700"
                                : item.variance > 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {item.variance > 0 ? `+${item.variance}` : item.variance}
                          </span>
                        </td>
                        <td className={`px-4 py-2 text-right font-bold ${item.varianceValue < 0 ? "text-rose-600" : "text-gray-900"}`}>
                          ₹{item.varianceValue.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveAuditItem(item.productId)}
                            className="text-rose-600 hover:text-rose-700 font-bold underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}

                    {auditItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-400 font-medium">
                          No audited stock count lines added.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Auditing Notes / Summary</label>
                <input
                  type="text"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="e.g. Discrepancies noted in beverage racks due to packing leaks"
                  className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Summary and Submit */}
              <div className="border-t pt-4 flex justify-between items-center bg-gray-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div className="flex gap-4">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Total Variance Qty</p>
                    <p className="text-sm font-extrabold text-gray-800">
                      {auditTotals.totalVarianceQty > 0 ? `+${auditTotals.totalVarianceQty}` : auditTotals.totalVarianceQty} pcs
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Net Variance Value</p>
                    <p className={`text-sm font-extrabold ${auditTotals.totalVarianceValue < 0 ? "text-rose-600" : "text-gray-800"}`}>
                      ₹{auditTotals.totalVarianceValue.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Submit Audit & Reconcile Catalog
                </button>
              </div>
            </form>
          </div>

          {/* Past Audits Logs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <ClipboardList className="h-5 w-5 text-slate-500" />
              <h3 className="font-bold text-base text-gray-900">Audit History Log</h3>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[480px]">
              {audits.map((aud) => (
                <div key={aud.id} className="border border-slate-100 rounded-xl p-3.5 space-y-2 bg-slate-50/20 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 font-mono">{aud.auditNumber}</span>
                    <span className="text-gray-400">{new Date(aud.auditedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500 font-semibold">
                    <p>Items Counted: {aud.items.length}</p>
                    <p className={aud.totalVarianceValue < 0 ? "text-rose-600" : "text-gray-700"}>
                      Variance: ₹{aud.totalVarianceValue.toFixed(2)}
                    </p>
                  </div>
                  {aud.notes && <p className="italic text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded">"{aud.notes}"</p>}
                </div>
              ))}

              {audits.length === 0 && (
                <div className="py-12 text-center text-gray-400 font-medium text-xs">
                  No physical stock audit records filed yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Single Dialog Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3.5 mb-4">
              <h3 className="text-base font-bold text-gray-900">Quick Adjust Inventory</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border">
                <span className="text-xs text-gray-500 font-semibold">{selectedProduct.name}</span>
                <span className="font-bold text-sm text-gray-900">
                  {selectedProduct.stockQuantity} {selectedProduct.unit || "pcs"}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Adjustment Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "restock", label: "+ Stock In", icon: Plus, color: "text-emerald-700 border-emerald-300 bg-emerald-50" },
                    { id: "damage", label: "- Damage", icon: Minus, color: "text-red-700 border-red-300 bg-red-50" },
                    { id: "audit", label: "= Audit", icon: RefreshCw, color: "text-blue-700 border-blue-300 bg-blue-50" },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setAdjustType(act.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        adjustType === act.id ? act.color : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <act.icon className="h-4 w-4" />
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  {adjustType === "restock" ? "Quantity to Add" : adjustType === "damage" ? "Quantity to Remove" : "Exact Count on Hand"}
                </label>
                <input
                  type="number"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  min="1"
                  required
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-base font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Reason / Supplier Batch Note</label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="e.g. Batch #902 fresh stock delivery"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
