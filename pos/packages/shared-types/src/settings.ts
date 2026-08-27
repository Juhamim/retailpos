import { GSTRate, InvoiceFormat } from "./enums";

export interface ShopSettings {
  shopName: string;
  logo?: string;
  address: string;
  phone: string;
  email?: string;
  gstNumber?: string;
  currency: string;
  currencySymbol: string;
}

export interface TaxSettings {
  defaultGstRate: GSTRate;
  inclusiveTax: boolean;
}

export interface POSSettings {
  defaultCustomerId?: string;
  invoiceFormat: InvoiceFormat;
  printerName?: string;
  autoAddBarcode: boolean;
  holdSaleOnBackspace: boolean;
  showProductImages: boolean;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupIntervalMinutes: number;
  retentionDays: number;
}

export interface AppSettings {
  id: string;
  shop: ShopSettings;
  tax: TaxSettings;
  pos: POSSettings;
  backup: BackupSettings;
  theme: "light" | "dark" | "system";
  updatedAt: string;
}
