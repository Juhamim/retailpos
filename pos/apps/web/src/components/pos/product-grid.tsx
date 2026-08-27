"use client";

import React, { useState, useMemo } from "react";
import { Package, AlertTriangle } from "lucide-react";
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
        selectedCategory === "All" || p.categoryName === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddProduct(product)}
            className="bg-white rounded-xl border border-gray-100 p-3.5 text-left hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="h-3 w-3" />
                    {product.stockQuantity} left
                  </span>
                )}
                {product.stockQuantity === 0 && (
                  <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                    Out of stock
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-xs text-gray-900 mb-0.5 line-clamp-2 leading-tight">
                {product.name}
              </h3>
              <p className="text-[11px] text-gray-400 font-mono mb-2">{product.sku}</p>
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-gray-100">
              <div>
                <span className="text-sm font-bold text-gray-900 block">
                  ₹{product.sellingPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {Math.round(((product.sellingPrice - (product.purchasePrice || product.sellingPrice * 0.7)) / product.sellingPrice) * 100)}% margin
                </span>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">
                GST {product.gstRate}%
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400 py-16">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No products match your search</p>
          </div>
        </div>
      )}
    </div>
  );
}
