"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { UserRole } from "@retailflow/shared-types";
import { Users, UserPlus, Shield, Check, X, ShieldAlert, Edit, Trash2 } from "lucide-react";

export default function UsersPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const { users, addUser, updateUser, deleteUser } = useAuthStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.CASHIER);
  const [isActive, setIsActive] = useState(true);

  if (currentUser?.role !== UserRole.OWNER) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3">
        <ShieldAlert className="h-16 w-16 text-rose-500 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          You need Owner level permissions to access user administration and credentials configuration.
        </p>
      </div>
    );
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !pin || !firstName || !lastName) return;

    addUser({
      username,
      email,
      pin,
      passwordHash: pin,
      firstName,
      lastName,
      role,
      isActive,
    });

    resetForm();
    setShowAddForm(false);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    updateUser(editingUserId, {
      username,
      email,
      pin,
      passwordHash: pin,
      firstName,
      lastName,
      role,
      isActive,
    });

    resetForm();
    setEditingUserId(null);
  };

  const startEdit = (user: any) => {
    setEditingUserId(user.id);
    setUsername(user.username);
    setEmail(user.email);
    setPin(user.pin || "");
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setRole(user.role);
    setIsActive(user.isActive);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPin("");
    setFirstName("");
    setLastName("");
    setRole(UserRole.CASHIER);
    setIsActive(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" /> User Accounts & RBAC
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure system access, roles, and 4-digit terminal unlock PINs
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingUserId(null);
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
        >
          <UserPlus className="h-4 w-4" /> Add New User
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Users Table */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Unlock PIN</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">{user.email || "No Email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-700">{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      user.role === UserRole.OWNER
                        ? "bg-purple-50 text-purple-700"
                        : user.role === UserRole.MANAGER
                        ? "bg-blue-50 text-blue-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}>
                      <Shield className="h-3 w-3" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700">•••• ({user.pin})</td>
                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Check className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        <X className="h-3.5 w-3.5" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(user)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                        title="Edit credentials"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.id !== "user-admin" && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-600"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User Editor Panel */}
        {(showAddForm || editingUserId) && (
          <div className="w-full lg:w-96 bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 self-start">
            <h3 className="font-bold text-gray-900 text-sm mb-4">
              {editingUserId ? "Edit User Account" : "Add New User Account"}
            </h3>

            <form onSubmit={editingUserId ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Quick Unlock PIN (4 digits) *</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  pattern="[0-9]{4}"
                  placeholder="e.g. 2910"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Access Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={UserRole.CASHIER}>Cashier (POS terminal only)</option>
                  <option value={UserRole.MANAGER}>Manager (POS, stock, reports)</option>
                  <option value={UserRole.OWNER}>Owner (Full access)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-700">Account Active</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingUserId(null);
                    resetForm();
                  }}
                  className="flex-1 h-10 border border-gray-300 text-xs font-bold text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
