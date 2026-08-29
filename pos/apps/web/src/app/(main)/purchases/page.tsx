"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  AlertCircle,
  FileText,
  CheckCircle,
  Clock,
  Undo,
  Truck,
  Package,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  Building,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { usePurchaseStore, PurchaseRecord, PurchaseItem } from "@/stores/purchase-store";
import { useSupplierStore } from "@/stores/supplier-store";
import { useProductStore } from "@/stores/product-store";
import { usePurchaseReturnStore } from "@/stores/purchase-return-store";
import { exportDebitNotePDF } from "@/lib/pdf-export";
import { GSTRate, ProductStatus } from "@retailflow/shared-types";

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const { purchases, addPurchase } = usePurchaseStore();
  const suppliers = useSupplierStore((state) => state.suppliers);
  const { products, addProduct } = useProductStore();
  const { addPurchaseReturn } = usePurchaseReturnStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
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
  const [onlySupplierProducts, setOnlySupplierProducts] = useState(true);

  // Temporary Item Adder State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemCost, setItemCost] = useState(0);

  // Quick New Product Creator Drawer
  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("General");
  const [newProdCost, setNewProdCost] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdGst, setNewProdGst] = useState<GSTRate>(GSTRate.EIGHTEEN);

  // Auto-open modal if redirected with params
  useEffect(() => {
    const isNew = searchParams.get("newBill");
    const sId = searchParams.get("supplierId");
    if (isNew === "true" || sId) {
      setShowNewBillModal(true);
      if (sId) {
        setSelectedSupplierId(sId);
      }
    }
  }, [searchParams]);

  // Selected supplier details
  const activeSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

  // Filter available products based on selected supplier & toggle
  const availableProducts = useMemo(() => {
    if (!selectedSupplierId || !onlySupplierProducts) {
      return products;
    }
    const filtered = products.filter((p) => p.supplierId === selectedSupplierId);
    return filtered.length > 0 ? filtered : products;
  }, [products, selectedSupplierId, onlySupplierProducts]);

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

    if (billItems.some((item) => item.productId === selectedProductId)) {
      alert("Product already added to the bill. Remove it first to adjust quantity.");
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

  const handleQuickCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return alert("Product name is required");

    const sku = newProdSku.trim() || `SKU-${Date.now().toString().slice(-4)}`;
    const cost = parseFloat(newProdCost) || 0;
    const price = parseFloat(newProdPrice) || cost * 1.25 || 10;

    const created = addProduct({
      name: newProdName.trim(),
      sku,
      categoryId: `cat-${newProdCategory.toLowerCase().replace(/\s+/g, "-")}`,
      categoryName: newProdCategory,
      supplierId: activeSupplier?.id,
      supplierName: activeSupplier?.name,
      purchasePrice: cost,
      sellingPrice: price,
      gstRate: newProdGst,
      discountPercent: 0,
      stockQuantity: 0, // Will be restocked when the bill is saved
      reorderLevel: 5,
      unit: "pcs",
      status: ProductStatus.ACTIVE,
      isWeighable: false,
    });

    // Auto-select this newly created product in the bill adder
    setSelectedProductId(created.id);
    setItemCost(cost);
    setItemQty(1);
    setShowQuickAddProduct(false);

    // Reset quick product inputs
    setNewProdName("");
    setNewProdSku("");
    setNewProdCost("");
    setNewProdPrice("");
  };

  const handleRemoveItemFromBill = (productId: string) => {
    setBillItems(billItems.filter((item) => item.productId !== productId));
  };

  const billTotals = useMemo(() => {
    const subtotal = billItems.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0);
    const taxAmount = billItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [billItems]);

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return alert("Please enter supplier invoice number");
    if (!selectedSupplierId) return alert("Please select a supplier");
    if (billItems.length === 0) return alert("Please add at least one product item to the bill");

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

  const filteredPurchases = useMemo(() => {
    return purchases.filter((pur) => {
      const matchesSearch =
        pur.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pur.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pur.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "all" || pur.paymentStatus === statusFilter;
      const matchesSupplier = supplierFilter === "all" || pur.supplierId === supplierFilter;

      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [purchases, searchQuery, statusFilter, supplierFilter]);

  const handleOpenReturns = (pur: PurchaseRecord) => {
    setReturningBill(pur);
    const initQtys: Record<string, number> = {};
    pur.items.forEach((item) => {
      initQtys[item.productId] = 0;
    });
    setReturnQtys(initQtys);
    setReturnNotes("");
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningBill) return;

    const returnItems = returningBill.items
      .filter((item) => (returnQtys[item.productId] || 0) > 0)
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: returnQtys[item.productId],
        purchasePrice: item.purchasePrice,
        taxRate: item.taxRate,
        taxAmount: (item.purchasePrice * returnQtys[item.productId] * item.taxRate) / 100,
        totalAmount:
          item.purchasePrice * returnQtys[item.productId] * (1 + item.taxRate / 100),
      }));

    if (returnItems.length === 0) {
      alert("Please specify return quantity for at least one item.");
      return;
    }

    const subtotal = returnItems.reduce(
      (sum, item) => sum + item.purchasePrice * item.quantity,
      0
    );
    const taxAmount = returnItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalRefundAmount = subtotal + taxAmount;

    const returnRecord = addPurchaseReturn({
      purchaseId: returningBill.id,
      purchaseInvoiceNumber: returningBill.invoiceNumber,
      supplierId: returningBill.supplierId,
      supplierName: returningBill.supplierName,
      itemsReturned: returnItems,
      totalRefundAmount,
      notes: returnNotes.trim() || "Defective/Damaged goods return",
    });

    alert(
      `Debit Note ${returnRecord.debitNoteNumber} created successfully! Inventory deducted.`
    );
    exportDebitNotePDF(returnRecord);
    setReturningBill(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Invoices & Purchases</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Log vendor invoices, auto-restock product inventories, manage supplier accounts and debit notes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/suppliers"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-2xs"
          >
            <Truck className="h-4 w-4 text-blue-600" /> View All Suppliers
          </Link>
          <button
            onClick={() => setShowNewBillModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Record Purchase Bill
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Purchase Volume</span>
          <p className="text-2xl font-extrabold text-gray-900">
            ₹
            {purchases
              .reduce((sum, p) => sum + p.totalAmount, 0)
              .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-500">{purchases.length} recorded bills</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Settled & Paid</span>
          <p className="text-2xl font-extrabold text-emerald-700">
            ₹
            {purchases
              .filter((p) => p.paymentStatus === "paid")
              .reduce((sum, p) => sum + p.totalAmount, 0)
              .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-500">
            {purchases.filter((p) => p.paymentStatus === "paid").length} fully paid
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Pending Payables</span>
          <p className="text-2xl font-extrabold text-rose-700">
            ₹
            {purchases
              .filter((p) => p.paymentStatus === "pending")
              .reduce((sum, p) => sum + p.totalAmount, 0)
              .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-500">
            {purchases.filter((p) => p.paymentStatus === "pending").length} unpaid invoices
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Connected Suppliers</span>
          <p className="text-2xl font-extrabold text-purple-700">{suppliers.length}</p>
          <p className="text-[11px] text-gray-500">{products.filter((p) => p.supplierId).length} items mapped</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, vendor name, or product..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Payment Status</option>
          <option value="paid">Paid & Settled</option>
          <option value="pending">Pending Unpaid</option>
        </select>
      </div>

      {/* Purchases List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Invoice / Bill #</th>
                <th className="px-6 py-4">Supplier / Vendor</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Items Billed</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
                <th className="px-6 py-4 text-center">Payment Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredPurchases.map((pur) => (
                <tr key={pur.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-700">
                    {pur.invoiceNumber}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{pur.supplierName}</p>
                    <p className="text-[10px] text-gray-400">Method: {pur.paymentMethod}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(pur.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {pur.items.length} items (
                      {pur.items.reduce((s, i) => s + i.quantity, 0)} pcs)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                    ₹{pur.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        pur.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {pur.paymentStatus === "paid" ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" /> Paid
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5" /> Pending
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenReturns(pur)}
                        className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Return Items / Debit Note"
                      >
                        <Undo className="h-3 w-3" /> Return
                      </button>
                      <button
                        onClick={() => setViewingBill(pur)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
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

      {/* RECORD PURCHASE BILL MODAL (INTERCONNECTED) */}
      {showNewBillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Record Supplier Purchase Invoice</h3>
                  <p className="text-xs text-gray-500">Auto-restocks product inventory and updates vendor relationship cost</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewBillModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1.5 rounded-xl hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Supplier Invoice / Bill # *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-9942 / GST-2026-08"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Select Primary Supplier / Vendor *</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.phone ? `(${s.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Supplier Preview Bar */}
              {activeSupplier && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-indigo-600" />
                    <span className="font-bold text-indigo-950">{activeSupplier.name}</span>
                    {activeSupplier.gstNumber && (
                      <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-800">
                        GST: {activeSupplier.gstNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-slate-600 text-[11px]">
                    {activeSupplier.phone && <span>📞 {activeSupplier.phone}</span>}
                    <span className="bg-white px-2 py-0.5 rounded-full border text-indigo-700 font-bold">
                      {products.filter((p) => p.supplierId === activeSupplier.id).length} mapped products
                    </span>
                  </div>
                </div>
              )}

              {/* Item Adder Panel */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-indigo-600" /> Add Product Line to Bill
                  </p>

                  <div className="flex items-center gap-3">
                    {selectedSupplierId && (
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onlySupplierProducts}
                          onChange={(e) => setOnlySupplierProducts(e.target.checked)}
                          className="rounded text-indigo-600 w-3.5 h-3.5"
                        />
                        Filter by Vendor Products
                      </label>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowQuickAddProduct(!showQuickAddProduct)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs"
                    >
                      <Plus className="h-3 w-3" /> Quick Add New Product
                    </button>
                  </div>
                </div>

                {/* Quick Add Product Inline Drawer */}
                {showQuickAddProduct && (
                  <div className="p-4 bg-white border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Create & Map New Product to {activeSupplier?.name || "Supplier"}
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Product Name *"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="h-8 px-2.5 border rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="SKU (e.g. TEA-101)"
                        value={newProdSku}
                        onChange={(e) => setNewProdSku(e.target.value)}
                        className="h-8 px-2.5 border rounded-lg text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Category (e.g. Grocery)"
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value)}
                        className="h-8 px-2.5 border rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        placeholder="Purchase Cost (₹) *"
                        value={newProdCost}
                        onChange={(e) => setNewProdCost(e.target.value)}
                        className="h-8 px-2.5 border rounded-lg text-xs font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Selling Price (₹) *"
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        className="h-8 px-2.5 border rounded-lg text-xs font-bold"
                      />
                      <select
                        value={newProdGst}
                        onChange={(e) => setNewProdGst(e.target.value as GSTRate)}
                        className="h-8 px-2 border rounded-lg text-xs bg-white"
                      >
                        <option value={GSTRate.ZERO}>0% GST</option>
                        <option value={GSTRate.FIVE}>5% GST</option>
                        <option value={GSTRate.TWELVE}>12% GST</option>
                        <option value={GSTRate.EIGHTEEN}>18% GST</option>
                        <option value={GSTRate.TWENTY_EIGHT}>28% GST</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowQuickAddProduct(false)}
                        className="px-3 py-1 border rounded-lg text-xs font-medium text-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickCreateProduct}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        Create & Select
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Choose Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full h-9 px-2.5 border border-gray-200 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Select Product --</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) {p.supplierId === selectedSupplierId ? "⭐" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Quantity (pcs/units)</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                      className="w-full h-9 px-3 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Purchase Price / Cost (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={itemCost}
                      onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 px-3 border border-gray-200 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToBill}
                  className="h-8 px-4 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  + Add Line Item
                </button>
              </div>

              {/* Items List Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b font-bold text-slate-600">
                    <tr>
                      <th className="px-4 py-2.5">Item Details</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Cost (ea)</th>
                      <th className="px-4 py-2.5 text-center">Tax %</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                      <th className="px-4 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {billItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-slate-800">
                          {item.productName}
                          <span className="block font-mono text-[10px] text-slate-400 font-normal">{item.productSku}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right font-mono">₹{item.purchasePrice.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-center">{item.taxRate}%</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-indigo-700">₹{item.totalAmount.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromBill(item.productId)}
                            className="text-rose-600 hover:text-rose-700 font-bold"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}

                    {billItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                          No items added to this bill yet. Select a product above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              {billItems.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-bold">₹{billTotals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax Amount:</span>
                    <span className="font-mono font-bold">₹{billTotals.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t pt-1.5">
                    <span>Total Invoiced Bill Amount:</span>
                    <span className="font-mono text-indigo-700">₹{billTotals.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Payment Method & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-xs bg-white font-semibold"
                  >
                    <option value="CASH">Cash in Drawer</option>
                    <option value="UPI">UPI / Bank Account</option>
                    <option value="CARD">Bank Card / Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-xs bg-white font-semibold"
                  >
                    <option value="paid">Paid & Settled (Immediate Float Outflow)</option>
                    <option value="pending">Pending (Supplier Khata Payable)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewBillModal(false)}
                  className="flex-1 h-11 border border-gray-200 text-xs font-bold text-gray-600 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={billItems.length === 0}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" /> Save Invoice & Restock Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill View Details Modal */}
      {viewingBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b pb-3.5">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Purchase Bill: {viewingBill.invoiceNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  Vendor: {viewingBill.supplierName} • {new Date(viewingBill.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setViewingBill(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 border-b font-bold text-gray-600">
                    <tr>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Cost Price</th>
                      <th className="px-4 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {viewingBill.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">
                          <p className="font-bold text-gray-900">{i.productName}</p>
                          <span className="font-mono text-[10px] text-gray-400">{i.productSku}</span>
                        </td>
                        <td className="px-4 py-2 text-center font-bold">{i.quantity}</td>
                        <td className="px-4 py-2 text-right">₹{i.purchasePrice.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-indigo-700">
                          ₹{i.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">₹{viewingBill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax:</span>
                  <span className="font-mono font-bold">₹{viewingBill.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t pt-1">
                  <span>Total Bill:</span>
                  <span className="font-mono text-indigo-700">₹{viewingBill.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingBill(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Return Modal */}
      {returningBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b pb-3.5">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Issue Supplier Return & Debit Note
                </h3>
                <p className="text-xs text-gray-500">
                  Return items to {returningBill.supplierName} (Invoice #{returningBill.invoiceNumber})
                </p>
              </div>
              <button
                onClick={() => setReturningBill(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div className="border rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 border-b font-bold text-gray-600">
                    <tr>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2 text-center">Billed Qty</th>
                      <th className="px-4 py-2 text-right">Cost (ea)</th>
                      <th className="px-4 py-2 text-center">Return Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {returningBill.items.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-2 font-bold text-gray-900">{item.productName}</td>
                        <td className="px-4 py-2 text-center font-bold">{item.quantity}</td>
                        <td className="px-4 py-2 text-right font-mono">₹{item.purchasePrice.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={returnQtys[item.productId] || 0}
                            onChange={(e) =>
                              setReturnQtys({
                                ...returnQtys,
                                [item.productId]: Math.min(
                                  item.quantity,
                                  Math.max(0, parseInt(e.target.value) || 0)
                                ),
                              })
                            }
                            className="w-16 h-8 border rounded-lg text-center font-bold focus:ring-2 focus:ring-amber-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Return Reason</label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Expired batch, packaging damaged during transit..."
                  className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReturningBill(null)}
                  className="flex-1 h-10 border border-gray-200 text-xs font-bold text-gray-600 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Undo className="h-4 w-4" /> Issue Debit Note & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
