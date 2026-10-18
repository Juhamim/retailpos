"use client";

import React, { useState, useMemo } from "react";
import { X, Search, UserPlus, Plus, Phone, Mail } from "lucide-react";
import { useCustomerStore } from "@/stores/customer-store";

interface CustomerSelectProps {
  selectedId?: string;
  onSelect: (id: string, name: string) => void;
  onClose: () => void;
}

export function CustomerSelect({ selectedId, onSelect, onClose }: CustomerSelectProps) {
  const customers = useCustomerStore((state) => state.customers);
  const addCustomer = useCustomerStore((state) => state.addCustomer);

  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const filtered = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search))
    );
  }, [customers, search]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = addCustomer({
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      isActive: true,
    });

    onSelect(created.id, created.name);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {isAdding ? "Add New Customer" : "Select Customer Profile"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isAdding ? (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full h-10 pl-10 pr-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="h-10 px-3.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Plus className="h-4 w-4" />
                New
              </button>
            </div>

            <div className="max-h-80 overflow-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* Walk-in option */}
              <button
                onClick={() => onSelect("", "Walk-in Customer")}
                className="w-full p-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Walk-in Customer</p>
                  <p className="text-xs text-slate-400">Default generic customer</p>
                </div>
              </button>

              {filtered.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => onSelect(customer.id, customer.name)}
                  className={`w-full p-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-3 ${
                    selectedId === customer.id ? "bg-indigo-50/70 dark:bg-indigo-950/40" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{customer.name}</p>
                    <p className="text-xs text-slate-400">{customer.phone || "No phone"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-full">
                      {customer.loyaltyPoints} pts
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">₹{customer.totalSpent.toLocaleString()}</p>
                  </div>
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="p-6 text-center text-slate-400">
                  <p className="text-sm">No customers found</p>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + Register "{search}" as customer
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Full Name *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                required
                className="w-full h-11 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full h-11 pl-10 pr-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full h-11 pl-10 pr-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 h-11 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Save & Select
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
