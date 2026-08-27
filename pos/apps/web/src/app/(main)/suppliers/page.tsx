"use client";

import React, { useState, useMemo } from "react";
import { Truck, Search, Plus, Phone, Mail, Building, Edit, Trash2, X, MapPin } from "lucide-react";
import { useSupplierStore } from "@/stores/supplier-store";
import type { Supplier } from "@retailflow/shared-types";

export default function SuppliersPage() {
  const suppliers = useSupplierStore((state) => state.suppliers);
  const addSupplier = useSupplierStore((state) => state.addSupplier);
  const updateSupplier = useSupplierStore((state) => state.updateSupplier);
  const removeSupplier = useSupplierStore((state) => state.removeSupplier);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formGst, setFormGst] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const filtered = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
        (s.phone && s.phone.includes(search)) ||
        (s.gstNumber && s.gstNumber.toLowerCase().includes(search.toLowerCase()))
    );
  }, [suppliers, search]);

  const handleOpenAdd = () => {
    setFormName("");
    setFormContact("");
    setFormPhone("");
    setFormEmail("");
    setFormGst("");
    setFormAddress("");
    setFormNotes("");
    setShowAddModal(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormName(s.name);
    setFormContact(s.contactPerson || "");
    setFormPhone(s.phone || "");
    setFormEmail(s.email || "");
    setFormGst(s.gstNumber || "");
    setFormAddress(s.address || "");
    setFormNotes(s.notes || "");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: formName.trim(),
        contactPerson: formContact.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        gstNumber: formGst.trim() || undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      setEditingSupplier(null);
    } else {
      addSupplier({
        name: formName.trim(),
        contactPerson: formContact.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        gstNumber: formGst.trim() || undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined,
        isActive: true,
      });
      setShowAddModal(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers & Vendors</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage distributor relationships, supply lines, and GST details
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{suppliers.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Vendors</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-purple-600">
              {suppliers.filter((s) => s.gstNumber).length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">GST Registered</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-600">Direct Contact</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Verified Suppliers</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers by company, contact person, GSTIN..."
          className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
              <th className="px-6 py-3.5">Company / Vendor</th>
              <th className="px-6 py-3.5">Contact Person</th>
              <th className="px-6 py-3.5">Contact Phone & Email</th>
              <th className="px-6 py-3.5">GST Number</th>
              <th className="px-6 py-3.5">Product Notes</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{supplier.name}</p>
                      <p className="text-xs text-gray-400 max-w-[200px] truncate">{supplier.address || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-xs font-medium text-gray-800">
                  {supplier.contactPerson || "—"}
                </td>
                <td className="px-6 py-3.5 text-xs text-gray-600">
                  <p className="font-semibold text-gray-900">{supplier.phone || "—"}</p>
                  {supplier.email && <p className="text-gray-400">{supplier.email}</p>}
                </td>
                <td className="px-6 py-3.5 text-xs font-mono font-medium text-gray-700">
                  {supplier.gstNumber || "—"}
                </td>
                <td className="px-6 py-3.5 text-xs text-gray-500 max-w-[160px] truncate">
                  {supplier.notes || "—"}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEdit(supplier)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Edit Supplier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeSupplier(supplier.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Supplier"
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
            <Truck className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No suppliers found</p>
          </div>
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
      {(showAddModal || editingSupplier) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSupplier(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Company / Vendor Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Hindustan Unilever Ltd"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Contact Person</label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="9820012345"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">GSTIN</label>
                  <input
                    type="text"
                    value={formGst}
                    onChange={(e) => setFormGst(e.target.value)}
                    placeholder="29AAACH1234F1Z1"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="orders@supplier.com"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Warehouse / Office Address</label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Plot 4, Industrial Area, Bangalore"
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Supplied Goods / Notes</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. FMCG Goods, Detergents, Soaps"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSupplier(null);
                  }}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  {editingSupplier ? "Update Supplier" : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
