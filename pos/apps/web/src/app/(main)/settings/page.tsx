"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  Receipt,
  CreditCard,
  Cloud,
  Palette,
  Save,
  CheckCircle,
  Wifi,
  QrCode,
  HardDriveDownload,
  FileJson,
  Clock,
  FolderOpen,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Percent,
  Tag,
  Printer,
  Sparkles,
  HelpCircle,
  FolderSync
} from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { GSTRate, InvoiceFormat } from "@retailflow/shared-types";
import {
  createDayEndBackup,
  getBackupHistory,
  getActiveBackupPath,
  selectBackupFolder,
  openBackupsFolderInExplorer,
  BackupHistoryEntry
} from "@/lib/dayend-backup";
import { LocalNetworkModal } from "@/components/network/local-network-modal";
import { FactoryResetModal } from "@/components/settings/factory-reset-modal";

type Tab = "shop" | "tax" | "pos" | "backup" | "network" | "theme" | "conflict";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "shop", label: "Shop Details", icon: Store },
  { id: "tax", label: "Tax & GST", icon: Receipt },
  { id: "pos", label: "POS & Billing", icon: CreditCard },
  { id: "backup", label: "Day-End Backup & Storage", icon: Cloud },
  { id: "network", label: "Local Network & QR", icon: Wifi },
  { id: "theme", label: "Appearance", icon: Palette },
  { id: "conflict", label: "Sync Resolution", icon: Cloud },
];

