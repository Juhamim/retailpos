"use client";

import React, { useState } from "react";
import { CartItem } from "@retailflow/shared-types";
import { Minus, Plus, Trash2, ShoppingBag, Pause, Tag, TrendingUp } from "lucide-react";

interface CartPanelProps {
  items: CartItem[];
  orderDiscount: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSetOrderDiscount: (discount: number) => void;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  heldSalesCount: number;
  onHoldSale: () => void;
  onPayment: () => void;
}

export function CartPanel({
  items,
  orderDiscount,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSetOrderDiscount,
  subtotal,
  taxAmount,
  discountAmount,
  total,
  heldSalesCount,
  onHoldSale,
  onPayment,
}: CartPanelProps) {
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountVal, setDiscountVal] = useState(orderDiscount.toString());

  // Calculate gross margin for cart items
  let totalCost = 0;
  for (const item of items) {
    totalCost += (item.purchasePrice || item.unitPrice * 0.7) * item.quantity;
  }
  const grossProfit = Math.max(0, subtotal - totalCost);
  const marginPercent = subtotal > 0 ? Math.round((grossProfit / subtotal) * 100) : 0;

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(discountVal) || 0;
    onSetOrderDiscount(val);
    setShowDiscountInput(false);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-3.5 border-b flex items-center justify-between bg-gray-50/70 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Active Cart</h2>
            <p className="text-[11px] text-gray-500">
              {items.reduce((s, i) => s + i.quantity, 0)} units • {items.length} items
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-gray-600">Cart is empty</p>
            <p className="text-xs text-gray-400 mt-0.5">Click products or scan barcode to start</p>
          </div>
        ) : (
          items.map((item) => {
            const itemCost = item.purchasePrice || item.unitPrice * 0.7;
            const itemMargin = Math.max(0, item.unitPrice - itemCost);
            const itemMarginPct = Math.round((itemMargin / item.unitPrice) * 100);

            return (
              <div
                key={item.productId}
                className="bg-gray-50/90 rounded-xl p-3 border border-gray-200/70 space-y-2 hover:bg-gray-100/70 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 truncate leading-tight">
                      {item.productName}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-gray-500">{item.productSku}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                        {itemMarginPct}% margin
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-200/50">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 h-6 text-center text-xs font-bold bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-xs text-gray-900">
                      ₹{(item.unitPrice * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-500">₹{item.unitPrice.toFixed(2)} / unit</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout (Sticky Bottom) */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 p-4 space-y-3 bg-white shrink-0 shadow-lg">
          {/* Margin & Profit Tag */}
          <div className="flex items-center justify-between p-2 bg-emerald-50/80 rounded-lg border border-emerald-200 text-xs">
            <span className="flex items-center gap-1 font-semibold text-emerald-800 text-[11px]">
              <TrendingUp className="h-3.5 w-3.5" /> Cart Profit Margin:
            </span>
            <span className="font-bold text-emerald-900 text-xs">
              ₹{grossProfit.toFixed(2)} ({marginPercent}%)
            </span>
          </div>

          {/* Subtotal, Tax, Discount */}
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Tax Liability:</span>
              <span className="font-semibold text-gray-900">₹{taxAmount.toFixed(2)}</span>
            </div>

            {/* Discount Row */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowDiscountInput(!showDiscountInput)}
                className="text-blue-600 hover:underline flex items-center gap-1 font-medium text-[11px]"
              >
                <Tag className="h-3 w-3" />
                {discountAmount > 0 ? "Edit Discount" : "+ Add Discount"}
              </button>
              {discountAmount > 0 && (
                <span className="font-bold text-emerald-600">-₹{discountAmount.toFixed(2)}</span>
              )}
            </div>

            {showDiscountInput && (
              <form onSubmit={handleApplyDiscount} className="flex gap-1.5 pt-1">
                <input
                  type="number"
                  placeholder="Discount (₹)"
                  value={discountVal}
                  onChange={(e) => setDiscountVal(e.target.value)}
                  className="flex-1 h-8 px-2 border rounded-lg text-xs"
                />
                <button
                  type="submit"
                  className="px-2.5 h-8 bg-gray-900 text-white rounded-lg text-xs font-semibold"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Grand Total */}
            <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline">
              <span className="font-bold text-gray-900 text-sm">Grand Total:</span>
              <span className="text-xl font-black text-blue-600">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onHoldSale}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pause className="h-4 w-4" />
              Hold ({heldSalesCount})
            </button>
            <button
              onClick={onPayment}
              className="flex-[2] h-11 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              Pay ₹{total.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
