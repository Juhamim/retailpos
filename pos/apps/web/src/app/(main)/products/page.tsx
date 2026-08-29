"use client";

import React, { useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, Package, X, Check, AlertCircle, Upload } from "lucide-react";
import Link from "next/link";
import { useProductStore } from "@/stores/product-store";
import { useSupplierStore } from "@/stores/supplier-store";
import type { ProductWithCategory } from "@retailflow/shared-types";
import { ProductStatus, GSTRate } from "@retailflow/shared-types";

const PAGE_SIZE = 10;

export default function ProductsPage() {
  const products = useProductStore((state) => state.products);
  const categories = useProductStore((state) => state.categories);
  const addProduct = useProductStore((state) => state.addProduct);
  const updateProduct = useProductStore((state) => state.updateProduct);
  const removeProduct = useProductStore((state) => state.removeProduct);
  const suppliers = useSupplierStore((state) => state.suppliers);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSupplier, setSelectedSupplier] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleBulkImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        if (lines.length <= 1) {
          alert("CSV is empty or missing headers");
          return;
        }

        // Get headers and normalize
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf("name");
        const skuIdx = headers.indexOf("sku");
        const barcodeIdx = headers.indexOf("barcode");
        const categoryIdx = headers.indexOf("category");
        const purchaseIdx = headers.indexOf("purchaseprice");
        const sellingIdx = headers.indexOf("sellingprice");
        const gstIdx = headers.indexOf("gstrate");
        const stockIdx = headers.indexOf("stock");
        const unitIdx = headers.indexOf("unit");

        if (nameIdx === -1 || sellingIdx === -1) {
          alert("CSV must contain at least 'Name' and 'SellingPrice' columns");
          return;
        }

        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
          if (cols.length < headers.length) continue;

          const name = cols[nameIdx];
          if (!name) continue;

          const sku = skuIdx !== -1 && cols[skuIdx] ? cols[skuIdx] : `SKU-${Date.now()}-${i}`;
          const barcode = barcodeIdx !== -1 && cols[barcodeIdx] ? cols[barcodeIdx] : `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
          const categoryName = categoryIdx !== -1 && cols[categoryIdx] ? cols[categoryIdx] : "General";
          
          const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
          const categoryId = cat ? cat.id : categories[0]?.id || "cat-1";

          const purchasePrice = purchaseIdx !== -1 && cols[purchaseIdx] ? parseFloat(cols[purchaseIdx]) : 0;
          const sellingPrice = parseFloat(cols[sellingIdx]) || 0;
          
          let gstRate = GSTRate.EIGHTEEN;
          if (gstIdx !== -1 && cols[gstIdx]) {
            const rateStr = cols[gstIdx].replace(/%|gst/gi, "");
            if (rateStr === "0" || rateStr === "zero") gstRate = GSTRate.ZERO;
            else if (rateStr === "5") gstRate = GSTRate.FIVE;
            else if (rateStr === "12") gstRate = GSTRate.TWELVE;
            else if (rateStr === "18") gstRate = GSTRate.EIGHTEEN;
            else if (rateStr === "28") gstRate = GSTRate.TWENTY_EIGHT;
          }

          const stockQuantity = stockIdx !== -1 && cols[stockIdx] ? parseInt(cols[stockIdx]) || 0 : 100;
          const unit = unitIdx !== -1 && cols[unitIdx] ? cols[unitIdx] : "pcs";

          addProduct({
            name,
            sku,
            barcode,
            categoryId,
            categoryName,
            purchasePrice,
            sellingPrice,
            gstRate,
            discountPercent: 0,
            stockQuantity,
            reorderLevel: 10,
            unit,
            status: ProductStatus.ACTIVE,
            isWeighable: false
          });
          importedCount++;
        }

        setImportStatus(`Successfully imported ${importedCount} products!`);
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err) {
        alert("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductWithCategory>>({});

  // Delete Confirmation State
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const categoryList = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.categoryName || "General")));
    return ["All", ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(search));
      const matchesCategory =
        selectedCategory === "All" || p.categoryName === selectedCategory;
      const matchesSupplier =
        selectedSupplier === "All" || p.supplierId === selectedSupplier;
      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "active" && p.stockQuantity > 0) ||
        (selectedStatus === "out" && p.stockQuantity === 0);
      return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
    });
  }, [products, search, selectedCategory, selectedSupplier, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleOpenEdit = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setEditForm({ ...product });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const matchedSupplier = suppliers.find((s) => s.id === editForm.supplierId);

    updateProduct(editingProduct.id, {
      ...editForm,
      supplierId: editForm.supplierId || undefined,
      supplierName: matchedSupplier ? matchedSupplier.name : (editForm.supplierId ? editForm.supplierName : undefined),
      sellingPrice: Number(editForm.sellingPrice) || 0,
      purchasePrice: Number(editForm.purchasePrice) || 0,
      stockQuantity: Number(editForm.stockQuantity) || 0,
      discountPercent: Number(editForm.discountPercent) || 0,
      reorderLevel: Number(editForm.reorderLevel) || 5,
    });

    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    removeProduct(id);
    setDeletingProductId(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store's inventory, barcodes, pricing, and GST rates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="csv-bulk-import-input"
            accept=".csv"
            onChange={handleBulkImportCsv}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById("csv-bulk-import-input")?.click()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </Link>
        </div>
      </div>

      {importStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
          <Check className="h-4 w-4 text-emerald-600 animate-bounce" />
          {importStatus}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, SKU or barcode..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categoryList.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "All" ? "All Categories" : cat}
            </option>
          ))}
        </select>
        <select
          value={selectedSupplier}
          onChange={(e) => {
            setSelectedSupplier(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Suppliers / Vendors</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Status</option>
          <option value="active">In Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-left text-xs uppercase tracking-wider text-gray-500 border-b">
                <th className="px-5 py-3.5 font-bold">Product</th>
                <th className="px-4 py-3.5 font-bold">HSN / SKU</th>
                <th className="px-4 py-3.5 font-bold">Category</th>
                <th className="px-4 py-3.5 font-bold">Supplier</th>
                <th className="px-4 py-3.5 text-right font-bold">MRP (₹)</th>
                <th className="px-4 py-3.5 text-right font-bold">Price (₹)</th>
                <th className="px-4 py-3.5 text-center font-bold">GST</th>
                <th className="px-4 py-3.5 text-center font-bold">Stock</th>
                <th className="px-4 py-3.5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((product) => {
                const isOut = product.stockQuantity === 0;
                const isLow = product.stockQuantity <= product.reorderLevel && !isOut;

                return (
                  <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-bold">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block text-xs">{product.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {product.unit || "pcs"} {product.rackLocation ? `• ${product.rackLocation}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {product.hsnCode && (
                        <span className="inline-block font-mono text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded mr-1">
                          HSN: {product.hsnCode}
                        </span>
                      )}
                      <p className="font-mono text-xs text-gray-700 font-semibold">{product.sku}</p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-bold">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {product.supplierName ? (
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-100">
                          {product.supplierName}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Direct / Self</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-500 font-mono text-xs">
                      {product.mrp ? `₹${product.mrp.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-gray-900 text-xs">
                      ₹{product.sellingPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs font-bold text-gray-600">
                      {product.gstRate}%
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isOut
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : isLow
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isOut ? "Out of Stock" : `${product.stockQuantity} ${product.unit || "pcs"}`}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProductId(product.id)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginated.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No products found matching your filters</p>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-900">{filteredProducts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
            <span className="font-semibold text-gray-900">{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}</span> of{" "}
            <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="px-2 text-xs text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Edit Product</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Product Name *</label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">SKU *</label>
                  <input
                    type="text"
                    value={editForm.sku || ""}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    required
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Barcode</label>
                  <input
                    type="text"
                    value={editForm.barcode || ""}
                    onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Category</label>
                  <input
                    type="text"
                    value={editForm.categoryName || ""}
                    onChange={(e) => setEditForm({ ...editForm, categoryName: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Primary Supplier / Vendor</label>
                  <select
                    value={editForm.supplierId || ""}
                    onChange={(e) => {
                      const sId = e.target.value;
                      const sObj = suppliers.find((s) => s.id === sId);
                      setEditForm({
                        ...editForm,
                        supplierId: sId || undefined,
                        supplierName: sObj?.name || undefined,
                      });
                    }}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- No Supplier (Direct) --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Unit</label>
                  <select
                    value={editForm.unit || "pcs"}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {["pcs", "kg", "g", "box", "bottle", "can", "pack", "L", "ml"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.purchasePrice ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, purchasePrice: Number(e.target.value) })}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.sellingPrice ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, sellingPrice: Number(e.target.value) })}
                    required
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">GST Rate (%)</label>
                  <select
                    value={editForm.gstRate || GSTRate.EIGHTEEN}
                    onChange={(e) => setEditForm({ ...editForm, gstRate: e.target.value as GSTRate })}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={GSTRate.ZERO}>0% (Exempt)</option>
                    <option value={GSTRate.FIVE}>5%</option>
                    <option value={GSTRate.TWELVE}>12%</option>
                    <option value={GSTRate.EIGHTEEN}>18%</option>
                    <option value={GSTRate.TWENTY_EIGHT}>28%</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Profit Margin</label>
                  <div className="h-10 px-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center font-bold text-xs text-emerald-800">
                    {Number(editForm.sellingPrice) > 0
                      ? `${(((Number(editForm.sellingPrice) - (Number(editForm.purchasePrice) || 0)) / Number(editForm.sellingPrice)) * 100).toFixed(1)}% Margin`
                      : "0%"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Stock Quantity *</label>
                  <input
                    type="number"
                    value={editForm.stockQuantity ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, stockQuantity: Number(e.target.value) })}
                    required
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">Delete Product?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingProductId)}
                className="flex-1 h-10 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
