"use client";

import React, { useState, useMemo } from "react";
import {
  Truck,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  Edit,
  Trash2,
  X,
  MapPin,
  Package,
  FileText,
  CreditCard,
  ExternalLink,
  Receipt,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupplierStore } from "@/stores/supplier-store";
import { useProductStore } from "@/stores/product-store";
import { usePurchaseStore, PurchaseRecord } from "@/stores/purchase-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { Supplier, ProductWithCategory } from "@retailflow/shared-types";

export default function SuppliersPage() {
  const router = useRouter();
  const suppliers = useSupplierStore((state) => state.suppliers);
  const addSupplier = useSupplierStore((state) => state.addSupplier);
  const updateSupplier = useSupplierStore((state) => state.updateSupplier);
  const removeSupplier = useSupplierStore((state) => state.removeSupplier);

  const products = useProductStore((state) => state.products);
  const purchases = usePurchaseStore((state) => state.purchases);
  const currency = useSettingsStore((state) => state.settings.shop.currencySymbol || "₹");

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Modal Views for Interconnection
  const [viewingProductsSupplier, setViewingProductsSupplier] = useState<Supplier | null>(null);
  const [viewingInvoicesSupplier, setViewingInvoicesSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formGst, setFormGst] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const filtered = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
        (s.phone && s.phone.includes(search)) ||
        (s.gstNumber && s.gstNumber.toLowerCase().includes(search.toLowerCase()))
    );
  }, [suppliers, search]);

  // Overall Financial KPIs
  const totalBilledAll = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [purchases]);

  const totalPendingDebtAll = useMemo(() => {
    return purchases
      .filter((p) => p.paymentStatus === "pending")
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [purchases]);

  const handleOpenAdd = () => {
    setFormName("");
    setFormContact("");
    setFormPhone("");
    setFormEmail("");
    setFormGst("");
    setFormAddress("");
    setFormNotes("");
    setShowAddModal(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormName(s.name);
    setFormContact(s.contactPerson || "");
    setFormPhone(s.phone || "");
    setFormEmail(s.email || "");
    setFormGst(s.gstNumber || "");
    setFormAddress(s.address || "");
    setFormNotes(s.notes || "");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: formName.trim(),
        contactPerson: formContact.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        gstNumber: formGst.trim() || undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      setEditingSupplier(null);
    } else {
      addSupplier({
        name: formName.trim(),
        contactPerson: formContact.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        gstNumber: formGst.trim() || undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined,
        isActive: true,
      });
      setShowAddModal(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers & Vendor Network</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Interconnected supplier database, linked product catalog lines, and purchase invoice ledgers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/purchases"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-2xs"
          >
            <Receipt className="h-4 w-4 text-indigo-600" /> All Purchase Invoices
          </Link>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add New Supplier
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{suppliers.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Vendors</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-purple-600">
              {products.filter((p) => p.supplierId).length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Linked Products</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-indigo-700">
              {currency}{totalBilledAll.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{purchases.length} Total Bills</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-rose-700">
              {currency}{totalPendingDebtAll.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Unpaid Payables</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers by company, contact person, phone, GSTIN..."
          className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
        />
      </div>

      {/* Suppliers Interconnected Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                <th className="px-5 py-3.5">Company / Vendor</th>
                <th className="px-4 py-3.5">Contact Person</th>
                <th className="px-4 py-3.5">Phone & Email</th>
                <th className="px-4 py-3.5 text-center">Supplied Items</th>
                <th className="px-4 py-3.5 text-right">Invoiced Volume</th>
                <th className="px-4 py-3.5 text-center">Payment Status</th>
                <th className="px-5 py-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((supplier) => {
                const supplierProds = products.filter((p) => p.supplierId === supplier.id);
                const supplierBills = purchases.filter((p) => p.supplierId === supplier.id);
                const totalBilled = supplierBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                const unpaidBilled = supplierBills
                  .filter((b) => b.paymentStatus === "pending")
                  .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

                return (
                  <tr key={supplier.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{supplier.name}</p>
                          {supplier.gstNumber && (
                            <span className="inline-block font-mono text-[10px] bg-slate-100 text-slate-700 font-semibold px-1 rounded">
                              GST: {supplier.gstNumber}
                            </span>
                          )}
                          <p className="text-[10px] text-gray-400 max-w-[180px] truncate">{supplier.address || "—"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs font-medium text-gray-800">
                      {supplier.contactPerson || "—"}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      <p className="font-semibold text-gray-900">{supplier.phone || "—"}</p>
                      {supplier.email && <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{supplier.email}</p>}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setViewingProductsSupplier(supplier)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-[11px] border border-purple-200/70 transition-all"
                        title="Click to view all products supplied by this vendor"
                      >
                        <Package className="h-3 w-3 text-purple-600" />
                        {supplierProds.length} Products
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono">
                      <button
                        type="button"
                        onClick={() => setViewingInvoicesSupplier(supplier)}
                        className="text-right hover:underline group"
                        title="Click to view all purchase bills from this vendor"
                      >
                        <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600">
                          {currency}{totalBilled.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-gray-400">{supplierBills.length} Invoices</p>
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {unpaidBilled > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Clock className="h-2.5 w-2.5" />
                          {currency}{unpaidBilled.toFixed(0)} Pending
                        </span>
                      ) : supplierBills.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="h-2.5 w-2.5" /> Settled
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">No Bills</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/purchases?newBill=true&supplierId=${supplier.id}`}
                          className="h-8 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-all border border-indigo-200/60"
                          title="Create New Purchase Bill from this Supplier"
                        >
                          <Receipt className="h-3 w-3" /> New Bill
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(supplier)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Edit Supplier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeSupplier(supplier.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete Supplier"
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

        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <Truck className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No suppliers found</p>
          </div>
        )}
      </div>

      {/* MODAL 1: VIEW SUPPLIED PRODUCTS FOR VENDOR */}
      {viewingProductsSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Products Supplied by {viewingProductsSupplier.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {products.filter((p) => p.supplierId === viewingProductsSupplier.id).length} catalog products mapped to this vendor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingProductsSupplier(null)}
                className="p-2 rounded-xl hover:bg-gray-200 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {(() => {
                const supplied = products.filter((p) => p.supplierId === viewingProductsSupplier.id);
                if (supplied.length === 0) {
                  return (
                    <div className="py-12 text-center text-gray-400 space-y-3">
                      <Package className="h-12 w-12 mx-auto text-gray-300" />
                      <p className="text-xs font-semibold">No products currently linked to this supplier.</p>
                      <Link
                        href="/products/new"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add New Product for {viewingProductsSupplier.name}
                      </Link>
                    </div>
                  );
                }

                return (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 text-left uppercase text-[10px] font-bold">
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5">SKU / HSN</th>
                        <th className="p-2.5 text-right">Cost Price</th>
                        <th className="p-2.5 text-right">Selling Price</th>
                        <th className="p-2.5 text-center">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {supplied.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <p className="font-bold text-slate-900">{prod.name}</p>
                            <span className="text-[10px] text-slate-400">{prod.categoryName}</span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-600">
                            {prod.sku}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                            {currency}{prod.purchasePrice?.toFixed(2) || "0.00"}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            {currency}{prod.sellingPrice.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                prod.stockQuantity === 0
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {prod.stockQuantity} {prod.unit || "pcs"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
              <Link
                href="/products/new"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Product to Catalog
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW SUPPLIER INVOICES / BILLS LEDGER */}
      {viewingInvoicesSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Purchase Invoices: {viewingInvoicesSupplier.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {purchases.filter((p) => p.supplierId === viewingInvoicesSupplier.id).length} recorded invoices
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingInvoicesSupplier(null)}
                className="p-2 rounded-xl hover:bg-gray-200 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {(() => {
                const bills = purchases.filter((p) => p.supplierId === viewingInvoicesSupplier.id);
                if (bills.length === 0) {
                  return (
                    <div className="py-12 text-center text-gray-400 space-y-3">
                      <Receipt className="h-12 w-12 mx-auto text-gray-300" />
                      <p className="text-xs font-semibold">No purchase bills recorded yet from this supplier.</p>
                      <Link
                        href={`/purchases?newBill=true&supplierId=${viewingInvoicesSupplier.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                      >
                        <Plus className="h-3.5 w-3.5" /> Record First Purchase Bill
                      </Link>
                    </div>
                  );
                }

                return (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 text-left uppercase text-[10px] font-bold">
                        <th className="p-2.5">Invoice #</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5 text-center">Items</th>
                        <th className="p-2.5 text-right">Total (₹)</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {bills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-indigo-700">
                            {bill.invoiceNumber}
                          </td>
                          <td className="p-2.5 text-slate-500">
                            {new Date(bill.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              {bill.items.length} items
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {currency}{bill.totalAmount.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                bill.paymentStatus === "paid"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {bill.paymentStatus === "paid" ? "Paid" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
              <Link
                href="/purchases"
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                Go to Purchases Page <ArrowRight className="h-3 w-3" />
              </Link>

              <Link
                href={`/purchases?newBill=true&supplierId=${viewingInvoicesSupplier.id}`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Create New Bill
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {(showAddModal || editingSupplier) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Truck className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-sm text-gray-900">
                  {editingSupplier ? "Edit Supplier Details" : "Add New Supplier / Vendor"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSupplier(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Company / Vendor Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Kerala Spice Traders / Amul Distributors"
                  required
                  className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Contact Person</label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="orders@vendor.com"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={formGst}
                    onChange={(e) => setFormGst(e.target.value.toUpperCase())}
                    placeholder="32ABCDE1234F1Z5"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Address / Godown</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Market Road, Kochi"
                  className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Notes / Payment Terms</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. 15-day credit period, delivers on Tuesdays"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSupplier(null);
                  }}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {editingSupplier ? "Save Changes" : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
