import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import type { SettingsRow } from "@retailflow/database";
import { GSTRate, InvoiceFormat } from "@retailflow/shared-types";
import type { AppSettings, ShopSettings, TaxSettings, POSSettings, BackupSettings } from "@retailflow/shared-types";
import { getCurrentISO } from "./utils";

const DEFAULT_SETTINGS: AppSettings = {
  id: "default",
  shop: {
    shopName: "RetailFlow Shop",
    address: "",
    phone: "",
    currency: "INR",
    currencySymbol: "\u20B9",
  },
  tax: {
    defaultGstRate: GSTRate.EIGHTEEN,
    inclusiveTax: false,
    enableHsnSummary: true,
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
  theme: "system",
  updatedAt: "",
};

export class SettingsService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  get(): AppSettings {
    const row = this.db.getTable<SettingsRow>("settings").find((r) => r.key === "app");
    if (!row) return DEFAULT_SETTINGS;
    try {
      return JSON.parse(row.value) as AppSettings;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  save(data: Partial<AppSettings>) {
    const current = this.get();
    const updated: AppSettings = {
      ...current,
      ...data,
      shop: { ...current.shop, ...data.shop },
      tax: { ...current.tax, ...data.tax },
      pos: { ...current.pos, ...data.pos },
      backup: { ...current.backup, ...data.backup },
      updatedAt: getCurrentISO(),
    };

    const existing = this.db.getTable<SettingsRow>("settings").find((r) => r.key === "app");

    if (existing) {
      this.db.update("settings", { value: JSON.stringify(updated), updated_at: getCurrentISO() } as Record<string, unknown>, { key: "app" });
    } else {
      this.db.insert("settings", {
        id: "default",
        key: "app",
        value: JSON.stringify(updated),
        updated_at: getCurrentISO(),
      } as unknown as Record<string, unknown>);
    }

    return updated;
  }

  getShop(): ShopSettings { return this.get().shop; }
  saveShop(data: Partial<ShopSettings>) { return this.save({ shop: { ...this.get().shop, ...data } }); }
  getTax(): TaxSettings { return this.get().tax; }
  saveTax(data: Partial<TaxSettings>) { return this.save({ tax: { ...this.get().tax, ...data } }); }
  getPos(): POSSettings { return this.get().pos; }
  savePos(data: Partial<POSSettings>) { return this.save({ pos: { ...this.get().pos, ...data } }); }
  getBackup(): BackupSettings { return this.get().backup; }
  saveBackup(data: Partial<BackupSettings>) { return this.save({ backup: { ...this.get().backup, ...data } }); }
}
