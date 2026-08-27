"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, Sparkles } from "lucide-react";
import { useProductStore } from "@/stores/product-store";
import { ProductStatus, GSTRate } from "@retailflow/shared-types";

const categories = [
  "Beverages",
  "Snacks",
  "Food",
  "Dairy",
  "Personal Care",
  "Household",
  "Stationery",
  "Electronics",
  "General",
];

const gstRates = [
  { label: "0% (Exempt)", value: GSTRate.ZERO },
  { label: "5% (Essentials)", value: GSTRate.FIVE },
  { label: "12% (Standard Low)", value: GSTRate.TWELVE },
  { label: "18% (Standard)", value: GSTRate.EIGHTEEN },
  { label: "28% (Luxury / Aerated)", value: GSTRate.TWENTY_EIGHT },
];

const units = ["pcs", "kg", "g", "box", "bottle", "can", "pack", "L", "ml"];

interface FormData {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  description: string;
  purchasePrice: string;
  sellingPrice: string;
  gstRate: GSTRate;
  discountPercent: string;
  stockQuantity: string;
  reorderLevel: string;
  unit: string;
  status: ProductStatus;
}

const initialForm: FormData = {
  name: "",
  sku: "",
  barcode: "",
  category: "Beverages",
  description: "",
  purchasePrice: "",
  sellingPrice: "",
  gstRate: GSTRate.EIGHTEEN,
  discountPercent: "0",
  stockQuantity: "50",
  reorderLevel: "10",
  unit: "pcs",
  status: ProductStatus.ACTIVE,
};

export default function NewProductPage() {
  const router = useRouter();
  const addProduct = useProductStore((state) => state.addProduct);

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
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

    const purchasePrice = Number(form.purchasePrice) || 0;
    const sellingPrice = Number(form.sellingPrice) || 0;
    const stockQuantity = Number(form.stockQuantity) || 0;
    const reorderLevel = Number(form.reorderLevel) || 5;
    const discountPercent = Number(form.discountPercent) || 0;

    addProduct({
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || undefined,
      categoryId: `cat-${form.category.toLowerCase().replace(/\s+/g, "-")}`,
      categoryName: form.category,
      description: form.description.trim() || undefined,
      purchasePrice,
      sellingPrice,
      gstRate: form.gstRate,
      discountPercent,
      stockQuantity,
      reorderLevel,
      unit: form.unit,
      status: form.status,
      isWeighable: false,
    });

    router.push("/products");
  };

  const cost = Number(form.purchasePrice) || 0;
  const price = Number(form.sellingPrice) || 0;
  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0";

  return (
    <div className="max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shadow-2xs"
            title="Back to products"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Create a new item in your retail inventory catalog
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6"
      >
        {/* Basic details */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4 border-b border-gray-100 pb-2.5">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Product Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Britannia 50-50 Maska Chaska 200g"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">SKU Code *</label>
                <button
                  type="button"
                  onClick={generateSku}
                  className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Auto SKU
                </button>
              </div>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. BMC200"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">Barcode / EAN</label>
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Auto Barcode
                </button>
              </div>
              <input
                type="text"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="e.g. 8901234567890"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Measurement Unit</label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Product details, batch number, or brand notes..."
                rows={2}
                className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing & GST */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4 border-b border-gray-100 pb-2.5">
            Pricing & GST Rates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Purchase Cost (₹) *</label>
              <input
                type="number"
                step="0.01"
                name="purchasePrice"
                value={form.purchasePrice}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.purchasePrice && <p className="mt-1 text-xs text-red-600">{errors.purchasePrice}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.sellingPrice && <p className="mt-1 text-xs text-red-600">{errors.sellingPrice}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">GST Tax Rate</label>
              <select
                name="gstRate"
                value={form.gstRate}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {gstRates.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Gross Margin</label>
              <div className="h-10 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center font-bold text-sm text-emerald-800">
                {margin}% Margin
              </div>
            </div>
          </div>
        </div>

        {/* Initial Stock */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4 border-b border-gray-100 pb-2.5">
            Inventory Stock Setup
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Opening Stock Quantity *</label>
              <input
                type="number"
                name="stockQuantity"
                value={form.stockQuantity}
                onChange={handleChange}
                placeholder="0"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.stockQuantity && <p className="mt-1 text-xs text-red-600">{errors.stockQuantity}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Reorder Alert Level</label>
              <input
                type="number"
                name="reorderLevel"
                value={form.reorderLevel}
                onChange={handleChange}
                placeholder="10"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={ProductStatus.ACTIVE}>Active for Sale</option>
                <option value={ProductStatus.INACTIVE}>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
