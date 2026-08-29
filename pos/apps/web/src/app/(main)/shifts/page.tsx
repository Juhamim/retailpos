"use client";

import React, { useState, useMemo } from "react";
import { useShiftStore } from "@/stores/shift-store";
import { useAppStore } from "@/stores/app-store";
import { useSalesStore } from "@/stores/sales-store";
import { exportZReportPDF } from "@/lib/pdf-export";
import { PaymentMethod } from "@retailflow/shared-types";
import { Key, ShieldAlert, Check, Play, Info, AlertTriangle, FileText, CheckCircle2, History } from "lucide-react";

export default function ShiftsPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const { shifts, activeShift, openShift, closeShift } = useShiftStore();
  const sales = useSalesStore((state) => state.sales);

  const [openingFloat, setOpeningFloat] = useState("500");
  const [closingFloat, setClosingFloat] = useState("0");
  const [notes, setNotes] = useState("");

  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const float = parseFloat(openingFloat) || 0;
    openShift(currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`, float);
  };

  const handleCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const float = parseFloat(closingFloat) || 0;
    closeShift(float, notes);
    setClosingFloat("0");
    setNotes("");
  };

  // Calculate live shift statistics by filtering completed sales that happened after shift opened
  const liveStats = useMemo(() => {
    if (!activeShift) return null;

    const shiftStart = new Date(activeShift.openedAt);
    const shiftSales = sales.filter((s) => new Date(s.createdAt) >= shiftStart && s.status === "completed");

    let totalCashSales = 0;
    let totalUpiSales = 0;
    let totalCardSales = 0;
    let totalCreditSales = 0;
    let salesTotal = 0;

    for (const s of shiftSales) {
      salesTotal += s.totalAmount;
      for (const p of s.payments) {
        if (p.method === PaymentMethod.CASH) totalCashSales += p.amount;
        if (p.method === PaymentMethod.UPI) totalUpiSales += p.amount;
        if (p.method === PaymentMethod.CARD) totalCardSales += p.amount;
        if (p.method === PaymentMethod.CREDIT) totalCreditSales += p.amount;
      }
    }

    const expectedCash = activeShift.openingFloat + totalCashSales;

    return {
      salesCount: shiftSales.length,
      salesTotal,
      totalCashSales,
      totalUpiSales,
      totalCardSales,
      totalCreditSales,
      expectedCash,
    };
  }, [activeShift, sales]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Key className="h-7 w-7 text-indigo-600" /> Register Shifts & Reconciliation
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 font-medium">
          Open register drawer, perform mid-day drawer audits, and reconcile cash on day-end Z-Report closures
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Active Register Shift Status */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-2xs p-6">
          {!activeShift ? (
            /* Open Register Panel */
            <form onSubmit={handleOpenRegister} className="max-w-md space-y-5">
              <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-indigo-950 text-sm">Register Closed</h3>
                  <p className="text-xs text-indigo-800 leading-normal mt-0.5">
                    Before starting to ring up sales in the POS terminal, you must input the starting opening cash float (the initial cash bills in the drawer).
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Opening Float (Drawer Starting Cash) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    required
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(e.target.value)}
                    className="w-full h-11 pl-8 pr-4 border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm w-full"
              >
                <Play className="h-4 w-4" /> Start Shift / Open Register Drawer
              </button>
            </form>
          ) : (
            /* Live Reconcile / Close Register Panel */
            <div className="space-y-6">
              {/* Top Meta info */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Register Open
                  </span>
                </div>
                <div className="text-xs font-mono text-gray-500">
                  Opened by: <span className="font-bold text-gray-800">{activeShift.username}</span> • {new Date(activeShift.openedAt).toLocaleString()}
                </div>
              </div>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Starting Float</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">₹{activeShift.openingFloat.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Expected Cash</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">₹{liveStats?.expectedCash.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">₹{liveStats?.salesTotal.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transactions</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{liveStats?.salesCount}</p>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider">Allocated Payment Modes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-x">
                  <div className="px-2">
                    <p className="text-xs font-semibold text-gray-500">Cash Sales</p>
                    <p className="text-base font-bold text-gray-900">₹{liveStats?.totalCashSales.toFixed(2)}</p>
                  </div>
                  <div className="px-2 border-l">
                    <p className="text-xs font-semibold text-gray-500">UPI Payments</p>
                    <p className="text-base font-bold text-gray-900">₹{liveStats?.totalUpiSales.toFixed(2)}</p>
                  </div>
                  <div className="px-2 border-l">
                    <p className="text-xs font-semibold text-gray-500">Card Swipes</p>
                    <p className="text-base font-bold text-gray-900">₹{liveStats?.totalCardSales.toFixed(2)}</p>
                  </div>
                  <div className="px-2 border-l">
                    <p className="text-xs font-semibold text-gray-500">Store Credit</p>
                    <p className="text-base font-bold text-gray-900">₹{liveStats?.totalCreditSales.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Close Register Form */}
              <form onSubmit={handleCloseRegister} className="border-t pt-5 space-y-4 max-w-md">
                <h3 className="font-bold text-sm text-gray-900">Reconcile Drawer & End Day</h3>
                
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Counted Cash in Drawer (Physical Count) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
                    <input
                      type="number"
                      required
                      value={closingFloat}
                      onChange={(e) => setClosingFloat(e.target.value)}
                      className="w-full h-11 pl-8 pr-4 border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Drawer Reconcile Notes / Auditing Remarks</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. UPI sales verified, cash matches drawer expected totals."
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="h-4 w-4" /> Close Register & Generate Z-Report
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Closed Shifts History list */}
        <div className="w-full lg:w-96 bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 self-start">
          <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-1.5">
            <History className="h-4.5 w-4.5 text-indigo-600" /> Past Closed Shifts (Z-Reports)
          </h3>

          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
            {shifts.map((s) => {
              const expected = s.expectedCash;
              const actual = s.actualCash ?? 0;
              const discrepancy = actual - expected;
              return (
                <div key={s.id} className="border border-gray-200 rounded-xl p-3.5 space-y-2 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-xs text-gray-900">{s.username}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(s.openedAt).toLocaleDateString()} {new Date(s.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button
                      onClick={() => exportZReportPDF(s)}
                      className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-0.5"
                      title="Download Shift Z-Report PDF"
                    >
                      <FileText className="h-3.5 w-3.5" /> PDF
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t pt-2 text-[11px]">
                    <div>
                      <p className="text-gray-400">Total Sales</p>
                      <p className="font-bold text-gray-800">₹{s.salesTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Drawer Cash</p>
                      <p className="font-bold text-gray-800">₹{actual.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Discrepancy</p>
                      <p className={`font-bold ${discrepancy < 0 ? "text-red-600" : discrepancy > 0 ? "text-green-600" : "text-gray-500"}`}>
                        {discrepancy === 0 ? "Match" : discrepancy > 0 ? `+₹${discrepancy.toFixed(0)}` : `-₹${Math.abs(discrepancy).toFixed(0)}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {shifts.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No previous shifts closed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