export default function SettingsPage() {
  const {
    settings,
    updateShopSettings,
    updateTaxSettings,
    updatePOSSettings,
    updateBackupSettings,
    setTheme
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<Tab>("shop");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const [factoryResetOpen, setFactoryResetOpen] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupHistoryEntry[]>([]);
  const [activeBackupPath, setActiveBackupPathState] = useState<string>("Loading...");

  // Shop Form
  const [shopName, setShopName] = useState(settings.shop.shopName);
  const [address, setAddress] = useState(settings.shop.address);
  const [phone, setPhone] = useState(settings.shop.phone);
  const [email, setEmail] = useState(settings.shop.email || "");
  const [gstNumber, setGstNumber] = useState(settings.shop.gstNumber || "");
  const [upiId, setUpiId] = useState(settings.shop.upiId || "");
  const [placeOfSupply, setPlaceOfSupply] = useState(settings.shop.placeOfSupply || "32-Kerala");
  const [currencySymbol, setCurrencySymbol] = useState(settings.shop.currencySymbol || "₹");

  // Tax Form
  const [defaultGstRate, setDefaultGstRate] = useState<GSTRate>(settings.tax.defaultGstRate);
  const [inclusiveTax, setInclusiveTax] = useState(settings.tax.inclusiveTax);

  // POS Form
  const [invoiceFormat, setInvoiceFormat] = useState<InvoiceFormat>(settings.pos.invoiceFormat);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.pos.invoicePrefix || "INV-2026-");
  const [receiptHeader, setReceiptHeader] = useState(settings.pos.receiptHeader || "Thank you for shopping with us!");
  const [receiptFooter, setReceiptFooter] = useState(
    settings.pos.receiptFooter || "Goods once sold cannot be returned without original tax bill."
  );
  const [showQrOnReceipt, setShowQrOnReceipt] = useState(settings.pos.showQrOnReceipt ?? true);
  const [showCashierOnReceipt, setShowCashierOnReceipt] = useState(settings.pos.showCashierOnReceipt ?? true);
  const [loyaltySpendPerPoint, setLoyaltySpendPerPoint] = useState(String(settings.pos.loyaltySpendPerPoint ?? 100));
  const [loyaltyPointValue, setLoyaltyPointValue] = useState(String(settings.pos.loyaltyPointValue ?? 1.0));
  const [autoAddBarcode, setAutoAddBarcode] = useState(settings.pos.autoAddBarcode);
  const [showProductImages, setShowProductImages] = useState(settings.pos.showProductImages);

  // Backup Form & Directory
  const [customBackupDir, setCustomBackupDir] = useState(settings.backup?.customBackupDirectory || "");
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
      serverTime: "2026-08-28T11:20:00Z",
    },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSyncUrl(localStorage.getItem("rf_sync_url") || "");
      setSyncKey(localStorage.getItem("rf_sync_key") || "");
      setBackupHistory(getBackupHistory());
      getActiveBackupPath().then(setActiveBackupPathState);
    }
  }, [settings.backup?.customBackupDirectory]);

  const triggerSaveNotification = (msg = "Settings saved successfully!") => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const handleExportBackup = async () => {
    const res = await createDayEndBackup({
      backupType: "manual_export",
    });
    if (res.success) {
      setBackupHistory(getBackupHistory());
      triggerSaveNotification(`Day-End Backup saved: ${res.filename}`);
    } else {
      alert(`Backup notice: ${res.error}`);
    }
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

  const handleSelectFolder = async () => {
    const chosen = await selectBackupFolder();
    if (chosen) {
      setCustomBackupDir(chosen);
      updateBackupSettings({ customBackupDirectory: chosen });
      setActiveBackupPathState(chosen);
      triggerSaveNotification(`Backup folder updated to: ${chosen}`);
    }
  };

  const handleResetFolder = () => {
    setCustomBackupDir("");
    updateBackupSettings({ customBackupDirectory: "" });
    getActiveBackupPath().then(setActiveBackupPathState);
    triggerSaveNotification("Reset to application default installation folder");
  };

  const handleOpenExplorer = async () => {
    const opened = await openBackupsFolderInExplorer();
    if (opened) {
      triggerSaveNotification("Opened backup folder in File Explorer!");
    } else {
      triggerSaveNotification(`Folder path: ${activeBackupPath}`);
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
      upiId,
      placeOfSupply,
      currencySymbol,
    });
    triggerSaveNotification("Shop details and UPI configurations updated!");
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
      invoicePrefix: invoicePrefix.trim(),
      receiptHeader: receiptHeader.trim(),
      receiptFooter: receiptFooter.trim(),
      showQrOnReceipt,
      showCashierOnReceipt,
      loyaltySpendPerPoint: parseFloat(loyaltySpendPerPoint) || 100,
      loyaltyPointValue: parseFloat(loyaltyPointValue) || 1.0,
      autoAddBarcode,
      showProductImages,
    });
    triggerSaveNotification("POS and receipt configurations updated!");
  };

  const handleSaveSyncSettings = () => {
    localStorage.setItem("rf_sync_url", syncUrl);
    localStorage.setItem("rf_sync_key", syncKey);
    triggerSaveNotification("Sync configurations saved!");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure store profile, thermal receipt customizer, backup folders, and GST rules
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
                <h2 className="text-base font-bold text-gray-900 mb-1">Store Profile & Tax Info</h2>
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
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="32ABCDE1234F1Z5"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Merchant UPI ID (For Dynamic QR)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="merchant@okaxis or 9876543210@paytm"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">State / Place of Supply</label>
                  <input
                    type="text"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    placeholder="32-Kerala"
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

          {/* POS & Receipt Customization */}
          {activeTab === "pos" && (
            <form onSubmit={handleSavePOS} className="space-y-5 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">POS & Receipt Customizations</h2>
                <p className="text-xs text-gray-400 mb-4">
                  Configure thermal printing templates, custom invoice prefix, receipt messages, and loyalty rewards
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Custom Invoice Number Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="e.g. INV-2026-"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Receipt Header & Footer Texts */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="h-3.5 w-3.5 text-indigo-600" /> Receipt Custom Text Messages
                </p>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Receipt Greeting Header</label>
                  <input
                    type="text"
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    placeholder="Thank you for shopping with us!"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Receipt Terms / Return Policy Footer</label>
                  <textarea
                    rows={2}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="Goods once sold cannot be returned without original tax bill."
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQrOnReceipt}
                      onChange={(e) => setShowQrOnReceipt(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    Print UPI QR on Bill
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCashierOnReceipt}
                      onChange={(e) => setShowCashierOnReceipt(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    Print Cashier Name
                  </label>
                </div>
              </div>

              {/* Loyalty Rules Customizer */}
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-3">
                <p className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" /> Loyalty Points Program Rules
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Spend per 1 Loyalty Point (₹)</label>
                    <input
                      type="number"
                      min={10}
                      value={loyaltySpendPerPoint}
                      onChange={(e) => setLoyaltySpendPerPoint(e.target.value)}
                      placeholder="100"
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-bold bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Default: ₹100 spend = 1 point</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">1 Point Redemption Value (₹)</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={loyaltyPointValue}
                      onChange={(e) => setLoyaltyPointValue(e.target.value)}
                      placeholder="1.0"
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-bold bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Default: 1 point = ₹1.00 off</p>
                  </div>
                </div>
              </div>

              {/* Barcode & Scanner Toggles */}
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
                  <Save className="h-4 w-4" /> Save POS & Receipt Settings
                </button>
              </div>
            </form>
          )}

          {/* Day-End Backup & Storage */}
          {activeTab === "backup" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Day-End Local File Backups & Storage</h2>
                <p className="text-xs text-gray-400 mb-4">
                  Configure local backup target directories, export full JSON archives, and manage store data lifecycle
                </p>
              </div>

              {/* Active Backup Folder Configuration */}
              <div className="border border-indigo-100 p-5 rounded-2xl space-y-3 bg-indigo-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <FolderOpen className="h-4 w-4 text-indigo-600" /> Active Backup Storage Folder
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectFolder}
                      className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <FolderSync className="h-3.5 w-3.5" /> Browse / Change Folder
                    </button>
                    
                    {customBackupDir && (
                      <button
                        type="button"
                        onClick={handleResetFolder}
                        className="h-8 px-2.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-[11px] font-semibold transition-all flex items-center gap-1"
                        title="Reset to default installation folder"
                      >
                        <RotateCcw className="h-3 w-3" /> Default
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-indigo-700/90 leading-relaxed">
                  All automated Day-End shift closure backups and manual exports are written directly to this directory:
                </p>

                <div className="p-2.5 bg-white border border-indigo-200/80 rounded-xl font-mono text-[11px] text-slate-800 select-all truncate">
                  {activeBackupPath}
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-indigo-600 font-medium">
                    {customBackupDir ? "Custom User Folder Selected" : "Application Installation Directory"}
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenExplorer}
                    className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1"
                  >
                    <FolderOpen className="h-3 w-3" /> Open in File Explorer
                  </button>
                </div>
              </div>

              {/* Manual Backup Actions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2 bg-slate-50/30">
                  <p className="text-xs font-bold text-gray-800">Export Day-End Backup</p>
                  <p className="text-[10px] text-gray-500">
                    Save complete snapshot of products, sales, customers, accounts, and shifts.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <HardDriveDownload className="h-3.5 w-3.5 text-indigo-400" />
                    Download Day-End JSON
                  </button>
                </div>

                <div className="border border-slate-200 p-4 rounded-2xl space-y-2 bg-slate-50/30">
                  <p className="text-xs font-bold text-gray-800">Import / Restore</p>
                  <p className="text-[10px] text-gray-500">
                    Upload a previously exported JSON backup file to restore database.
                  </p>
                  <label className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs">
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

              {/* SECURE STORE DATA WIPE / FACTORY RESET */}
              <div className="border-2 border-rose-200 p-5 rounded-2xl space-y-3 bg-rose-50/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-rose-600" />
                      Store Data Wipe & Factory Reset
                    </p>
                    <p className="text-[11px] text-rose-700">
                      Requires Admin password verification & double safety confirmation to prevent accidental loss.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFactoryResetOpen(true)}
                    className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Factory Reset Store
                  </button>
                </div>
              </div>

              {/* Recent Day-End Backups History */}
              {backupHistory.length > 0 && (
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" /> Recent Day-End Local Backups
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{backupHistory.length} recorded</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {backupHistory.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="overflow-hidden pr-2">
                          <p className="font-mono font-bold text-slate-800 truncate text-[11px]">{item.filename}</p>
                          <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString()} • {Math.round(item.sizeBytes / 1024)} KB</p>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                          Saved
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remote sync config */}
              <div className="border border-slate-200 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Remote Cloud Database Synchronization</h3>
                
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
                    onClick={handleSaveSyncSettings}
                    className="h-10 px-4 rounded-xl border border-gray-300 text-xs font-semibold hover:bg-gray-50"
                  >
                    Save Endpoint
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Local Network & QR */}
          {activeTab === "network" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Local Network Web App Access & QR Code</h2>
                <p className="text-xs text-gray-400 mb-4">Connect tablets, phones, and wireless mobile registers across your local Wi-Fi router</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">Instant Wi-Fi Register Pairing</h3>
                    <p className="text-xs text-indigo-200">Scan QR code from any smartphone camera to open POS terminal</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  RetailFlow POS runs a multi-terminal server on port 3000. All mobile phones and tablets connected to the same Wi-Fi can ring up sales, print receipts, and manage inventory simultaneously.
                </p>

                <button
                  type="button"
                  onClick={() => setNetworkModalOpen(true)}
                  className="w-full h-11 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <QrCode className="h-4 w-4 text-indigo-600" />
                  Open Local Network QR Code Modal
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-slate-50/50 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Connection Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Host machine and mobile devices must be on the same Wi-Fi network.</li>
                  <li>Ensure Windows Firewall allows inbound connections on TCP port 3000.</li>
                  <li>Cashier PINs work seamlessly across all paired mobile devices.</li>
                </ul>
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
                  Review discrepancies between this register terminal and central cloud database
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
                          setConflicts(conflicts.filter((c) => c.id !== conf.id));
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
                          setConflicts(conflicts.filter((c) => c.id !== conf.id));
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

      <LocalNetworkModal
        isOpen={networkModalOpen}
        onClose={() => setNetworkModalOpen(false)}
      />

      <FactoryResetModal
        isOpen={factoryResetOpen}
        onClose={() => setFactoryResetOpen(false)}
        onSuccess={() => {
          setFactoryResetOpen(false);
          triggerSaveNotification("Store factory reset complete! Initializing blank store...");
        }}
      />
    </div>
  );
}
