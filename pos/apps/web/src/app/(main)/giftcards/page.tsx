"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, Eye, AlertCircle, FileText, CheckCircle, Clock, CreditCard } from "lucide-react";
import { useGiftCardStore, GiftCard } from "@/stores/giftcard-store";
import { useCustomerStore } from "@/stores/customer-store";

export default function GiftCardsPage() {
  const { giftCards, issueGiftCard } = useGiftCardStore();
  const customers = useCustomerStore((state) => state.customers);

  const [searchQuery, setSearchQuery] = useState("");
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Form State
  const [cardCode, setCardCode] = useState("");
  const [initialBalance, setInitialBalance] = useState<number>(1000);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1); // Default 1 year expiry
    return d.toISOString().slice(0, 10);
  });

  const handleGenerateCode = () => {
    const code = `GC-${Math.floor(10000000 + Math.random() * 90000000)}`;
    setCardCode(code);
  };

  const handleIssueCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardCode.trim()) return alert("Please enter or generate a card code");
    if (initialBalance <= 0) return alert("Please enter a valid initial balance");

    // Check duplicate
    if (giftCards.some((c) => c.cardCode === cardCode.trim())) {
      alert("Gift card code already exists!");
      return;
    }

    const linkedCust = customers.find((c) => c.id === selectedCustomerId);

    issueGiftCard({
      cardCode: cardCode.trim(),
      initialBalance,
      customerId: linkedCust?.id,
      customerName: linkedCust?.name,
      expiryDate: new Date(expiryDate).toISOString(),
    });

    // Reset
    setCardCode("");
    setInitialBalance(1000);
    setSelectedCustomerId("");
    setShowIssueModal(false);
  };

  const filteredCards = useMemo(() => {
    return giftCards.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        c.cardCode.toLowerCase().includes(q) ||
        (c.customerName && c.customerName.toLowerCase().includes(q))
      );
    });
  }, [giftCards, searchQuery]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prepaid Store Gift Cards</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Issue, review balances, and manage card limits for commercial loyalty campaigns
          </p>
        </div>
        <button
          onClick={() => {
            handleGenerateCode();
            setShowIssueModal(true);
          }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Issue Gift Card
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by card barcode code or customer name..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Card Barcode</th>
                <th className="px-6 py-3.5">Linked Customer</th>
                <th className="px-6 py-3.5 text-right">Initial Value</th>
                <th className="px-6 py-3.5 text-right">Current Balance</th>
                <th className="px-6 py-3.5 text-center">Expiry Date</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredCards.map((card) => {
                const isExpired = new Date(card.expiryDate).getTime() < Date.now();
                return (
                  <tr key={card.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-900 font-mono">{card.cardCode}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{card.customerName || "General / Unlinked"}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-600">₹{card.initialBalance.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-black text-blue-600">₹{card.currentBalance.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{new Date(card.expiryDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          card.status === "active" && !isExpired
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {isExpired ? "Expired" : card.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredCards.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No prepaid gift cards active</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Issue Prepaid Gift Card</h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueCard} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Card Barcode Code *</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    value={cardCode}
                    onChange={(e) => setCardCode(e.target.value)}
                    placeholder="e.g. GC-90425"
                    className="flex-grow h-10 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="h-10 px-3 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Initial Card Balance (₹) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Link Customer (Optional)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
                >
                  <option value="">-- General Card (Unlinked) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Card Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-grow h-10 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow h-10 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
