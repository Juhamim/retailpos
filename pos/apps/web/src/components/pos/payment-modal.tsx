import React, { useState } from "react";
import { PaymentMethod } from "@retailflow/shared-types";
import { X, Banknote, CreditCard, Smartphone, Split, CheckCircle2, ArrowRight, BookOpen, Gift, Percent } from "lucide-react";
import { usePOSStore } from "@/stores/pos-store";
import { useCustomerStore } from "@/stores/customer-store";
import { useGiftCardStore } from "@/stores/giftcard-store";

interface PaymentModalProps {
  total: number;
  onComplete: (payments: { method: PaymentMethod; amount: number; reference?: string }[]) => void;
  onCancel: () => void;
}

export function PaymentModal({ total, onComplete, onCancel }: PaymentModalProps) {
  const customerId = usePOSStore((s) => s.customerId);
  const customers = useCustomerStore((s) => s.customers);
  const attachedCustomer = customers.find(c => c.id === customerId);
  const deductLoyaltyPoints = useCustomerStore((s) => s.deductLoyaltyPoints);

  const { giftCards, deductGiftCard } = useGiftCardStore();

  const [mode, setMode] = useState<"single" | "split">("single");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [reference, setReference] = useState("");

  // Gift Card payment states
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardError, setGiftCardError] = useState("");
  const [verifiedGiftCard, setVerifiedGiftCard] = useState<any | null>(null);

  // Loyalty Redemption states
  const [loyaltyRedeemed, setLoyaltyRedeemed] = useState<number>(0);
  const loyaltyAmount = loyaltyRedeemed; // 1 Point = 1 Rupee discount

  const netDue = Math.max(0, total - loyaltyAmount);
  const [cashAmount, setCashAmount] = useState(netDue.toFixed(2));

  // Split Payment states
  const [splitCash, setSplitCash] = useState<string>("0");
  const [splitUpi, setSplitUpi] = useState<string>("0");
  const [splitCard, setSplitCard] = useState<string>("0");

  const cashTendered = parseFloat(cashAmount) || 0;
  const change = Math.max(0, cashTendered - netDue);

  // Split calculation
  const totalSplitPaid = (parseFloat(splitCash) || 0) + (parseFloat(splitUpi) || 0) + (parseFloat(splitCard) || 0);
  const splitRemaining = Math.max(0, netDue - totalSplitPaid);
  const isSplitValid = Math.abs(netDue - totalSplitPaid) < 0.01;

  const handleVerifyGiftCard = () => {
    setGiftCardError("");
    setVerifiedGiftCard(null);
    const code = giftCardCode.trim();
    if (!code) return;

    const card = giftCards.find((c) => c.cardCode === code);
    if (!card) {
      setGiftCardError("Gift card not found");
      return;
    }
    if (card.status !== "active") {
      setGiftCardError(`Gift card is ${card.status}`);
      return;
    }
    if (new Date(card.expiryDate).getTime() < Date.now()) {
      setGiftCardError("Gift card has expired");
      return;
    }
    
    setVerifiedGiftCard(card);
    setReference(card.cardCode);
  };

  const handleConfirmSingle = () => {
    // 1. Deduct Gift Card if selected
    if (selectedMethod === PaymentMethod.GIFT_CARD) {
      if (!verifiedGiftCard) {
        alert("Please verify the gift card code first");
        return;
      }
      const res = deductGiftCard(verifiedGiftCard.cardCode, netDue);
      if (!res.success) {
        alert(res.error || "Failed to process gift card deduction");
        return;
      }
    }

    // 2. Deduct Loyalty points if applied
    if (loyaltyRedeemed > 0 && attachedCustomer) {
      deductLoyaltyPoints(attachedCustomer.id, loyaltyRedeemed);
    }

    const payments: Array<{ method: PaymentMethod; amount: number; reference?: string }> = [];
    if (selectedMethod === PaymentMethod.CASH) {
      payments.push({ method: PaymentMethod.CASH, amount: netDue });
    } else {
      payments.push({ method: selectedMethod, amount: netDue, reference: reference.trim() || undefined });
    }
    onComplete(payments);
  };

  const handleConfirmSplit = () => {
    // Deduct Loyalty points if applied
    if (loyaltyRedeemed > 0 && attachedCustomer) {
      deductLoyaltyPoints(attachedCustomer.id, loyaltyRedeemed);
    }

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
    const remainder = Math.max(0, netDue - current);
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
              {/* Customer Loyalty Redemption Panel */}
              {attachedCustomer && attachedCustomer.loyaltyPoints > 0 && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-900 flex items-center gap-1">
                      <Percent className="h-4 w-4 text-indigo-600" /> Redeem Loyalty Points
                    </span>
                    <span className="text-gray-500 font-medium">Available: {attachedCustomer.loyaltyPoints} pts</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={0}
                      max={Math.min(attachedCustomer.loyaltyPoints, Math.ceil(total))}
                      value={loyaltyRedeemed || ""}
                      onChange={(e) => {
                        const val = Math.min(attachedCustomer.loyaltyPoints, Math.min(Math.ceil(total), Math.max(0, parseInt(e.target.value) || 0)));
                        setLoyaltyRedeemed(val);
                      }}
                      placeholder="Enter points to redeem"
                      className="flex-grow h-9 px-3 border border-indigo-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                    {loyaltyRedeemed > 0 && (
                      <span className="text-xs font-black text-indigo-700 whitespace-nowrap">- ₹{loyaltyAmount.toFixed(2)} Off</span>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: PaymentMethod.CASH, label: "Cash", icon: Banknote, enabled: true },
                  { id: PaymentMethod.UPI, label: "UPI / QR", icon: Smartphone, enabled: true },
                  { id: PaymentMethod.CARD, label: "Card", icon: CreditCard, enabled: true },
                  { id: PaymentMethod.GIFT_CARD, label: "Gift Card", icon: Gift, enabled: true },
                  { id: PaymentMethod.CREDIT, label: "Khata", icon: BookOpen, enabled: !!attachedCustomer },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    disabled={!pm.enabled}
                    onClick={() => {
                      setSelectedMethod(pm.id);
                      setCashAmount(netDue.toFixed(2));
                      setReference("");
                    }}
                    title={!pm.enabled ? "Select a customer on cart first" : undefined}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                      selectedMethod === pm.id
                        ? "border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs"
                        : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                    } ${!pm.enabled ? "opacity-35 cursor-not-allowed" : ""}`}
                  >
                    <pm.icon className="h-4.5 w-4.5" />
                    <span className="text-[9px] font-bold tracking-tight whitespace-nowrap">{pm.label}</span>
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
                      netDue,
                      Math.ceil(netDue / 10) * 10,
                      Math.ceil(netDue / 50) * 50,
                      Math.ceil(netDue / 100) * 100,
                      Math.ceil(netDue / 500) * 500,
                    ]
                      .filter((v, i, a) => a.indexOf(v) === i && v >= netDue)
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

              {/* Gift Card Input */}
              {selectedMethod === PaymentMethod.GIFT_CARD && (
                <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 block">Scan / Enter Gift Card Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={giftCardCode}
                        onChange={(e) => setGiftCardCode(e.target.value)}
                        placeholder="e.g. GC-204928"
                        className="flex-grow h-10 px-3.5 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyGiftCard}
                        className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                  {giftCardError && (
                    <p className="text-xs font-semibold text-rose-600">⚠ {giftCardError}</p>
                  )}

                  {verifiedGiftCard && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                        <span>Card Balance:</span>
                        <span className="font-extrabold">₹{verifiedGiftCard.currentBalance.toFixed(2)}</span>
                      </div>
                      {verifiedGiftCard.currentBalance < netDue && (
                        <p className="text-[10px] text-amber-700 font-bold">⚠ Note: Insufficient balance. Card has ₹{verifiedGiftCard.currentBalance.toFixed(2)} but order requires ₹{netDue.toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reference / Credit Info Banner */}
              {selectedMethod === PaymentMethod.CREDIT && attachedCustomer && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-rose-800">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs font-bold">Posting to Khata / Store Credit</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-normal">
                    The total order amount will be charged as outstanding debt on <strong className="text-rose-900">{attachedCustomer.name}</strong>'s ledger profile.
                  </p>
                  <div className="flex justify-between text-xs text-rose-800 pt-1.5 border-t border-rose-200/50 font-bold">
                    <span>Current Credit Debt:</span>
                    <span>₹{attachedCustomer.creditBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-rose-800 font-bold">
                    <span>New Credit Debt:</span>
                    <span>₹{(attachedCustomer.creditBalance + netDue).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {selectedMethod !== PaymentMethod.CASH && selectedMethod !== PaymentMethod.CREDIT && selectedMethod !== PaymentMethod.GIFT_CARD && (
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
            disabled={
              mode === "single"
                ? (selectedMethod === PaymentMethod.CASH && cashTendered < netDue) ||
                  (selectedMethod === PaymentMethod.GIFT_CARD && (!verifiedGiftCard || verifiedGiftCard.currentBalance < netDue))
                : !isSplitValid
            }
            className="flex-[2] h-11 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete Sale (₹{netDue.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
}
