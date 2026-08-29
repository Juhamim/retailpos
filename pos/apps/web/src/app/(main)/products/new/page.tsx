"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, Hash, Calendar, Tag, MapPin, CheckCircle2 } from "lucide-react";
import { useProductStore } from "@/stores/product-store";
import { useSupplierStore } from "@/stores/supplier-store";
import { ProductStatus, GSTRate } from "@retailflow/shared-types";

const categories = [
  "Beverages",
  "Snacks & Namkeen",
  "Grocery & Staples",
  "Dairy & Bakery",
  "Personal Care",
  "Household Cleaning",
  "Stationery & Office",
  "Electronics & Mobile",
  "Clothing & Apparel",
  "Pharmacy & Healthcare",
  "General Merchandise",
];

const POPULAR_HSN_CODES = [
  { code: "1006", label: "1006 - Rice, Wheat & Grains (0%/5%)" },
  { code: "1905", label: "1905 - Bread, Pastry, Biscuits (5%/18%)" },
  { code: "0401", label: "0401 - Milk, Paneer & Dairy (0%/5%)" },
  { code: "0902", label: "0902 - Tea & Coffee (5%)" },
  { code: "2106", label: "2106 - Packaged Foods & Namkeen (12%/18%)" },
  { code: "3304", label: "3304 - Beauty & Skincare (18%/28%)" },
  { code: "3401", label: "3401 - Soaps & Detergents (18%)" },
  { code: "8517", label: "8517 - Mobile Phones & Gadgets (18%)" },
  { code: "6109", label: "6109 - T-Shirts & Garments (5%/12%)" },
  { code: "3004", label: "3004 - Medicaments & Pharmacy (12%)" },
  { code: "4820", label: "4820 - Notebooks & Stationery (12%)" },
  { code: "9983", label: "9983 - Commercial & Repair Services (18%)" },
];

const gstRates = [
  { label: "0% (Exempt / Nil)", value: GSTRate.ZERO },
  { label: "5% (Essentials / Grocery)", value: GSTRate.FIVE },
  { label: "12% (Standard Low / Processed)", value: GSTRate.TWELVE },
  { label: "18% (Standard Retail / Electronics)", value: GSTRate.EIGHTEEN },
  { label: "28% (Luxury / Aerated Drinks)", value: GSTRate.TWENTY_EIGHT },
];

const units = ["pcs", "kg", "g", "box", "pack", "bottle", "can", "L", "ml", "mtr", "pair"];

interface FormData {
  name: string;
  sku: string;
  barcode: string;
  hsnCode: string;
  category: string;
  supplierId: string;
  description: string;
  mrp: string;
  purchasePrice: string;
  sellingPrice: string;
  gstRate: GSTRate;
  discountPercent: string;
  stockQuantity: string;
  reorderLevel: string;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  rackLocation: string;
  isTaxInclusive: boolean;
  status: ProductStatus;
}

const initialForm: FormData = {
  name: "",
  sku: "",
  barcode: "",
  hsnCode: "2106",
  category: "Grocery & Staples",
  supplierId: "",
  description: "",
  mrp: "",
  purchasePrice: "",
  sellingPrice: "",
  gstRate: GSTRate.FIVE,
  discountPercent: "0",
  stockQuantity: "50",
  reorderLevel: "10",
  unit: "pcs",
  batchNumber: "",
  expiryDate: "",
  rackLocation: "",
  isTaxInclusive: false,
  status: ProductStatus.ACTIVE,
};

