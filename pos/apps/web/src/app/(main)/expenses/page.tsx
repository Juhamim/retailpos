"use client";

import React, { useState } from "react";
import { Receipt, Plus, DollarSign, Calendar, Trash2, X } from "lucide-react";
import { useExpenseStore } from "@/stores/expense-store";
import { ExpenseCategory, PaymentMethod } from "@retailflow/shared-types";

const CATEGORIES = [
  ExpenseCategory.RENT,
  ExpenseCategory.ELECTRICITY,
  ExpenseCategory.SALARY,
  ExpenseCategory.TRANSPORTATION,
  ExpenseCategory.INVENTORY,
  ExpenseCategory.MAINTENANCE,
  ExpenseCategory.MARKETING,
  ExpenseCategory.OTHER,
];

export default function ExpensesPage() {
  const expenses = useExpenseStore((state) => state.expenses);
  const addExpense = useExpenseStore((state) => state.addExpense);
  const removeExpense = useExpenseStore((state) => state.removeExpense);

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.RENT);
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filtered = categoryFilter === "All"
    ? expenses
    : expenses.filter((e) => e.category.toLowerCase() === categoryFilter.toLowerCase());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0 || !description.trim()) return;

    addExpense({
      amount: num,
      category,
      description: description.trim(),
      date,
      paymentMethod,
      userId: "user-1",
    });

    setAmount("");
    setDescription("");
    setShowAddModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses & Outflow</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track shop operational expenses, overheads, and utilities</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">₹{totalExpenses.toLocaleString()}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Recorded Expenses</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{expenses.length}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transactions Logged</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">
              ₹{Math.round(totalExpenses / 30).toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Daily Avg Burn</p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              categoryFilter.toLowerCase() === cat.toLowerCase()
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5">Description</th>
              <th className="px-6 py-3.5 text-right">Amount (₹)</th>
              <th className="px-6 py-3.5">Payment Method</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-3.5 text-xs text-gray-600 font-mono">{expense.date}</td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                    {expense.category}
                  </span>
                </td>
                <td className="px-6 py-3.5 font-medium text-gray-900">{expense.description}</td>
                <td className="px-6 py-3.5 text-right font-bold text-red-600">
                  ₹{expense.amount.toLocaleString()}
                </td>
                <td className="px-6 py-3.5 text-xs uppercase font-medium text-gray-600">
                  {expense.paymentMethod.replace("_", " ")}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button
                    onClick={() => removeExpense(expense.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Expense"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No expenses logged for this category</p>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Add Business Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Expense Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Description / Note *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly shop electrical utility bill"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                  >
                    <option value={PaymentMethod.CASH}>Cash</option>
                    <option value={PaymentMethod.UPI}>UPI / QR</option>
                    <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                    <option value={PaymentMethod.CARD}>Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
