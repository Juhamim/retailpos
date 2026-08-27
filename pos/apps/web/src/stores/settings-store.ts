import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, ShopSettings, TaxSettings, POSSettings, BackupSettings } from "@retailflow/shared-types";
import { GSTRate, InvoiceFormat } from "@retailflow/shared-types";

interface SettingsState {
  settings: AppSettings;
  updateShopSettings: (shop: Partial<ShopSettings>) => void;
  updateTaxSettings: (tax: Partial<TaxSettings>) => void;
  updatePOSSettings: (pos: Partial<POSSettings>) => void;
  updateBackupSettings: (backup: Partial<BackupSettings>) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  id: "app-settings-default",
  shop: {
    shopName: "RetailFlow Mart",
    address: "Shop #14, Ground Floor, Central Plaza, MG Road, Bangalore 560001",
    phone: "+91 98765 43210",
    email: "contact@retailflowmart.in",
    gstNumber: "29ABCDE1234F1Z5",
    currency: "INR",
    currencySymbol: "₹",
  },
  tax: {
    defaultGstRate: GSTRate.EIGHTEEN,
    inclusiveTax: false,
  },
  pos: {
    invoiceFormat: InvoiceFormat.THERMAL_80MM,
    autoAddBarcode: true,
    holdSaleOnBackspace: false,
    showProductImages: true,
  },
  backup: {
    autoBackup: true,
    backupIntervalMinutes: 60,
    retentionDays: 30,
  },
  theme: "light",
  updatedAt: new Date().toISOString(),
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateShopSettings: (shopUpdates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            shop: { ...state.settings.shop, ...shopUpdates },
            updatedAt: new Date().toISOString(),
          },
        })),

      updateTaxSettings: (taxUpdates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            tax: { ...state.settings.tax, ...taxUpdates },
            updatedAt: new Date().toISOString(),
          },
        })),

      updatePOSSettings: (posUpdates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            pos: { ...state.settings.pos, ...posUpdates },
            updatedAt: new Date().toISOString(),
          },
        })),

      updateBackupSettings: (backupUpdates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            backup: { ...state.settings.backup, ...backupUpdates },
            updatedAt: new Date().toISOString(),
          },
        })),

      setTheme: (theme) =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme,
            updatedAt: new Date().toISOString(),
          },
        })),
    }),
    {
      name: "retailflow-settings-storage",
    }
  )
);
