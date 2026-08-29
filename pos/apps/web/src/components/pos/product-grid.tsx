"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Package, AlertTriangle, PlusCircle, Search } from "lucide-react";
import { useProductStore } from "@/stores/product-store";
import type { ProductWithCategory } from "@retailflow/shared-types";

interface ProductGridProps {
  searchQuery?: string;
  onAddProduct: (product: ProductWithCategory) => void;
}

export function ProductGrid({ searchQuery = "", onAddProduct }: ProductGridProps) {
  const products = useProductStore((state) => state.products);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.categoryName || "General")));
    return ["All", ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(searchQuery));
      const matchesCategory =
        selectedCategory === "All" || (p.categoryName || "General") === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Category Pills Filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin shrink-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === "All" ? products.length : products.filter((p) => (p.categoryName || "General") === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                    isSelected ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Products Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              {searchQuery ? <Search className="h-6 w-6" /> : <Package className="h-6 w-6" />}
            </div>
            <p className="text-sm font-bold text-slate-800">
              {searchQuery ? `No products matching "${searchQuery}"` : "No products in store catalog"}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {searchQuery
                ? "Check for typos or scan the exact barcode."
                : "Add your store items to begin ringing up sales."}
            </p>
            {!searchQuery && (
              <Link
                href="/products/new"
                className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <PlusCircle className="h-4 w-4" /> Add First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const marginPct = product.sellingPrice > 0
                ? Math.round(((product.sellingPrice - (product.purchasePrice || product.sellingPrice * 0.7)) / product.sellingPrice) * 100)
                : 0;
              const isLowStock = product.stockQuantity <= (product.reorderLevel || 5) && product.stockQuantity > 0;
              const isOutOfStock = product.stockQuantity <= 0;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onAddProduct(product)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3.5 text-left hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Top section */}
                  <div className="w-full">
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                        <Package className="h-4 w-4" />
                      </div>

                      {/* Stock Badges */}
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                          Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {product.stockQuantity} left
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                          {product.stockQuantity} in stock
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{product.sku}</p>
                  </div>

                  {/* Bottom Price & Tax Bar */}
                  <div className="w-full pt-2.5 mt-2 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className="text-sm font-black text-slate-900 block">
                        ₹{product.sellingPrice.toFixed(2)}
                      </span>
                      {marginPct > 0 && (
                        <span className="text-[9px] text-emerald-700 font-bold">
                          {marginPct}% margin
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      GST {product.gstRate}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
