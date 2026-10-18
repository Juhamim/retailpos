import { GSTRate, InvoiceFormat } from "./enums";

export interface ShopSettings {
  shopName: string;
  legalTradeName?: string;
  logo?: string;
  address: string;
  phone: string;
  email?: string;
  gstNumber?: string;
  placeOfSupply?: string; // e.g. "32-Kerala"
  upiId?: string;         // e.g. "merchant@okaxis" or "9876543210@paytm"
  currency: string;
  currencySymbol: string;
}

export interface TaxSettings {
  defaultGstRate: GSTRate;
  inclusiveTax: boolean;
  enableHsnSummary: boolean;
}

export interface POSSettings {
  defaultCustomerId?: string;
  invoiceFormat: InvoiceFormat;
  invoicePrefix?: string; // e.g. "INV-2026-"
  printerName?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  showQrOnReceipt?: boolean;
  showCashierOnReceipt?: boolean;
  loyaltySpendPerPoint?: number; // e.g. 100 (₹100 = 1 point)
  loyaltyPointValue?: number;     // e.g. 1.0 (1 point = ₹1)
  allowDiscounts?: boolean;
  allowCustomPrice?: boolean;
  autoPrintReceipt?: boolean;
  showLogoOnReceipt?: boolean;
  autoAddBarcode: boolean;
  holdSaleOnBackspace: boolean;
  showProductImages: boolean;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupIntervalMinutes: number;
  retentionDays: number;
  customBackupDirectory?: string;
}

export interface CloudflareSettings {
  workerUrl: string;
  apiToken: string;
  storeId: string;
  autoSync: boolean;
  syncIntervalSeconds: number;
  autoCloudBackup: boolean;
  lastSyncedAt?: string;
  lastBackupAt?: string;
}

export interface GoogleSheetsSettings {
  enabled: boolean;
  webhookUrl: string;       // Google Apps Script Web App URL
  spreadsheetUrl?: string;   // Direct view link to the Google Sheet
  autoSyncSales: boolean;    // Auto-append sale row on completed checkout
  autoSyncInventory: boolean;// Update inventory live tab
  autoSyncShifts: boolean;   // Append shift reconciliation row on close
  lastSyncedAt?: string;
  pendingCount?: number;
}

export interface AppSettings {
  id: string;
  isSetupCompleted?: boolean;
  shop: ShopSettings;
  tax: TaxSettings;
  pos: POSSettings;
  backup: BackupSettings;
  cloudflare?: CloudflareSettings;
  googleSheets?: GoogleSheetsSettings;
  theme: "light" | "dark" | "system";
  updatedAt: string;
}

