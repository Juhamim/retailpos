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
  Clock,
  FolderOpen,
  RotateCcw,
  ShieldAlert,
  Printer,
  Sparkles,
  FolderSync,
  CloudLightning,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  DownloadCloud,
  Database,
  ArrowRight
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
import { LogoUploader } from "@/components/settings/logo-uploader";
import { generateUpiQrDataUrl } from "@/lib/upi-qr";
import { CloudflareWizardModal } from "@/components/settings/cloudflare-wizard-modal";
import { cloudflareClient, RemoteBackupEntry } from "@/lib/cloudflare-client";
import { cloudflareBackupService } from "@/lib/cloudflare-backup-service";
import { cloudflareSyncService } from "@/lib/cloudflare-sync-service";

type Tab = "shop" | "cloudflare" | "tax" | "pos" | "backup" | "network" | "theme" | "conflict";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "shop", label: "Shop Details & Logo", icon: Store },
  { id: "cloudflare", label: "Cloudflare Sync & Backup", icon: CloudLightning },
  { id: "tax", label: "Tax & GST", icon: Receipt },
  { id: "pos", label: "POS & Billing", icon: CreditCard },
  { id: "backup", label: "Local Day-End Backup", icon: Cloud },
  { id: "network", label: "Local Network & QR", icon: Wifi },
  { id: "theme", label: "Appearance", icon: Palette },
  { id: "conflict", label: "Sync Resolution", icon: RotateCcw },
];

