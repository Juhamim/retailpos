"use client";

import React, { useState } from "react";
import { AlertTriangle, Package, Plus, Minus, RefreshCw, X, History, Check } from "lucide-react";
import { useProductStore } from "@/stores/product-store";
import type { ProductWithCategory } from "@retailflow/shared-types";

type FilterTab = "all" | "low" | "out" | "history";

export default function InventoryPage() {
  const products = useProductStore((state) => state.products);
  const stockAdjustments = useProductStore((state) => state.stockAdjustments);
  const adjustStock = useProductStore((state) => state.adjustStock);

  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [adjustType, setAdjustType] = useState<"restock" | "damage" | "audit">("restock");
  const [quantityInput, setQuantityInput] = useState<string>("10");
  const [reasonInput, setReasonInput] = useState<string>("");

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock Control</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time stock tracking, automatic POS deductions, and restock adjustments
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
      <div className="flex gap-2">
        {(["all", "low", "out", "history"] as FilterTab[]).map((tab) => (
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
              : `Stock Movements (${stockAdjustments.length})`}
          </button>
        ))}
      </div>

      {/* Main Content: Table vs History */}
      {filter !== "history" ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5">SKU / Barcode</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-center">Current Stock</th>
                <th className="px-6 py-3.5 text-center">Reorder Level</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => {
                const isOut = item.stockQuantity === 0;
                const isLow = item.stockQuantity <= item.reorderLevel && !isOut;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-gray-900">{item.name}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{item.sku}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-600">{item.categoryName}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`font-bold text-sm ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-900"}`}>
                        {item.stockQuantity} {item.unit || "pcs"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center text-xs text-gray-500">
                      {item.reorderLevel} {item.unit || "pcs"}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenAdjust(item)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No inventory items in this view</p>
            </div>
          )}
        </div>
      ) : (
        /* Stock Movement Log */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Adjustment Type</th>
                <th className="px-6 py-3.5 text-center">Change</th>
                <th className="px-6 py-3.5 text-center">New Stock</th>
                <th className="px-6 py-3.5">Reason / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockAdjustments.map((adj) => (
                <tr key={adj.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 text-xs text-gray-500 font-mono">
                    {new Date(adj.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-gray-900">{adj.productName}</td>
                  <td className="px-6 py-3.5 text-xs">
                    <span className="capitalize font-medium">{adj.type}</span>
                  </td>
                  <td className="px-6 py-3.5 text-center font-bold">
                    <span className={adj.quantityChange >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {adj.quantityChange >= 0 ? `+${adj.quantityChange}` : adj.quantityChange}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center font-semibold text-gray-900">{adj.newStock}</td>
                  <td className="px-6 py-3.5 text-xs text-gray-500">{adj.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {stockAdjustments.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No stock adjustment movements recorded yet</p>
            </div>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Adjust Stock</h3>
                <p className="text-xs text-gray-500">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between items-center text-xs">
                <span className="text-gray-500">Current Stock:</span>
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
