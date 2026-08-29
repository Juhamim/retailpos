"use client";

import React, { useState, useMemo } from "react";
import { Users, Search, Plus, Phone, Mail, Star, Edit, Trash2, X, MapPin, CreditCard, Banknote, Save, BookOpen, AlertCircle } from "lucide-react";
import { useCustomerStore, CreditLedgerEntry } from "@/stores/customer-store";
import type { Customer } from "@retailflow/shared-types";

export default function CustomersPage() {
  const customers = useCustomerStore((state) => state.customers);
  const creditLedger = useCustomerStore((state) => state.creditLedger);
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);
  const removeCustomer = useCustomerStore((state) => state.removeCustomer);
  const recordCreditTransaction = useCustomerStore((state) => state.recordCreditTransaction);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [activeLedgerCustomer, setActiveLedgerCustomer] = useState<Customer | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");

  // Ledger actions state
  const [ledgerAmount, setLedgerAmount] = useState("");
  const [ledgerNote, setLedgerNote] = useState("");
  const [ledgerAction, setLedgerAction] = useState<"charge" | "payment">("payment");

  const filtered = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [customers, search]);

  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
  const totalCreditDebt = customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0);

  const handleOpenAdd = () => {
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone || "");
    setFormEmail(c.email || "");
    setFormAddress(c.address || "");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
      });
      setEditingCustomer(null);
    } else {
      addCustomer({
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        isActive: true,
      });
      setShowAddModal(false);
    }
  };

  const handleLedgerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLedgerCustomer || !ledgerAmount) return;
    const amount = parseFloat(ledgerAmount) || 0;
    if (amount <= 0) return;

    recordCreditTransaction(
      activeLedgerCustomer.id,
      ledgerAction,
      amount,
      ledgerAction === "payment" ? "cash" : undefined,
      ledgerNote || (ledgerAction === "payment" ? "Customer repayment" : "Manual credit charge")
    );

    // Refresh active customer data from store to keep modal balance in sync
    const updated = useCustomerStore.getState().customers.find(c => c.id === activeLedgerCustomer.id);
    if (updated) {
      setActiveLedgerCustomer(updated);
    }

    setLedgerAmount("");
    setLedgerNote("");
  };

  const selectedLedgerEntries = useMemo(() => {
    if (!activeLedgerCustomer) return [];
    return creditLedger
      .filter((entry) => entry.customerId === activeLedgerCustomer.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [activeLedgerCustomer, creditLedger]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers & Loyalty</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Customer directory, loyalty points, Khata credit ledgers, and billing records
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Customers</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{customers.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Star className="h-5 w-5 fill-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Loyalty Points</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{totalPoints.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Active Khata Debt</p>
            <p className="text-xl font-bold text-rose-600 mt-0.5">₹{totalCreditDebt.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
              <th className="px-6 py-3.5">Customer Name</th>
              <th className="px-6 py-3.5">Contact Details</th>
              <th className="px-6 py-3.5 text-center">Loyalty Points</th>
              <th className="px-6 py-3.5 text-right">Khata Balance</th>
              <th className="px-6 py-3.5 text-right">Total Revenue</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {customer.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-gray-900">{customer.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-xs text-gray-600">
                  <p className="font-medium text-gray-900">{customer.phone || "—"}</p>
                  {customer.email && <p className="text-gray-400">{customer.email}</p>}
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <Star className="h-3 w-3 fill-amber-500" /> {customer.loyaltyPoints}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  {(customer.creditBalance || 0) > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      ₹{customer.creditBalance.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Clear</span>
                  )}
                </td>
                <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                  ₹{customer.totalSpent.toLocaleString()}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setActiveLedgerCustomer(customer)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 border"
                      title="Khata Ledger (Credit History)"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(customer)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 border"
                      title="Edit Customer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeCustomer(customer.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 border"
                      title="Delete Customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No customers found</p>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {(showAddModal || editingCustomer) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-900">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCustomer(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Customer Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="rajesh@example.com"
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Street Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g. 12 MG Road, Bangalore"
                    rows={2}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                  }}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  {editingCustomer ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Khata Ledger Modal */}
      {activeLedgerCustomer && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col md:flex-row max-h-[85vh]">
            
            {/* Ledger Transactions History list */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 border-b md:border-b-0 md:border-r">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">{activeLedgerCustomer.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">Khata Ledger Transaction History</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Running Debt</p>
                  <p className="text-lg font-black text-rose-600">₹{(activeLedgerCustomer.creditBalance || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Transactions Log table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Entry Type</th>
                      <th className="px-4 py-3">Description / Note</th>
                      <th className="px-4 py-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedLedgerEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-500 font-mono">
                          {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            entry.type === "charge"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            {entry.type === "charge" ? "Charged" : "Repayment"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{entry.note || "—"}</td>
                        <td className={`px-4 py-3 text-right font-bold ${entry.type === "charge" ? "text-rose-600" : "text-emerald-600"}`}>
                          {entry.type === "charge" ? "+" : "-"}₹{entry.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}

                    {selectedLedgerEntries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400">
                          No credit ledger entries found for this customer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Record Credit Entry Form */}
            <div className="w-full md:w-80 p-6 bg-slate-50 flex flex-col justify-between shrink-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-gray-900 text-sm">Post Ledger Entry</h3>
                  <button
                    onClick={() => setActiveLedgerCustomer(null)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-gray-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex bg-slate-200/60 p-1 rounded-xl border">
                  <button
                    type="button"
                    onClick={() => setLedgerAction("payment")}
                    className={`flex-grow py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      ledgerAction === "payment" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-600"
                    }`}
                  >
                    <Banknote className="h-3.5 w-3.5" /> Repayment
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerAction("charge")}
                    className={`flex-grow py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      ledgerAction === "charge" ? "bg-white text-rose-700 shadow-xs" : "text-gray-600"
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Charge
                  </button>
                </div>

                <form onSubmit={handleLedgerSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Transaction Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={ledgerAmount}
                      onChange={(e) => setLedgerAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Remarks / Reference Note</label>
                    <textarea
                      rows={3}
                      value={ledgerNote}
                      onChange={(e) => setLedgerNote(e.target.value)}
                      placeholder={ledgerAction === "payment" ? "Cash paid back by customer" : "Manual credit purchase / invoice link"}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full h-10 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      ledgerAction === "payment" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/10"
                    }`}
                  >
                    <Save className="h-4 w-4" /> Save Ledger Entry
                  </button>
                </form>
              </div>

              <div className="mt-6 flex items-start gap-2 bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800 leading-normal">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Posting ledger transactions immediately alters the customer's active outstanding balance.
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
