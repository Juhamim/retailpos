"use client";

import React, { useState } from "react";
import { PaymentMethod } from "@retailflow/shared-types";
import { X, Banknote, CreditCard, Smartphone, Split, CheckCircle2, ArrowRight } from "lucide-react";

interface PaymentModalProps {
  total: number;
  onComplete: (payments: { method: PaymentMethod; amount: number; reference?: string }[]) => void;
  onCancel: () => void;
}

export function PaymentModal({ total, onComplete, onCancel }: PaymentModalProps) {
  const [mode, setMode] = useState<"single" | "split">("single");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cashAmount, setCashAmount] = useState(total.toFixed(2));
  const [reference, setReference] = useState("");

  // Split Payment states
  const [splitCash, setSplitCash] = useState<string>("0");
  const [splitUpi, setSplitUpi] = useState<string>("0");
  const [splitCard, setSplitCard] = useState<string>("0");

  const cashTendered = parseFloat(cashAmount) || 0;
  const change = Math.max(0, cashTendered - total);

  // Split calculation
  const totalSplitPaid = (parseFloat(splitCash) || 0) + (parseFloat(splitUpi) || 0) + (parseFloat(splitCard) || 0);
  const splitRemaining = Math.max(0, total - totalSplitPaid);
  const isSplitValid = Math.abs(total - totalSplitPaid) < 0.01;

  const handleConfirmSingle = () => {
    const payments: Array<{ method: PaymentMethod; amount: number; reference?: string }> = [];
    if (selectedMethod === PaymentMethod.CASH) {
      payments.push({ method: PaymentMethod.CASH, amount: total });
    } else {
      payments.push({ method: selectedMethod, amount: total, reference: reference.trim() || undefined });
    }
    onComplete(payments);
  };

  const handleConfirmSplit = () => {
    const payments: Array<{ method: PaymentMethod; amount: number; reference?: string }> = [];
    const c = parseFloat(splitCash) || 0;
    const u = parseFloat(splitUpi) || 0;
    const cd = parseFloat(splitCard) || 0;

    if (c > 0) payments.push({ method: PaymentMethod.CASH, amount: c });
    if (u > 0) payments.push({ method: PaymentMethod.UPI, amount: u, reference: "Split UPI" });
    if (cd > 0) payments.push({ method: PaymentMethod.CARD, amount: cd, reference: "Split Card" });

    onComplete(payments);
  };

  const autoFillRemaining = (type: "cash" | "upi" | "card") => {
    const current = totalSplitPaid - (parseFloat(type === "cash" ? splitCash : type === "upi" ? splitUpi : splitCard) || 0);
    const remainder = Math.max(0, total - current);
    if (type === "cash") setSplitCash(remainder.toFixed(2));
    if (type === "upi") setSplitUpi(remainder.toFixed(2));
    if (type === "card") setSplitCard(remainder.toFixed(2));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gray-50/80 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Checkout & Payment</h2>
            <p className="text-xs text-gray-500">Select payment method or split tender</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector & Total */}
        <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Amount Due</p>
            <p className="text-2xl font-bold text-blue-950">₹{total.toFixed(2)}</p>
          </div>
          <div className="flex bg-white/90 border border-blue-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setMode("single")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === "single" ? "bg-blue-600 text-white shadow-xs" : "text-blue-900 hover:bg-blue-50"
              }`}
            >
              Single
            </button>
            <button
              onClick={() => {
                setMode("split");
                setSplitCash((total / 2).toFixed(2));
                setSplitUpi((total / 2).toFixed(2));
                setSplitCard("0");
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === "split" ? "bg-blue-600 text-white shadow-xs" : "text-blue-900 hover:bg-blue-50"
              }`}
            >
              <Split className="h-3 w-3" /> Split
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {mode === "single" ? (
            <>
              {/* Payment Methods Grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: PaymentMethod.CASH, label: "Cash", icon: Banknote },
                  { id: PaymentMethod.UPI, label: "UPI / QR", icon: Smartphone },
                  { id: PaymentMethod.CARD, label: "Card", icon: CreditCard },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => {
                      setSelectedMethod(pm.id);
                      setCashAmount(total.toFixed(2));
                      setReference("");
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      selectedMethod === pm.id
                        ? "border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs"
                        : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                    }`}
                  >
                    <pm.icon className="h-5 w-5" />
                    <span className="text-xs font-bold">{pm.label}</span>
                  </button>
                ))}
              </div>

              {/* Cash Input */}
              {selectedMethod === PaymentMethod.CASH && (
                <div className="space-y-3 bg-gray-50/80 p-3.5 rounded-xl border border-gray-200">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>Cash Tendered (₹)</span>
                      <span>Change: <strong className="text-emerald-700">₹{change.toFixed(2)}</strong></span>
                    </div>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full h-11 text-center text-xl font-bold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Quick Denominations */}
                  <div className="flex gap-1.5">
                    {[
                      total,
                      Math.ceil(total / 10) * 10,
                      Math.ceil(total / 50) * 50,
                      Math.ceil(total / 100) * 100,
                      Math.ceil(total / 500) * 500,
                    ]
                      .filter((v, i, a) => a.indexOf(v) === i && v >= total)
                      .slice(0, 4)
                      .map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashAmount(amt.toFixed(2))}
                          className="flex-1 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-gray-700 transition-colors"
                        >
                          ₹{amt}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Reference */}
              {selectedMethod !== PaymentMethod.CASH && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Transaction ID / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. UPI Ref #4029108"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </>
          ) : (
            /* Split Payment UI */
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-amber-900">Remaining to Allocate:</span>
                <span className={`font-bold text-sm ${splitRemaining === 0 ? "text-emerald-700" : "text-amber-800"}`}>
                  ₹{splitRemaining.toFixed(2)}
                </span>
              </div>

              {/* Cash Row */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-emerald-600" /> Cash
                  </span>
                  <button
                    type="button"
                    onClick={() => autoFillRemaining("cash")}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Pay Balance
                  </button>
                </div>
                <input
                  type="number"
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* UPI Row */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-blue-600" /> UPI / QR
                  </span>
                  <button
                    type="button"
                    onClick={() => autoFillRemaining("upi")}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Pay Balance
                  </button>
                </div>
                <input
                  type="number"
                  value={splitUpi}
                  onChange={(e) => setSplitUpi(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Card Row */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-purple-600" /> Card / POS
                  </span>
                  <button
                    type="button"
                    onClick={() => autoFillRemaining("card")}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Pay Balance
                  </button>
                </div>
                <input
                  type="number"
                  value={splitCard}
                  onChange={(e) => setSplitCard(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={mode === "single" ? handleConfirmSingle : handleConfirmSplit}
            disabled={mode === "single" ? cashTendered < total && selectedMethod === PaymentMethod.CASH : !isSplitValid}
            className="flex-[2] h-11 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete Sale (₹{total.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
}
