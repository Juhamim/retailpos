"use client";

import React, { useState } from "react";
import { CartItem, PaymentMethod } from "@retailflow/shared-types";
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Pause, 
  Tag, 
  Wallet, 
  Smartphone, 
  CreditCard, 
  Receipt,
  ArrowRight,
  Sparkles
} from "lucide-react";

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
  onPayment: (preferredMethod?: PaymentMethod) => void;
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

  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(discountVal) || 0;
    onSetOrderDiscount(val);
    setShowDiscountInput(false);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Current Bill</h2>
            <p className="text-[10px] font-semibold text-slate-400">
              {totalUnits} units • {items.length} unique items
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[11px] text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-3">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">Order Cart is Empty</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Scan barcode, press <kbd className="font-mono font-bold bg-slate-100 px-1 py-0.5 rounded text-slate-600">F2</kbd>, or click products to begin.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 space-y-2 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-slate-900 truncate">{item.productName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">
                      ₹{item.unitPrice.toFixed(2)} / unit
                    </span>
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 rounded">
                      GST {item.taxRate}%
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-xs text-slate-900 block">
                    ₹{item.totalAmount.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.productId)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors inline-block mt-0.5"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Quantity Stepper Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Quantity</span>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-black text-slate-900 font-mono">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bill Calculation & Quick Pay Section */}
      <div className="border-t border-slate-200 p-3.5 bg-white space-y-3 shrink-0">
        {/* Bill Calculations Card */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500 font-medium">
            <span>Subtotal (Tax Exclusive)</span>
            <span className="font-mono font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-500 font-medium">
            <span>GST Tax Liability</span>
            <span className="font-mono font-semibold text-slate-800">₹{taxAmount.toFixed(2)}</span>
          </div>

          {/* Discount Line */}
          <div className="flex justify-between items-center text-slate-500">
            <button
              type="button"
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Tag className="h-3 w-3" />
              {orderDiscount > 0 ? `Discount (₹${orderDiscount.toFixed(2)})` : "+ Add Order Discount"}
            </button>
            {orderDiscount > 0 && (
              <span className="font-mono font-bold text-emerald-600">-₹{orderDiscount.toFixed(2)}</span>
            )}
          </div>

          {/* Inline Discount Form */}
          {showDiscountInput && (
            <form onSubmit={handleApplyDiscount} className="flex gap-1.5 pt-1">
              <input
                type="number"
                step="any"
                min="0"
                value={discountVal}
                onChange={(e) => setDiscountVal(e.target.value)}
                placeholder="Discount ₹"
                className="h-8 flex-1 px-2.5 rounded-lg border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                Apply
              </button>
            </form>
          )}

          {/* Net Payable Grand Total */}
          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Net Total</span>
            <span className="text-2xl font-black text-blue-600 tracking-tight">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 1-Tap Instant Payment Mode Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => onPayment(PaymentMethod.CASH)}
            className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all text-slate-700 hover:text-blue-700 disabled:opacity-40"
          >
            <Wallet className="h-4 w-4 mb-0.5 text-emerald-600" />
            <span className="text-[10px] font-bold">Cash</span>
          </button>

          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => onPayment(PaymentMethod.UPI)}
            className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all text-slate-700 hover:text-blue-700 disabled:opacity-40"
          >
            <Smartphone className="h-4 w-4 mb-0.5 text-blue-600" />
            <span className="text-[10px] font-bold">UPI / QR</span>
          </button>

          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => onPayment(PaymentMethod.CARD)}
            className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all text-slate-700 hover:text-blue-700 disabled:opacity-40"
          >
            <CreditCard className="h-4 w-4 mb-0.5 text-purple-600" />
            <span className="text-[10px] font-bold">Card</span>
          </button>
        </div>

        {/* Main Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onHoldSale}
            className={`h-11 px-3.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1 shrink-0 ${
              heldSalesCount > 0
                ? "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Hold or Resume order"
          >
            <Pause className="h-4 w-4 text-amber-600" />
            <span>{heldSalesCount > 0 ? `Held (${heldSalesCount})` : "Hold"}</span>
          </button>

          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => onPayment()}
            className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Charge ₹{total.toFixed(2)}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
