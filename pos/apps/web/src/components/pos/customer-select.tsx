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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {isAdding ? "Add New Customer" : "Select Customer"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isAdding ? (
          <>
            <div className="p-4 border-b flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="h-10 px-3.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Plus className="h-4 w-4" />
                New
              </button>
            </div>

            <div className="max-h-80 overflow-auto divide-y divide-gray-100">
              {/* Walk-in option */}
              <button
                onClick={() => onSelect("", "Walk-in Customer")}
                className="w-full p-3.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Walk-in Customer</p>
                  <p className="text-xs text-gray-400">Default generic customer</p>
                </div>
              </button>

              {filtered.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => onSelect(customer.id, customer.name)}
                  className={`w-full p-3.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                    selectedId === customer.id ? "bg-blue-50/70" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{customer.name}</p>
                    <p className="text-xs text-gray-400">{customer.phone || "No phone"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {customer.loyaltyPoints} pts
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">₹{customer.totalSpent.toLocaleString()}</p>
                  </div>
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="p-6 text-center text-gray-400">
                  <p className="text-sm">No customers found</p>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
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
              <label className="text-xs font-medium text-gray-700 mb-1 block">Full Name *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                required
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full h-10 pl-10 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full h-10 pl-10 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 h-10 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
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