export default function NewProductPage() {
  const router = useRouter();
  const addProduct = useProductStore((state) => state.addProduct);
  const suppliers = useSupplierStore((state) => state.suppliers);

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const generateBarcode = () => {
    const randomBarcode = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setForm((f) => ({ ...f, barcode: randomBarcode }));
  };

  const generateSku = () => {
    const prefix = form.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "SKU";
    const randomNum = Math.floor(100 + Math.random() * 900);
    setForm((f) => ({ ...f, sku: `${prefix}${randomNum}` }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormData, string>> = {};

    if (!form.name.trim()) next.name = "Product name is required";
    if (!form.sku.trim()) next.sku = "SKU is required";
    if (!form.category) next.category = "Please select a category";
    if (form.purchasePrice === "" || Number(form.purchasePrice) < 0)
      next.purchasePrice = "Enter a valid purchase price";
    if (form.sellingPrice === "" || Number(form.sellingPrice) <= 0)
      next.sellingPrice = "Selling price must be greater than 0";
    if (form.stockQuantity === "" || Number(form.stockQuantity) < 0)
      next.stockQuantity = "Enter a valid stock quantity";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);

    const mrp = Number(form.mrp) || Number(form.sellingPrice) || 0;
    const purchasePrice = Number(form.purchasePrice) || 0;
    const sellingPrice = Number(form.sellingPrice) || 0;
    const stockQuantity = Number(form.stockQuantity) || 0;
    const reorderLevel = Number(form.reorderLevel) || 5;
    const discountPercent = Number(form.discountPercent) || 0;
    const selectedSupplier = suppliers.find((s) => s.id === form.supplierId);

    addProduct({
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || undefined,
      hsnCode: form.hsnCode.trim() || undefined,
      mrp,
      categoryId: `cat-${form.category.toLowerCase().replace(/\s+/g, "-")}`,
      categoryName: form.category,
      supplierId: form.supplierId || undefined,
      supplierName: selectedSupplier?.name || undefined,
      description: form.description.trim() || undefined,
      purchasePrice,
      sellingPrice,
      gstRate: form.gstRate,
      discountPercent,
      stockQuantity,
      reorderLevel,
      unit: form.unit,
      batchNumber: form.batchNumber.trim() || undefined,
      expiryDate: form.expiryDate.trim() || undefined,
      rackLocation: form.rackLocation.trim() || undefined,
      isTaxInclusive: form.isTaxInclusive,
      status: form.status,
      isWeighable: form.unit === "kg" || form.unit === "g",
    });

    router.push("/products");
  };

  const cost = Number(form.purchasePrice) || 0;
  const price = Number(form.sellingPrice) || 0;
  const mrpVal = Number(form.mrp) || price;
  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0";
  const customerSavings = mrpVal > price ? (mrpVal - price).toFixed(2) : "0";

  return (
    <div className="max-w-4xl space-y-6 p-6 bg-slate-50 min-h-full">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Back to catalog"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add New Retail Product</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Configure product details, statutory HSN/GST rates, batch lot, and shelf location
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs flex items-center"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-1.5 h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving Product..." : "Save Product"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identification & HSN */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-2xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900">1. Basic Identification & Tax Classification</h2>
            <p className="text-xs text-slate-400 mt-0.5">Product title, barcode scan code, category, and government HSN/SAC code</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Product Name <span className="text-rose-500">*</span></span>
                {errors.name && <span className="text-rose-600 font-semibold">{errors.name}</span>}
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Basmati Rice 5kg Premium / Amul Butter 500g"
                className={`w-full h-10 px-3.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.name ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/40"
                }`}
                autoFocus
              />
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  SKU Code <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateSku}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Auto-generate
                </button>
              </div>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. RIC-501"
                className={`w-full h-10 px-3.5 rounded-xl border text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.sku ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/40"
                }`}
              />
            </div>

            {/* Barcode */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Barcode / EAN-13</label>
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Generate 890...
                </button>
              </div>
              <input
                type="text"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="Scan or enter barcode"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Department / Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Supplier / Vendor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Primary Supplier / Distributor</span>
                <span className="text-[10px] text-gray-400 font-normal">Optional</span>
              </label>
              <select
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- No Supplier Attached (Direct / Self) --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(${s.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* HSN / SAC Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-blue-600" /> HSN / SAC Code
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">Statutory GST</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  name="hsnCode"
                  value={form.hsnCode}
                  onChange={handleChange}
                  placeholder="e.g. 1006 / 1905"
                  className="w-28 h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setForm((f) => ({ ...f, hsnCode: e.target.value }));
                  }}
                  className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/40 text-xs text-slate-600 focus:outline-none"
                >
                  <option value="">-- Quick Select Common HSN --</option>
                  {POPULAR_HSN_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing, MRP & GST Slabs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-2xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">2. Pricing, MRP & GST Slabs</h2>
              <p className="text-xs text-slate-400 mt-0.5">Wholesale purchase cost, customer selling price, and tax rate</p>
            </div>
            {price > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold text-emerald-800">
                <span>Profit Margin: {margin}%</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MRP */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">MRP (Printed Price ₹)</label>
              <input
                type="number"
                step="any"
                min="0"
                name="mrp"
                value={form.mrp}
                onChange={handleChange}
                placeholder="e.g. 150.00"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Purchase Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex justify-between">
                <span>Cost / Purchase (₹) <span className="text-rose-500">*</span></span>
                {errors.purchasePrice && <span className="text-rose-600 text-[10px]">{errors.purchasePrice}</span>}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="purchasePrice"
                value={form.purchasePrice}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full h-10 px-3.5 rounded-xl border text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.purchasePrice ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/40"
                }`}
              />
            </div>

            {/* Selling Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex justify-between">
                <span>Selling Price (₹) <span className="text-rose-500">*</span></span>
                {errors.sellingPrice && <span className="text-rose-600 text-[10px]">{errors.sellingPrice}</span>}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full h-10 px-3.5 rounded-xl border text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.sellingPrice ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/40"
                }`}
              />
            </div>

            {/* GST Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">GST Slab Rate</label>
              <select
                name="gstRate"
                value={form.gstRate}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {gstRates.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tax Inclusive toggle & Customer Savings */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isTaxInclusive"
                checked={form.isTaxInclusive}
                onChange={handleChange}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="font-bold text-slate-800">Selling Price is Inclusive of GST Tax</span>
            </label>

            {Number(customerSavings) > 0 && (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                Customer Saves: ₹{customerSavings} below MRP
              </span>
            )}
          </div>
        </div>

        {/* Section 3: Stock, Batch Lot & Location */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-2xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900">3. Inventory Stock, Batch Lot & Warehouse Location</h2>
            <p className="text-xs text-slate-400 mt-0.5">Track shelf reorders, lot manufacturing/expiry dates, and store bin aisle</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Opening Stock */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Opening Stock</label>
              <input
                type="number"
                name="stockQuantity"
                value={form.stockQuantity}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Reorder Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Low Stock Reorder Alert</label>
              <input
                type="number"
                name="reorderLevel"
                value={form.reorderLevel}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Unit of Measurement</label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Tag className="h-3 w-3 text-slate-400" /> Batch / Lot Number
              </label>
              <input
                type="text"
                name="batchNumber"
                value={form.batchNumber}
                onChange={handleChange}
                placeholder="e.g. BATCH-2026/A"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" /> Expiry Date (Perishables)
              </label>
              <input
                type="date"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Rack Location */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" /> Shelf / Rack Location Tag
              </label>
              <input
                type="text"
                name="rackLocation"
                value={form.rackLocation}
                onChange={handleChange}
                placeholder="e.g. Aisle 3, Row B, Top Shelf"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Form Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/products"
            className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving Catalog Item..." : "Save Catalog Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