export default function SettingsPage() {
  const {
    settings,
    updateShopSettings,
    updateTaxSettings,
    updatePOSSettings,
    updateBackupSettings,
    updateCloudflareSettings,
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
  const [logo, setLogo] = useState(settings.shop.logo || "");
  const [address, setAddress] = useState(settings.shop.address);
  const [phone, setPhone] = useState(settings.shop.phone);
  const [email, setEmail] = useState(settings.shop.email || "");
  const [gstNumber, setGstNumber] = useState(settings.shop.gstNumber || "");
  const [upiId, setUpiId] = useState(settings.shop.upiId || "");
  const [placeOfSupply, setPlaceOfSupply] = useState(settings.shop.placeOfSupply || "32-Kerala");
  const [currencySymbol, setCurrencySymbol] = useState(settings.shop.currencySymbol || "₹");

  // Dynamic UPI Preview State
  const [testUpiAmount, setTestUpiAmount] = useState<number>(150);
  const [upiQrPreviewUrl, setUpiQrPreviewUrl] = useState<string>("");

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
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(settings.pos.showLogoOnReceipt ?? true);
  const [loyaltySpendPerPoint, setLoyaltySpendPerPoint] = useState(String(settings.pos.loyaltySpendPerPoint ?? 100));
  const [loyaltyPointValue, setLoyaltyPointValue] = useState(String(settings.pos.loyaltyPointValue ?? 1.0));
  const [autoAddBarcode, setAutoAddBarcode] = useState(settings.pos.autoAddBarcode);
  const [showProductImages, setShowProductImages] = useState(settings.pos.showProductImages);

  // Cloudflare Sync & Backup Form
  const [cfWorkerUrl, setCfWorkerUrl] = useState(settings.cloudflare?.workerUrl || "");
  const [cfApiToken, setCfApiToken] = useState(settings.cloudflare?.apiToken || "");
  const [cfStoreId, setCfStoreId] = useState(settings.cloudflare?.storeId || "store-kerala-01");
  const [cfAutoSync, setCfAutoSync] = useState(settings.cloudflare?.autoSync ?? true);
  const [cfAutoCloudBackup, setCfAutoCloudBackup] = useState(settings.cloudflare?.autoCloudBackup ?? true);
  const [cfTesting, setCfTesting] = useState(false);
  const [cfTestResult, setCfTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cfBackingUp, setCfBackingUp] = useState(false);
  const [cfRemoteBackups, setCfRemoteBackups] = useState<RemoteBackupEntry[]>([]);
  const [cfLoadingBackups, setCfLoadingBackups] = useState(false);
  const [cfRestoringId, setCfRestoringId] = useState<string | null>(null);
  const [cfWizardOpen, setCfWizardOpen] = useState(false);

  // Backup Form & Directory
  const [customBackupDir, setCustomBackupDir] = useState(settings.backup?.customBackupDirectory || "");

  const [conflicts, setConflicts] = useState<any[]>([
    {
      id: "conflict-1",
      entityType: "Product",
      entityName: "Tata Tea Gold 500g",
      localValue: "Price: ₹320, Stock: 45",
      localTime: "2026-10-18T10:15:00Z",
      serverValue: "Price: ₹310, Stock: 50",
      serverTime: "2026-10-18T10:20:00Z",
    },
  ]);

  // Generate live UPI QR preview when UPI ID or test amount changes
  useEffect(() => {
    let active = true;
    const updatePreview = async () => {
      try {
        const url = await generateUpiQrDataUrl(
          {
            payeeVpa: upiId || "retailflow@okaxis",
            payeeName: shopName || "RetailFlow Mart",
            amount: testUpiAmount,
            invoiceNumber: "PREVIEW-001",
            transactionNote: "POS Live Test Payment",
          },
          { width: 220 }
        );
        if (active) setUpiQrPreviewUrl(url);
      } catch (err) {
        console.error("UPI preview error:", err);
      }
    };
    updatePreview();
    return () => {
      active = false;
    };
  }, [upiId, shopName, testUpiAmount]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBackupHistory(getBackupHistory());
      getActiveBackupPath().then(setActiveBackupPathState);
    }
  }, [settings.backup?.customBackupDirectory]);

  // Load remote Cloudflare backups when visiting cloudflare tab
  useEffect(() => {
    if (activeTab === "cloudflare" && cfWorkerUrl) {
      loadRemoteBackups();
    }
  }, [activeTab, cfWorkerUrl]);

  const loadRemoteBackups = async () => {
    setCfLoadingBackups(true);
    try {
      const res = await cloudflareClient.listBackups();
      if (res.success && res.data) {
        setCfRemoteBackups(res.data);
      }
    } catch (err) {
      console.error("Failed to load Cloudflare backups:", err);
    } finally {
      setCfLoadingBackups(false);
    }
  };

  const triggerSaveNotification = (msg = "Settings saved successfully!") => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
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
      logo,
      address,
      phone,
      email,
      gstNumber,
      upiId,
      placeOfSupply,
      currencySymbol,
    });
    triggerSaveNotification("Shop details, logo, and UPI settings updated!");
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
      showLogoOnReceipt,
      loyaltySpendPerPoint: parseFloat(loyaltySpendPerPoint) || 100,
      loyaltyPointValue: parseFloat(loyaltyPointValue) || 1.0,
      autoAddBarcode,
      showProductImages,
    });
    triggerSaveNotification("POS and receipt configurations updated!");
  };

  const handleSaveCloudflare = (e: React.FormEvent) => {
    e.preventDefault();
    updateCloudflareSettings({
      workerUrl: cfWorkerUrl.trim().replace(/\/$/, ""),
      apiToken: cfApiToken.trim(),
      storeId: cfStoreId.trim() || "store-kerala-01",
      autoSync: cfAutoSync,
      autoCloudBackup: cfAutoCloudBackup,
    });
    triggerSaveNotification("Cloudflare connection parameters saved!");
  };

  const handleTestCloudflareConnection = async () => {
    setCfTesting(true);
    setCfTestResult(null);
    try {
      // Temporarily apply current input values
      updateCloudflareSettings({
        workerUrl: cfWorkerUrl.trim().replace(/\/$/, ""),
        apiToken: cfApiToken.trim(),
        storeId: cfStoreId.trim() || "store-kerala-01",
      });

      const res = await cloudflareClient.testConnection();
      if (res.success) {
        setCfTestResult({
          success: true,
          message: res.message || "Connected to Cloudflare Worker successfully!",
        });
        loadRemoteBackups();
      } else {
        setCfTestResult({
          success: false,
          message: res.error || "Failed to reach Cloudflare Worker. Check URL & network.",
        });
      }
    } catch (err: any) {
      setCfTestResult({
        success: false,
        message: err.message || "Connection test failed.",
      });
    } finally {
      setCfTesting(false);
    }
  };

  const handleManualCloudBackup = async () => {
    setCfBackingUp(true);
    try {
      const res = await cloudflareBackupService.createCloudBackup("manual_settings");
      if (res.success) {
        triggerSaveNotification(`Cloud Backup successful! ${res.filename}`);
        await loadRemoteBackups();
      } else {
        alert(`Cloud Backup failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error creating cloud backup: ${err.message}`);
    } finally {
      setCfBackingUp(false);
    }
  };

  const handleManualSyncNow = async () => {
    try {
      triggerSaveNotification("Starting live push/pull sync with Cloudflare...");
      const res = await cloudflareSyncService.syncNow();
      if (res.success) {
        triggerSaveNotification(`Sync complete! Pushed: ${res.pushedSales} sales, pulled: ${res.pulledProducts} items.`);
      } else {
        alert(`Sync warning: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Sync error: ${err.message}`);
    }
  };

  const handleRestoreCloudBackup = async (key: string, filename: string) => {
    if (!confirm(`Are you sure you want to restore "${filename}" from Cloudflare? This will safely update your local database registers.`)) {
      return;
    }
    setCfRestoringId(key);
    try {
      const res = await cloudflareBackupService.restoreCloudBackup(key);
      if (res.success) {
        alert(`Snapshot restored successfully! Restored ${res.restoredStores.length} storage tables. Reloading application...`);
        window.location.reload();
      } else {
        alert(`Failed to restore backup: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Restore error: ${err.message}`);
    } finally {
      setCfRestoringId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Application Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure store branding, Cloudflare cloud sync & backups, dynamic UPI QR, thermal receipts, and tax slabs
          </p>
        </div>
        {savedMessage && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-4 py-2 rounded-xl shadow-xs animate-in fade-in">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {savedMessage}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="space-y-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                <span className="truncate">{tab.label}</span>
                {tab.id === "cloudflare" && (
                  <span className="ml-auto text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Cloud
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content Panel */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
          
          {/* ========================================================================= */}
          {/* TAB 1: SHOP DETAILS & BRANDING */}
          {/* ========================================================================= */}
          {activeTab === "shop" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Store Branding & Tax Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload your store logo and set merchant details displayed across invoices, thermal receipts, app header, and customer portals.
                </p>
              </div>

              {/* Logo Uploader Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <LogoUploader
                  currentLogo={logo}
                  onLogoChange={(newLogo) => setLogo(newLogo)}
                  shopName={shopName}
                />
              </div>

              <form onSubmit={handleSaveShop} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Store / Business Name *</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Store Address (Printed on Receipts) *</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Phone Number *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">GSTIN / Tax ID</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="32ABCDE1234F1Z5"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="store@retailflow.com"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Currency Symbol</label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic UPI Payment Configuration + Live Test Scan Card */}
                <div className="p-5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <QrCode className="h-4 w-4" /> Dynamic UPI QR Payment Configuration
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Enables real-time dynamic QR codes on checkout screens, printed thermal receipts, and A4 tax invoices with exact billing amount.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Merchant UPI VPA ID *</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value.trim())}
                        placeholder="merchant@okaxis or 9876543210@paytm"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Compatible with PhonePe, Google Pay, Paytm, BHIM, and all UPI 2.0 banking apps.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Place of Supply / State Code</label>
                      <input
                        type="text"
                        value={placeOfSupply}
                        onChange={(e) => setPlaceOfSupply(e.target.value)}
                        placeholder="32-Kerala"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Live UPI QR Test Preview Card */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center gap-5">
                    <div className="shrink-0 p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
                      {upiQrPreviewUrl ? (
                        <img src={upiQrPreviewUrl} alt="UPI Preview" className="w-28 h-28 object-contain" />
                      ) : (
                        <div className="w-28 h-28 flex items-center justify-center text-slate-400 text-xs">Generating...</div>
                      )}
                    </div>

                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">Live Test Scanner</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          NPCI Compliant
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Scan with your PhonePe or GPay camera to test receive payment to <strong className="font-mono text-indigo-600 dark:text-indigo-400">{upiId || "retailflow@okaxis"}</strong>.
                      </p>
                      
                      {/* Test Amount Selector */}
                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Test Amount:</span>
                        {[10, 50, 150, 500].map((amt) => (
                          <button
                            type="button"
                            key={amt}
                            onClick={() => setTestUpiAmount(amt)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              testUpiAmount === amt
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                  >
                    <Save className="h-4 w-4" /> Save Shop & Branding Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CLOUDFLARE SYNC & CLOUD BACKUP */}
          {/* ========================================================================= */}
          {activeTab === "cloudflare" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                      <CloudLightning className="h-5 w-5 text-amber-500" />
                      Cloudflare Worker Synchronization & Cloud Backups
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sync offline POS registers directly with your Cloudflare serverless Worker and access real-time executive dashboard from anywhere.
                    </p>
                  </div>

                  {cfWorkerUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(cfWorkerUrl, "_blank")}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Worker Web Page
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Self-Service Guided Cloudflare Wizard Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-rose-500/10 border-2 border-orange-200 dark:border-orange-900/60 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                      Customer Self-Service
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <Sparkles size={14} className="text-orange-500" /> Connect Your Own Cloudflare Account
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                    Step-by-step visual assistant to auto-provision your Cloudflare D1 central database, R2 cloud snapshot storage, and executive dashboard web page. Zero terminal commands required!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCfWizardOpen(true)}
                  className="shrink-0 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <CloudLightning size={16} />
                  Launch Setup Wizard
                </button>
              </div>

              {/* Status & Test Connection Bar */}
              {cfTestResult && (
                <div
                  className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                    cfTestResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  {cfTestResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{cfTestResult.message}</span>
                </div>
              )}

              {/* Cloudflare Worker Settings Form */}
              <form onSubmit={handleSaveCloudflare} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Cloudflare Worker URL *</label>
                  <input
                    type="url"
                    value={cfWorkerUrl}
                    onChange={(e) => setCfWorkerUrl(e.target.value)}
                    placeholder="https://retailflow-worker.<your-subdomain>.workers.dev"
                    required
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your deployed Cloudflare Worker endpoint containing the backend sync API and executive dashboard web page.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Worker Security Bearer Token</label>
                    <input
                      type="password"
                      value={cfApiToken}
                      onChange={(e) => setCfApiToken(e.target.value)}
                      placeholder="e.g. rf_live_sec_token"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Store Identifier</label>
                    <input
                      type="text"
                      value={cfStoreId}
                      onChange={(e) => setCfStoreId(e.target.value)}
                      placeholder="store-kerala-01"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Real-time Background Sync</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Push sales & catalog every 30s</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={cfAutoSync}
                      onChange={(e) => setCfAutoSync(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Auto Cloud Backup</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Store snapshot on shift closure</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={cfAutoCloudBackup}
                      onChange={(e) => setCfAutoCloudBackup(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    <Save className="h-4 w-4" /> Save Cloudflare Config
                  </button>

                  <button
                    type="button"
                    onClick={handleTestCloudflareConnection}
                    disabled={cfTesting || !cfWorkerUrl}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${cfTesting ? "animate-spin" : ""}`} />
                    {cfTesting ? "Pinging Worker..." : "Test Connection"}
                  </button>
                </div>
              </form>

              {/* Cloud Operations & 1-Click Backup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <UploadCloud className="h-4 w-4 text-indigo-600" />
                    Instant Cloud Snapshot
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Package all products, customers, transactions, and settings into an encrypted cloud backup snapshot.
                  </p>
                  <button
                    type="button"
                    onClick={handleManualCloudBackup}
                    disabled={cfBackingUp || !cfWorkerUrl}
                    className="mt-2 w-full h-10 px-4 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
                  >
                    <UploadCloud className={`h-4 w-4 ${cfBackingUp ? "animate-spin text-amber-400" : ""}`} />
                    {cfBackingUp ? "Uploading to Cloudflare..." : "Backup to Cloudflare Now"}
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <RefreshCw className="h-4 w-4 text-emerald-600" />
                    Live Bi-Directional Sync
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Immediately sync sales to the Cloudflare Worker web page and pull any catalog updates.
                  </p>
                  <button
                    type="button"
                    onClick={handleManualSyncNow}
                    disabled={!cfWorkerUrl}
                    className="mt-2 w-full h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Push & Pull Sync Now
                  </button>
                </div>
              </div>

              {/* Cloudflare Remote Backups History & 1-Click Restore */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-600" /> Remote Cloudflare Backups (Point-in-Time Recovery)
                  </span>
                  <button
                    type="button"
                    onClick={loadRemoteBackups}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${cfLoadingBackups ? "animate-spin" : ""}`} /> Refresh
                  </button>
                </div>

                {cfRemoteBackups.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {cfRemoteBackups.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="overflow-hidden pr-3">
                          <p className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate text-[11px]">{item.filename}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(item.uploadedAt).toLocaleString()} • {Math.round(item.sizeBytes / 1024)} KB • Type: {item.backupType || "snapshot"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestoreCloudBackup(item.key, item.filename)}
                          disabled={cfRestoringId === item.key}
                          className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 shrink-0"
                        >
                          <DownloadCloud className="h-3.5 w-3.5" />
                          {cfRestoringId === item.key ? "Restoring..." : "Restore Snapshot"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {cfLoadingBackups ? "Loading remote snapshots..." : "No cloud backups found yet on your Cloudflare Worker."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: TAXATION & GST SETTINGS */}
          {/* ========================================================================= */}
          {activeTab === "tax" && (
            <form onSubmit={handleSaveTax} className="space-y-4 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Taxation & GST Settings</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Set default GST tax slab applied to new items</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Default GST Rate</label>
                <select
                  value={defaultGstRate}
                  onChange={(e) => setDefaultGstRate(e.target.value as GSTRate)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={GSTRate.ZERO}>0% (Exempt)</option>
                  <option value={GSTRate.FIVE}>5%</option>
                  <option value={GSTRate.TWELVE}>12%</option>
                  <option value={GSTRate.EIGHTEEN}>18% (Standard)</option>
                  <option value={GSTRate.TWENTY_EIGHT}>28%</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Tax Inclusive Pricing</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">When enabled, displayed prices already include GST</p>
                </div>
                <input
                  type="checkbox"
                  checked={inclusiveTax}
                  onChange={(e) => setInclusiveTax(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Save className="h-4 w-4" /> Save Tax Settings
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: POS & RECEIPT CUSTOMIZATIONS */}
          {/* ========================================================================= */}
          {activeTab === "pos" && (
            <form onSubmit={handleSavePOS} className="space-y-5 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">POS & Receipt Customizations</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Configure thermal printing templates, custom invoice prefix, receipt messages, and loyalty rewards
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Invoice & Receipt Paper Format</label>
                  <select
                    value={invoiceFormat}
                    onChange={(e) => setInvoiceFormat(e.target.value as InvoiceFormat)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={InvoiceFormat.THERMAL_80MM}>Thermal 80mm (Standard POS)</option>
                    <option value={InvoiceFormat.THERMAL_58MM}>Thermal 58mm (Compact Mobile)</option>
                    <option value={InvoiceFormat.A4}>A4 Full Page Invoice</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Custom Invoice Number Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="e.g. INV-2026-"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Receipt Header & Footer Texts */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="h-3.5 w-3.5 text-indigo-600" /> Receipt Custom Text Messages
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Receipt Greeting Header</label>
                  <input
                    type="text"
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    placeholder="Thank you for shopping with us!"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Receipt Terms / Return Policy Footer</label>
                  <textarea
                    rows={2}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="Goods once sold cannot be returned without original tax bill."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLogoOnReceipt}
                      onChange={(e) => setShowLogoOnReceipt(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    Print Store Logo
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQrOnReceipt}
                      onChange={(e) => setShowQrOnReceipt(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    Print Dynamic UPI QR
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCashierOnReceipt}
                      onChange={(e) => setShowCashierOnReceipt(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    Print Cashier Name
                  </label>
                </div>
              </div>

              {/* Loyalty Rules Customizer */}
              <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/40 space-y-3">
                <p className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Loyalty Points Program Rules
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Spend per 1 Loyalty Point (₹)</label>
                    <input
                      type="number"
                      min={10}
                      value={loyaltySpendPerPoint}
                      onChange={(e) => setLoyaltySpendPerPoint(e.target.value)}
                      placeholder="100"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Default: ₹100 spend = 1 point</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">1 Point Redemption Value (₹)</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={loyaltyPointValue}
                      onChange={(e) => setLoyaltyPointValue(e.target.value)}
                      placeholder="1.0"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Default: 1 point = ₹1.00 off</p>
                  </div>
                </div>
              </div>

              {/* Barcode & Scanner Toggles */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Auto-add by Barcode Scanner</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Immediately add item to cart on scanning without extra keystroke</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoAddBarcode}
                  onChange={(e) => setAutoAddBarcode(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Save className="h-4 w-4" /> Save POS & Receipt Settings
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: LOCAL DAY-END BACKUP & DIRECTORY */}
          {/* ========================================================================= */}
          {activeTab === "backup" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Local Day-End File Backups & Storage</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Configure local backup target directories, export full JSON archives, and manage store data lifecycle
                </p>
              </div>

              {/* Active Backup Folder Configuration */}
              <div className="border border-indigo-100 dark:border-indigo-900/60 p-5 rounded-2xl space-y-3 bg-indigo-50/50 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <FolderOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Active Backup Storage Folder
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectFolder}
                      className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
                    >
                      <FolderSync className="h-3.5 w-3.5" /> Change Folder
                    </button>
                    
                    {customBackupDir && (
                      <button
                        type="button"
                        onClick={handleResetFolder}
                        className="h-8 px-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold transition-all flex items-center gap-1"
                        title="Reset to default installation folder"
                      >
                        <RotateCcw className="h-3 w-3" /> Default
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-indigo-800 dark:text-indigo-300/90 leading-relaxed">
                  All automated Day-End shift closure backups and manual exports are written directly to this directory:
                </p>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/80 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all truncate">
                  {activeBackupPath}
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    {customBackupDir ? "Custom User Folder Selected" : "Application Installation Directory"}
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenExplorer}
                    className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <FolderOpen className="h-3 w-3" /> Open in File Explorer
                  </button>
                </div>
              </div>

              {/* Manual Backup Actions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Export Day-End Backup</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Save complete snapshot of products, sales, customers, accounts, and shifts.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <HardDriveDownload className="h-3.5 w-3.5 text-indigo-400" />
                    Download JSON
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Import / Restore</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Upload a previously exported JSON backup file to restore database.
                  </p>
                  <label className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
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
              <div className="border-2 border-rose-200 dark:border-rose-900/60 p-5 rounded-2xl space-y-3 bg-rose-50/30 dark:bg-rose-950/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-rose-600" />
                      Store Data Wipe & Factory Reset
                    </p>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400">
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
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" /> Recent Day-End Local Backups
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{backupHistory.length} recorded</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {backupHistory.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="overflow-hidden pr-2">
                          <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">{item.filename}</p>
                          <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString()} • {Math.round(item.sizeBytes / 1024)} KB</p>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full shrink-0">
                          Saved
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: LOCAL NETWORK & QR */}
          {/* ========================================================================= */}
          {activeTab === "network" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Local Network Web App Access & QR Code</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Connect tablets, phones, and wireless mobile registers across your local Wi-Fi router</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white rounded-2xl shadow-xl space-y-4">
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
                  className="w-full h-11 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <QrCode className="h-4 w-4 text-indigo-600" />
                  Open Local Network QR Code Modal
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 bg-slate-50/50 dark:bg-slate-950/40 text-xs text-slate-600 dark:text-slate-400">
                <p className="font-bold text-slate-800 dark:text-slate-200">Connection Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400">
                  <li>Host machine and mobile devices must be on the same Wi-Fi network.</li>
                  <li>Ensure Windows Firewall allows inbound connections on TCP port 3000.</li>
                  <li>Cashier PINs work seamlessly across all paired mobile devices.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: THEME & APPEARANCE */}
          {/* ========================================================================= */}
          {activeTab === "theme" && (
            <div className="space-y-4 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Appearance</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Select visual interface theme</p>
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
                      settings.theme === t.id
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{t.label}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: OFFLINE SYNC RESOLUTION */}
          {/* ========================================================================= */}
          {activeTab === "conflict" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Offline Sync Conflict Resolution Hub</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Review discrepancies between this register terminal and central cloud database
                </p>
              </div>

              <div className="space-y-3">
                {conflicts.map((conf) => (
                  <div key={conf.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {conf.entityType}: {conf.entityName}
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Conflict Detected
                      </span>
                    </div>

                    {/* Local Terminal Copy */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900 space-y-1">
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Local Terminal Copy</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{conf.localValue}</p>
                      <p className="text-[9px] text-slate-400">Updated: {new Date(conf.localTime).toLocaleString()}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setConflicts(conflicts.filter((c) => c.id !== conf.id));
                          triggerSaveNotification("Resolved: Kept Local terminal version!");
                        }}
                        className="mt-3 h-8 w-full bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all"
                      >
                        Keep Local Version
                      </button>
                    </div>

                    {/* Central Cloud Copy */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900 space-y-1">
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Central Cloud Server Copy</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{conf.serverValue}</p>
                      <p className="text-[9px] text-slate-400">Updated: {new Date(conf.serverTime).toLocaleString()}</p>
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
                  <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 font-medium text-xs bg-slate-50/20 dark:bg-slate-950/20">
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

      <CloudflareWizardModal
        isOpen={cfWizardOpen}
        onClose={() => setCfWizardOpen(false)}
        onSuccess={(url) => {
          setCfWorkerUrl(url);
          triggerSaveNotification("Cloudflare account connected & synchronized!");
        }}
      />
    </div>
  );
}
