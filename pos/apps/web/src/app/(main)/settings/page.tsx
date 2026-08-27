"use client";

import React, { useState } from "react";
import { Store, Receipt, CreditCard, Cloud, Palette, Save, CheckCircle } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { GSTRate, InvoiceFormat } from "@retailflow/shared-types";

type Tab = "shop" | "tax" | "pos" | "backup" | "theme";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "shop", label: "Shop Details", icon: Store },
  { id: "tax", label: "Tax & GST", icon: Receipt },
  { id: "pos", label: "POS & Billing", icon: CreditCard },
  { id: "backup", label: "Backup & Storage", icon: Cloud },
  { id: "theme", label: "Appearance", icon: Palette },
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

  const triggerSaveNotification = (msg = "Settings saved successfully!") => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 2500);
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
            <div className="space-y-4 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Local Storage & Cloud Sync</h2>
                <p className="text-xs text-gray-400 mb-4">All application data is securely persisted offline in local storage</p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-emerald-900">Status: Active & Offline-Ready</p>
                <p className="text-[11px] text-emerald-700">
                  Transactions, stock levels, and product catalogs are automatically saved to local storage on every change.
                </p>
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
        </div>
      </div>
    </div>
  );
}
