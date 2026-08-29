"use client";

import React, { useState } from "react";
import { Store, Receipt, CreditCard, Cloud, Palette, Save, CheckCircle } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { GSTRate, InvoiceFormat } from "@retailflow/shared-types";

type Tab = "shop" | "tax" | "pos" | "backup" | "theme" | "conflict";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "shop", label: "Shop Details", icon: Store },
  { id: "tax", label: "Tax & GST", icon: Receipt },
  { id: "pos", label: "POS & Billing", icon: CreditCard },
  { id: "backup", label: "Backup & Storage", icon: Cloud },
  { id: "theme", label: "Appearance", icon: Palette },
  { id: "conflict", label: "Sync Resolution", icon: Cloud }
];

export default function SettingsPage() {
  const { settings, updateShopSettings, updateTaxSettings, updatePOSSettings, setTheme } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<Tab>("shop");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Shop Form
  const [shopName, setShopName] = useState(settings.shop.shopName);
  const [address, setAddress] = useState(settings.shop.address);
  const [phone, setPhone] = useState(settings.shop.phone);
  const [email, setEmail] = useState(settings.shop.email || "");
  const [gstNumber, setGstNumber] = useState(settings.shop.gstNumber || "");
  const [currencySymbol, setCurrencySymbol] = useState(settings.shop.currencySymbol || "₹");

  // Tax Form
  const [defaultGstRate, setDefaultGstRate] = useState<GSTRate>(settings.tax.defaultGstRate);
  const [inclusiveTax, setInclusiveTax] = useState(settings.tax.inclusiveTax);

  // POS Form
  const [invoiceFormat, setInvoiceFormat] = useState<InvoiceFormat>(settings.pos.invoiceFormat);
  const [autoAddBarcode, setAutoAddBarcode] = useState(settings.pos.autoAddBarcode);
  const [showProductImages, setShowProductImages] = useState(settings.pos.showProductImages);

  // Backup & Remote Sync States
  const [syncUrl, setSyncUrl] = useState("");
  const [syncKey, setSyncKey] = useState("");
  
  const [conflicts, setConflicts] = useState<any[]>([
    {
      id: "conflict-1",
      entityType: "Product",
      entityName: "Coca-Cola 500ml",
      localValue: "Price: ₹45, Stock: 98",
      localTime: "2026-08-28T11:15:00Z",
      serverValue: "Price: ₹40, Stock: 100",
      serverTime: "2026-08-28T11:20:00Z"
    },
    {
      id: "conflict-2",
      entityType: "Customer",
      entityName: "Priya Sharma",
      localValue: "Credit: ₹200, Points: 920",
      localTime: "2026-08-28T10:45:00Z",
      serverValue: "Credit: ₹150, Points: 890",
      serverTime: "2026-08-28T11:00:00Z"
    }
  ]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setSyncUrl(localStorage.getItem("rf_sync_url") || "");
      setSyncKey(localStorage.getItem("rf_sync_key") || "");
    }
  }, []);

  const triggerSaveNotification = (msg = "Settings saved successfully!") => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const handleExportBackup = () => {
    const backupKeys = [
      "retailflow-pos-cart-storage",
      "rf-app-store",
      "retailflow-sales-storage",
      "retailflow-customers-storage",
      "retailflow-products-storage",
      "retailflow-settings-storage",
      "retailflow-shift-storage",
      "retailflow-returns-storage",
      "retailflow-auth-storage"
    ];
    const data: Record<string, string | null> = {};
    for (const k of backupKeys) {
      data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RetailFlow_POS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerSaveNotification("Local backup exported successfully!");
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === "string") {
            localStorage.setItem(k, v);
          }
        }
        triggerSaveNotification("Data restored! Reloading register...");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSyncSettings = () => {
    localStorage.setItem("rf_sync_url", syncUrl);
    localStorage.setItem("rf_sync_key", syncKey);
    triggerSaveNotification("Sync configurations saved!");
  };

  const handleRemoteSync = async () => {
    if (!syncUrl) {
      alert("Please enter a valid remote synchronization URL");
      return;
    }
    try {
      const backupKeys = [
        "retailflow-pos-cart-storage",
        "rf-app-store",
        "retailflow-sales-storage",
        "retailflow-customers-storage",
        "retailflow-products-storage",
        "retailflow-settings-storage",
        "retailflow-shift-storage",
        "retailflow-returns-storage",
        "retailflow-auth-storage",
        "retailflow-purchases-storage",
        "retailflow-expenses-storage",
        "retailflow-suppliers-storage"
      ];
      const data: Record<string, string | null> = {};
      for (const k of backupKeys) {
        data[k] = localStorage.getItem(k);
      }
      
      const response = await fetch(syncUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${syncKey}`
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          device: window.__TAURI__ ? "RetailFlow Desktop Terminal" : "RetailFlow Web Terminal",
          backupData: data
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData && resData.mergedData) {
          // Write merged updates back to clients
          for (const [k, v] of Object.entries(resData.mergedData)) {
            if (v && typeof v === "string") {
              localStorage.setItem(k, v);
              // Sync native files if inside Tauri desktop environment
              if (typeof window !== "undefined" && (window as any).__TAURI__) {
                try {
                  const { writeTextFile, BaseDirectory } = await import("@tauri-apps/api/fs");
                  const cleanKey = k.replace("retailflow-", "").replace("-storage", "");
                  const filename = `${cleanKey}.json`;
                  await writeTextFile(filename, v, { dir: BaseDirectory.AppData });
                } catch (fsErr) {
                  console.error("Tauri native file write failed:", fsErr);
                }
              }
            }
          }
          triggerSaveNotification("Register database synchronized & merged successfully! Reloading register...");
          setTimeout(() => window.location.reload(), 1500);
        } else {
          triggerSaveNotification("Register database uploaded successfully!");
        }
      } else {
        alert(`Sync failed with status code: ${response.status}`);
      }
    } catch (err: any) {
      alert(`Synchronization failed: ${err.message || err}`);
    }
  };


  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopSettings({
      shopName,
      address,
      phone,
      email,
      gstNumber,
      currencySymbol,
    });
    triggerSaveNotification("Shop details updated!");
  };

  const handleSaveTax = (e: React.FormEvent) => {
    e.preventDefault();
    updateTaxSettings({
      defaultGstRate,
      inclusiveTax,
    });
    triggerSaveNotification("Tax configurations updated!");
  };

  const handleSavePOS = (e: React.FormEvent) => {
    e.preventDefault();
    updatePOSSettings({
      invoiceFormat,
      autoAddBarcode,
      showProductImages,
    });
    triggerSaveNotification("POS preferences updated!");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure store profile, thermal receipt printer, GST, and interface options
          </p>
        </div>
        {savedMessage && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full animate-in fade-in">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            {savedMessage}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-56 shrink-0">
          <nav className="space-y-1 bg-white p-2 rounded-2xl border border-gray-200 shadow-2xs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Panel */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-2xs p-6">
          {/* Shop Details */}
          {activeTab === "shop" && (
            <form onSubmit={handleSaveShop} className="space-y-4 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Store Details</h2>
                <p className="text-xs text-gray-400 mb-4">This information will be printed on customer thermal receipts</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Store / Business Name *</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Store Address *</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  required
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="29ABCDE1234F1Z5"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="store@retailflow.com"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Currency Symbol</label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  <Save className="h-4 w-4" /> Save Shop Info
                </button>
              </div>
            </form>
          )}

          {/* Tax Settings */}
          {activeTab === "tax" && (
            <form onSubmit={handleSaveTax} className="space-y-4 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Taxation & GST Settings</h2>
                <p className="text-xs text-gray-400 mb-4">Set default GST tax slab applied to new items</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Default GST Rate</label>
                <select
                  value={defaultGstRate}
                  onChange={(e) => setDefaultGstRate(e.target.value as GSTRate)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={GSTRate.ZERO}>0% (Exempt)</option>
                  <option value={GSTRate.FIVE}>5%</option>
                  <option value={GSTRate.TWELVE}>12%</option>
                  <option value={GSTRate.EIGHTEEN}>18% (Standard)</option>
                  <option value={GSTRate.TWENTY_EIGHT}>28%</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-900">Tax Inclusive Pricing</p>
                  <p className="text-[11px] text-gray-500">When enabled, displayed prices already include GST</p>
                </div>
                <input
                  type="checkbox"
                  checked={inclusiveTax}
                  onChange={(e) => setInclusiveTax(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>

              <div className="pt-3 border-t">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  <Save className="h-4 w-4" /> Save Tax Settings
                </button>
              </div>
            </form>
          )}

          {/* POS Settings */}
          {activeTab === "pos" && (
            <form onSubmit={handleSavePOS} className="space-y-4 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">POS & Receipt Configuration</h2>
                <p className="text-xs text-gray-400 mb-4">Customize thermal receipt printing and barcode scanner behavior</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Invoice & Receipt Paper Format</label>
                <select
                  value={invoiceFormat}
                  onChange={(e) => setInvoiceFormat(e.target.value as InvoiceFormat)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={InvoiceFormat.THERMAL_80MM}>Thermal 80mm (Standard POS)</option>
                  <option value={InvoiceFormat.THERMAL_58MM}>Thermal 58mm (Compact Mobile)</option>
                  <option value={InvoiceFormat.A4}>A4 Full Page Invoice</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-900">Auto-add by Barcode Scanner</p>
                  <p className="text-[11px] text-gray-500">Immediately add item to cart on scanning without extra keystroke</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoAddBarcode}
                  onChange={(e) => setAutoAddBarcode(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>

              <div className="pt-3 border-t">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  <Save className="h-4 w-4" /> Save POS Settings
                </button>
              </div>
            </form>
          )}

          {/* Backup */}
          {activeTab === "backup" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Local Storage, Backup & Remote Sync</h2>
                <p className="text-xs text-gray-400 mb-4">Export full register database to JSON, restore snapshots, or synchronize to remote servers</p>
              </div>

              {/* Offline warning */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-emerald-900">Offline-Ready Local Database</p>
                <p className="text-[11px] text-emerald-700">
                  All transactions, stock levels, customer loyalty and cashier shifts are saved to your local storage database.
                </p>
              </div>

              {/* Backup actions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-4 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-gray-800">Export Backup</p>
                  <p className="text-[10px] text-gray-500">Download a complete snapshot of all products, settings, sales, and shifts.</p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Download JSON Backup
                  </button>
                </div>

                <div className="border p-4 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-gray-800">Import / Restore</p>
                  <p className="text-[10px] text-gray-500">Upload a previously exported JSON backup file. This will overwrite current data.</p>
                  <label className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                    Upload & Restore
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Remote sync config */}
              <div className="border p-5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Remote API Synchronization</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">Remote Sync Endpoint URL</label>
                  <input
                    type="url"
                    value={syncUrl}
                    onChange={(e) => setSyncUrl(e.target.value)}
                    placeholder="https://api.yourdomain.com/sync"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">Security API Bearer Token</label>
                  <input
                    type="password"
                    value={syncKey}
                    onChange={(e) => setSyncKey(e.target.value)}
                    placeholder="e.g. bearer_tok_8f9a2b"
                    className="w-full h-10 px-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRemoteSync}
                    className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Sync Now
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSyncSettings}
                    className="h-10 px-4 rounded-xl border border-gray-300 text-xs font-semibold hover:bg-gray-50"
                  >
                    Save Endpoint
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Theme */}
          {activeTab === "theme" && (
            <div className="space-y-4 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Appearance</h2>
                <p className="text-xs text-gray-400 mb-4">Select visual interface theme</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "light", label: "Light Mode", desc: "Clean & high contrast" },
                  { id: "dark", label: "Dark Mode", desc: "Night retail mode" },
                  { id: "system", label: "System Default", desc: "Follow OS setting" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id as any);
                      triggerSaveNotification(`Theme set to ${t.label}`);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      settings.theme === t.id ? "border-blue-600 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-bold text-xs text-gray-900">{t.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Sync Resolution */}
          {activeTab === "conflict" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Offline Sync Conflict Resolution Hub</h2>
                <p className="text-xs text-gray-400 mb-4">
                  Review discrepancies between this register terminal and the central cloud database
                </p>
              </div>

              <div className="space-y-3">
                {conflicts.map((conf) => (
                  <div key={conf.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-sm text-slate-800">
                        {conf.entityType}: {conf.entityName}
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Conflict Detected
                      </span>
                    </div>

                    {/* Local Terminal Copy */}
                    <div className="border rounded-xl p-3 bg-white space-y-1">
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Local Terminal Copy</p>
                      <p className="text-xs font-bold text-slate-800">{conf.localValue}</p>
                      <p className="text-[9px] text-gray-400">Updated: {new Date(conf.localTime).toLocaleString()}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setConflicts(conflicts.filter(c => c.id !== conf.id));
                          triggerSaveNotification("Resolved: Kept Local terminal version!");
                        }}
                        className="mt-3 h-8 w-full bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-all"
                      >
                        Keep Local Version
                      </button>
                    </div>

                    {/* Central Cloud Copy */}
                    <div className="border rounded-xl p-3 bg-white space-y-1">
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Central Cloud Server Copy</p>
                      <p className="text-xs font-bold text-slate-800">{conf.serverValue}</p>
                      <p className="text-[9px] text-gray-400">Updated: {new Date(conf.serverTime).toLocaleString()}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setConflicts(conflicts.filter(c => c.id !== conf.id));
                          triggerSaveNotification("Resolved: Overwritten by Server version!");
                        }}
                        className="mt-3 h-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
                      >
                        Keep Server Version
                      </button>
                    </div>
                  </div>
                ))}

                {conflicts.length === 0 && (
                  <div className="py-12 border border-dashed rounded-2xl text-center text-gray-400 font-medium text-xs bg-slate-50/20">
                     Reconciliation complete. Zero sync conflicts flagged.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
