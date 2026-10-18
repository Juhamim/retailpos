import { cloudflareClient, CloudSnapshotPayload } from "./cloudflare-client";
import { useSettingsStore } from "@/stores/settings-store";

/**
 * Gathers complete local database snapshot from browser / local storage
 */
export function createLocalDatabaseSnapshot(): CloudSnapshotPayload {
  const settingsState = useSettingsStore.getState();
  const shop = settingsState.settings.shop;
  const storeId = settingsState.settings.cloudflare?.storeId || "store-kerala-01";

  // Gather raw JSON data from all known stores
  const getParsed = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.state || parsed;
    } catch {
      return null;
    }
  };

  const productStore = getParsed("rf-product-store") || {};
  const customerStore = getParsed("rf-customer-store") || {};
  const salesStore = getParsed("rf-sales-store") || {};
  const shiftStore = getParsed("rf-shift-store") || {};
  const accountStore = getParsed("rf-account-store") || {};
  const expenseStore = getParsed("rf-expense-store") || {};
  const supplierStore = getParsed("rf-supplier-store") || {};
  const purchaseStore = getParsed("rf-purchase-store") || {};

  const products = productStore.products || [];
  const categories = productStore.categories || [];
  const customers = customerStore.customers || [];
  const sales = salesStore.sales || [];
  const shifts = shiftStore.shifts || [];
  const accounts = accountStore.accounts || [];
  const expenses = expenseStore.expenses || [];
  const suppliers = supplierStore.suppliers || [];
  const purchases = purchaseStore.purchases || [];

  const totalRecords =
    products.length +
    customers.length +
    sales.length +
    shifts.length +
    expenses.length +
    purchases.length;

  const id = `snap-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    metadata: {
      id,
      storeId,
      storeName: shop.shopName || "RetailFlow Mart",
      timestamp: new Date().toISOString(),
      sizeBytes: 0,
      totalRecords,
    },
    data: {
      products,
      categories,
      customers,
      sales,
      shifts,
      accounts,
      expenses,
      suppliers,
      purchases,
      settings: settingsState.settings,
    },
  };
}

/**
 * Restores local database registers from downloaded snapshot object
 */
export function restoreFromSnapshotData(snapshot: any): { success: boolean; restoredStores: string[]; error?: string } {
  if (!snapshot) return { success: false, restoredStores: [], error: "Empty snapshot payload" };

  const payloadData = snapshot.data || snapshot.snapshot?.data || snapshot;
  const restored: string[] = [];

  const setStoreItem = (key: string, val: any) => {
    try {
      localStorage.setItem(key, JSON.stringify({ state: val, version: 0 }));
      restored.push(key);
    } catch (e) {
      console.error("Failed to restore storage key:", key, e);
    }
  };

  if (payloadData.products || payloadData.categories) {
    setStoreItem("rf-product-store", {
      products: payloadData.products || [],
      categories: payloadData.categories || [],
    });
  }
  if (payloadData.customers) {
    setStoreItem("rf-customer-store", { customers: payloadData.customers });
  }
  if (payloadData.sales) {
    setStoreItem("rf-sales-store", { sales: payloadData.sales });
  }
  if (payloadData.shifts) {
    setStoreItem("rf-shift-store", { shifts: payloadData.shifts });
  }
  if (payloadData.accounts) {
    setStoreItem("rf-account-store", { accounts: payloadData.accounts });
  }
  if (payloadData.expenses) {
    setStoreItem("rf-expense-store", { expenses: payloadData.expenses });
  }
  if (payloadData.suppliers) {
    setStoreItem("rf-supplier-store", { suppliers: payloadData.suppliers });
  }
  if (payloadData.purchases) {
    setStoreItem("rf-purchase-store", { purchases: payloadData.purchases });
  }
  if (payloadData.settings) {
    setStoreItem("retailflow-settings-storage", { state: { settings: payloadData.settings } });
  }

  return { success: true, restoredStores: restored };
}

export const cloudflareBackupService = {
  /**
   * Compiles local database snapshot and uploads to Cloudflare Worker
   */
  async createCloudBackup(backupType = "manual_snapshot"): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
      const snapshot = createLocalDatabaseSnapshot();
      const res = await cloudflareClient.uploadBackup(snapshot, backupType);

      if (res.success) {
        useSettingsStore.getState().updateCloudflareSettings({
          lastBackupAt: new Date().toISOString(),
        });
        return { success: true, filename: res.filename || `backup_${snapshot.metadata.id}.json` };
      } else {
        return { success: false, error: res.error || "Upload failed." };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create cloud backup." };
    }
  },

  /**
   * Downloads a remote backup by key and restores local store
   */
  async restoreCloudBackup(key: string): Promise<{ success: boolean; restoredStores: string[]; error?: string }> {
    try {
      const res = await cloudflareClient.downloadBackup(key);
      if (!res.success || !res.snapshot) {
        return { success: false, restoredStores: [], error: res.error || "Failed to download snapshot from Cloudflare." };
      }

      return restoreFromSnapshotData(res.snapshot);
    } catch (err: any) {
      return { success: false, restoredStores: [], error: err.message || "Failed to restore backup." };
    }
  },

  /**
   * Automated Day-End backup trigger (non-blocking)
   */
  async triggerDayEndCloudBackup(tag = "shift_closure"): Promise<void> {
    const cf = useSettingsStore.getState().settings.cloudflare;
    if (!cf?.workerUrl || !cf?.autoCloudBackup) {
      return; // Disabled or not configured
    }

    try {
      await this.createCloudBackup(`day_end_${tag}`);
    } catch (err) {
      console.warn("Background Cloudflare day-end backup failed:", err);
    }
  },
};
