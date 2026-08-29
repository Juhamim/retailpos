"use client";

import React, { useState, useMemo } from "react";
import {
  Wallet,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  DollarSign,
  Plus,
  TrendingUp,
  Receipt,
  Users,
  Truck,
  CheckCircle,
  Clock,
  Filter,
  Download,
  AlertCircle,
  HelpCircle,
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  Search,
  X,
  Save,
  Trash2
} from "lucide-react";
import { useAccountStore, TreasuryAdjustment } from "@/stores/account-store";
import { useSalesStore } from "@/stores/sales-store";
import { useExpenseStore } from "@/stores/expense-store";
import { useCustomerStore } from "@/stores/customer-store";
import { useSupplierStore } from "@/stores/supplier-store";
import { usePurchaseStore } from "@/stores/purchase-store";
import { useReturnsStore } from "@/stores/returns-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useAppStore } from "@/stores/app-store";
import { PaymentMethod } from "@retailflow/shared-types";

export default function AccountsPage() {
  const currency = useSettingsStore((s) => s.settings.shop.currencySymbol || "₹");
  const currentUser = useAppStore((s) => s.currentUser);

  const {
    initialCashBalance,
    initialBankBalance,
    adjustments,
    setInitialCashBalance,
    setInitialBankBalance,
    recordAdjustment,
    deleteAdjustment,
  } = useAccountStore();

  const sales = useSalesStore((s) => s.sales);
  const expenses = useExpenseStore((s) => s.expenses);
  const customers = useCustomerStore((s) => s.customers);
  const creditLedger = useCustomerStore((s) => s.creditLedger);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const purchases = usePurchaseStore((s) => s.purchases);
  const returns = useReturnsStore((s) => s.returns);

  // Modals
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [activeAccountTab, setActiveAccountTab] = useState<"all" | "cash" | "bank">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Adjustment Form
  const [adjAccount, setAdjAccount] = useState<"cash" | "bank">("cash");
  const [adjType, setAdjType] = useState<"in" | "out">("in");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjCategory, setAdjCategory] = useState("Owner Capital");
  const [adjNote, setAdjNote] = useState("");

  // Baseline Form
  const [tempCashBaseline, setTempCashBaseline] = useState(String(initialCashBalance));
  const [tempBankBaseline, setTempBankBaseline] = useState(String(initialBankBalance));

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // --- CALCULATIONS ---

  // 1. Sales Inflows
  const salesCashIn = useMemo(() => {
    let sum = 0;
    for (const s of sales) {
      if (s.status === "completed") {
        for (const p of s.payments) {
          if (p.method === PaymentMethod.CASH) sum += p.amount;
        }
      }
    }
    return sum;
  }, [sales]);

  const salesBankIn = useMemo(() => {
    let sum = 0;
    for (const s of sales) {
      if (s.status === "completed") {
        for (const p of s.payments) {
          if (p.method === PaymentMethod.UPI || p.method === PaymentMethod.CARD) sum += p.amount;
        }
      }
    }
    return sum;
  }, [sales]);

  // 2. Customer Khata Repayments
  const khataCashIn = useMemo(() => {
    return creditLedger
      .filter((l) => l.type === "payment" && (l.method === "cash" || !l.method))
      .reduce((sum, l) => sum + l.amount, 0);
  }, [creditLedger]);

  const khataBankIn = useMemo(() => {
    return creditLedger
      .filter((l) => l.type === "payment" && (l.method === "upi" || l.method === "card" || l.method === "bank"))
      .reduce((sum, l) => sum + l.amount, 0);
  }, [creditLedger]);

  // 3. Expenses Outflows
  const expensesCashOut = useMemo(() => {
    return expenses
      .filter((e) => !e.paymentMethod || e.paymentMethod === PaymentMethod.CASH || String(e.paymentMethod).toLowerCase() === "cash")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const expensesBankOut = useMemo(() => {
    return expenses
      .filter((e) => e.paymentMethod && e.paymentMethod !== PaymentMethod.CASH && String(e.paymentMethod).toLowerCase() !== "cash")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // 4. Purchases / Supplier Payouts
  const purchasesCashOut = useMemo(() => {
    return purchases
      .filter((p) => p.paymentStatus === "paid" && (p.paymentMethod?.toLowerCase() === "cash" || !p.paymentMethod))
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [purchases]);

  const purchasesBankOut = useMemo(() => {
    return purchases
      .filter((p) => p.paymentStatus === "paid" && p.paymentMethod && p.paymentMethod.toLowerCase() !== "cash")
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [purchases]);

  // 5. Sales Returns Refunds Outflows
  const returnsCashOut = useMemo(() => {
    return returns
      .filter((r) => r.refundMethod === "cash" || !r.refundMethod)
      .reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  }, [returns]);

  const returnsBankOut = useMemo(() => {
    return returns
      .filter((r) => r.refundMethod === "upi" || r.refundMethod === "card")
      .reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  }, [returns]);

  // 6. Manual Adjustments
  const adjustmentsCashIn = useMemo(() => {
    return adjustments
      .filter((a) => a.account === "cash" && a.type === "in")
      .reduce((sum, a) => sum + a.amount, 0);
  }, [adjustments]);

  const adjustmentsCashOut = useMemo(() => {
    return adjustments
      .filter((a) => a.account === "cash" && a.type === "out")
      .reduce((sum, a) => sum + a.amount, 0);
  }, [adjustments]);

  const adjustmentsBankIn = useMemo(() => {
    return adjustments
      .filter((a) => a.account === "bank" && a.type === "in")
      .reduce((sum, a) => sum + a.amount, 0);
  }, [adjustments]);

  const adjustmentsBankOut = useMemo(() => {
    return adjustments
      .filter((a) => a.account === "bank" && a.type === "out")
      .reduce((sum, a) => sum + a.amount, 0);
  }, [adjustments]);

  // FINAL BALANCES
  const totalCashBalance = Math.round(
    (initialCashBalance + salesCashIn + khataCashIn + adjustmentsCashIn - expensesCashOut - purchasesCashOut - returnsCashOut - adjustmentsCashOut) * 100
  ) / 100;

  const totalBankBalance = Math.round(
    (initialBankBalance + salesBankIn + khataBankIn + adjustmentsBankIn - expensesBankOut - purchasesBankOut - returnsBankOut - adjustmentsBankOut) * 100
  ) / 100;

  const totalReceivables = Math.round(customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0) * 100) / 100;
  const totalPayables = Math.round(
    purchases.filter((p) => p.paymentStatus === "pending").reduce((sum, p) => sum + p.totalAmount, 0) * 100
  ) / 100;

  const totalLiquidFunds = Math.round((totalCashBalance + totalBankBalance) * 100) / 100;
  const netWorkingCapital = Math.round((totalLiquidFunds + totalReceivables - totalPayables) * 100) / 100;

  // Unified Money Flow Feed
  const unifiedFeed = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      title: string;
      account: "cash" | "bank";
      direction: "in" | "out";
      amount: number;
      category: string;
      note?: string;
      isAdjustment?: boolean;
      rawId?: string;
    }> = [];

    // Adjustments
    for (const a of adjustments) {
      list.push({
        id: a.id,
        date: a.createdAt,
        title: a.type === "in" ? `Cash Addition (${a.category})` : `Cash Withdrawal (${a.category})`,
        account: a.account,
        direction: a.type,
        amount: a.amount,
        category: a.category,
        note: a.note,
        isAdjustment: true,
        rawId: a.id,
      });
    }

    // Sales (last 30)
    for (const s of sales.slice(0, 30)) {
      if (s.status === "completed") {
        for (const p of s.payments) {
          const isCash = p.method === PaymentMethod.CASH;
          list.push({
            id: `sale-${s.id}-${p.method}`,
            date: s.createdAt,
            title: `POS Sale #${s.invoiceNumber || s.id.slice(-6)}`,
            account: isCash ? "cash" : "bank",
            direction: "in",
            amount: p.amount,
            category: `Sales (${p.method.toUpperCase()})`,
            note: `Customer: ${s.customerName || "Walk-in"}`,
          });
        }
      }
    }

    // Expenses (last 20)
    for (const e of expenses.slice(0, 20)) {
      const isCash = !e.paymentMethod || e.paymentMethod === PaymentMethod.CASH;
      list.push({
        id: `exp-${e.id}`,
        date: e.date || e.createdAt || new Date().toISOString(),
        title: `Expense: ${e.description || e.category}`,
        account: isCash ? "cash" : "bank",
        direction: "out",
        amount: e.amount,
        category: `Expense (${e.category})`,
        note: e.reference,
      });
    }

    // Sort newest first
    return list
      .filter((item) => {
        if (activeAccountTab !== "all" && item.account !== activeAccountTab) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || (item.note && item.note.toLowerCase().includes(q));
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [adjustments, sales, expenses, activeAccountTab, searchQuery]);

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(adjAmount);
    if (!amt || amt <= 0) return;

    recordAdjustment({
      account: adjAccount,
      type: adjType,
      amount: amt,
      category: adjCategory,
      note: adjNote.trim() || undefined,
      performedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Store Admin",
    });

    triggerToast(`Recorded ${currency}${amt.toFixed(2)} ${adjType.toUpperCase()} on ${adjAccount.toUpperCase()} account`);
    setShowAdjModal(false);
    setAdjAmount("");
    setAdjNote("");
  };

  const handleSaveBaseline = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(tempCashBaseline);
    const b = parseFloat(tempBankBaseline);
    if (!isNaN(c)) setInitialCashBalance(c);
    if (!isNaN(b)) setInitialBankBalance(b);
    triggerToast("Updated opening baseline balances!");
    setShowBaselineModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Wallet className="h-7 w-7 text-indigo-600" />
            Total Accounts & Treasury Balances
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Live monitoring of Cash in Hand, Bank/UPI Accounts, Khata Receivables, and Supplier Ledgers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setTempCashBaseline(String(initialCashBalance));
              setTempBankBaseline(String(initialBankBalance));
              setShowBaselineModal(true);
            }}
            className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Building2 className="h-4 w-4 text-gray-500" />
            Set Base Balances
          </button>

          <button
            type="button"
            onClick={() => {
              setAdjType("in");
              setAdjAccount("cash");
              setAdjCategory("Cash In / Till Addition");
              setShowAdjModal(true);
            }}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Cash / Inflow
          </button>

          <button
            type="button"
            onClick={() => {
              setAdjType("out");
              setAdjAccount("cash");
              setAdjCategory("Cash Drop to Bank");
              setShowAdjModal(true);
            }}
            className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <ArrowUpRight className="h-4 w-4" />
            Cash Out / Transfer
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl shadow-xs animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          {toastMsg}
        </div>
      )}

      {/* TOP LIQUIDITY HERO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash in Hand */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-2xs relative overflow-hidden bg-gradient-to-br from-emerald-50/40 via-white to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Banknote className="h-4 w-4 text-emerald-600" /> Cash in Hand (Drawer)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Liquid Cash
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {currency}{totalCashBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Base: {currency}{initialCashBalance}</span>
            <span className="font-semibold text-emerald-700">Sales: +{currency}{salesCashIn.toFixed(0)}</span>
          </div>
        </div>

        {/* Bank & Digital UPI */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-2xs relative overflow-hidden bg-gradient-to-br from-indigo-50/40 via-white to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-indigo-600" /> Bank & UPI / Card
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Digital Account
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {currency}{totalBankBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 pt-3 border-t border-indigo-100/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Base: {currency}{initialBankBalance}</span>
            <span className="font-semibold text-indigo-700">Digital Sales: +{currency}{salesBankIn.toFixed(0)}</span>
          </div>
        </div>

        {/* Customer Receivables */}
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-2xs relative overflow-hidden bg-gradient-to-br from-amber-50/40 via-white to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-amber-600" /> Khata Receivables
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Due to You
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {currency}{totalReceivables.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 pt-3 border-t border-amber-100/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>{customers.filter(c => (c.creditBalance || 0) > 0).length} debtors</span>
            <span className="font-semibold text-amber-700">Customer Credit</span>
          </div>
        </div>

        {/* Supplier Payables */}
        <div className="bg-white rounded-2xl border border-rose-100 p-5 shadow-2xs relative overflow-hidden bg-gradient-to-br from-rose-50/40 via-white to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-rose-600" /> Supplier Payables
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              You Owe
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {currency}{totalPayables.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 pt-3 border-t border-rose-100/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>{purchases.filter((p) => p.paymentStatus === "pending").length} pending bills</span>
            <span className="font-semibold text-rose-700">Unpaid Invoices</span>
          </div>
        </div>
      </div>

      {/* TOTAL NET TREASURY SUMMARY BANNER */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1">
          <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">Total Liquid Treasury</span>
          <div className="text-3xl font-extrabold">
            {currency}{totalLiquidFunds.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400">Combined instantly available cash in till + active bank deposits</p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8 text-xs">
          <div>
            <span className="text-slate-400 block">Working Capital (Net):</span>
            <span className={`text-base font-bold ${netWorkingCapital >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {currency}{netWorkingCapital.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Inflow Adjustments:</span>
            <span className="text-base font-bold text-indigo-300">
              +{currency}{(adjustmentsCashIn + adjustmentsBankIn).toFixed(0)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Outflow Adjustments:</span>
            <span className="text-base font-bold text-rose-300">
              -{currency}{(adjustmentsCashOut + adjustmentsBankOut).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* TREASURY TRANSACTION & MONEY FLOW AUDIT LOG */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-600" /> Money Movement Ledger
            </span>
            <span className="text-[11px] font-semibold text-gray-400">({unifiedFeed.length} records)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex bg-gray-200/80 p-1 rounded-xl text-xs font-bold">
              {(["all", "cash", "bank"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveAccountTab(tab)}
                  className={`px-3 py-1 rounded-lg transition-all capitalize ${
                    activeAccountTab === tab ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab === "all" ? "All Accounts" : tab === "cash" ? "Cash Till" : "Bank / UPI"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Feed List */}
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {unifiedFeed.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No transactions or adjustments found matching filter.
            </div>
          ) : (
            unifiedFeed.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50/70 transition-colors text-xs">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.direction === "in"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-rose-50 text-rose-600 border border-rose-200"
                    }`}
                  >
                    {item.direction === "in" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{item.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.account === "cash" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {item.account}
                      </span>
                      {item.isAdjustment && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                          Manual Adjustment
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                      <span>{new Date(item.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                      {item.note && (
                        <>
                          <span>•</span>
                          <span className="italic text-gray-600">{item.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-bold ${
                      item.direction === "in" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {item.direction === "in" ? "+" : "-"}
                    {currency}{item.amount.toFixed(2)}
                  </span>

                  {item.isAdjustment && item.rawId && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Remove this manual adjustment?")) {
                          deleteAdjustment(item.rawId!);
                          triggerToast("Adjustment deleted");
                        }
                      }}
                      className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: ADD ADJUSTMENT / CASH IN OR OUT */}
      {showAdjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-indigo-600" />
                Record Treasury Transaction / Adjustment
              </h3>
              <button
                type="button"
                onClick={() => setShowAdjModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Target Account</label>
                  <select
                    value={adjAccount}
                    onChange={(e) => setAdjAccount(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="cash">Cash in Hand (Till)</option>
                    <option value="bank">Bank / Digital Account</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Direction</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="in">Cash In / Inflow (+)</option>
                    <option value="out">Cash Out / Withdrawal (-)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Amount ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Category / Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Owner Capital, Cash Drop to Bank, Change Float"
                  value={adjCategory}
                  onChange={(e) => setAdjCategory(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional audit memo..."
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 h-10 rounded-xl text-white text-xs font-bold shadow-xs ${
                    adjType === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  Confirm {adjType === "in" ? "Inflow" : "Outflow"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SET OPENING BASELINE BALANCES */}
      {showBaselineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Configure Baseline Opening Balances
              </h3>
              <button
                type="button"
                onClick={() => setShowBaselineModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBaseline} className="p-5 space-y-4">
              <p className="text-xs text-gray-500">
                Set initial store float and bank opening balance prior to recording POS transactions.
              </p>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Opening Cash in Drawer Float ({currency})</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={tempCashBaseline}
                  onChange={(e) => setTempCashBaseline(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Opening Bank / UPI Account Balance ({currency})</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={tempBankBaseline}
                  onChange={(e) => setTempBankBaseline(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBaselineModal(false)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Save className="h-4 w-4" /> Save Baseline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
