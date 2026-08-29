/**
 * RetailFlow POS - Day-End Local File Backup & Archiving Engine
 */

import { useSettingsStore } from "@/stores/settings-store";

export interface DayEndBackupPayload {
  system: string;
  version: string;
  backupType: "day_end_shift_closure" | "manual_export";
  timestamp: string;
  date: string;
  device: string;
  shop: {
    shopName?: string;
    address?: string;
    phone?: string;
    gstNumber?: string;
  };
  summary: {
    totalSalesCount: number;
    totalRevenue: number;
    closedShiftId?: string;
    cashierName?: string;
  };
  stores: Record<string, any>;
}

export const BACKUP_STORE_KEYS = [
  "retailflow-sales-storage",
  "retailflow-products-storage",
  "retailflow-customers-storage",
  "retailflow-shift-storage",
  "retailflow-expenses-storage",
  "retailflow-suppliers-storage",
  "retailflow-purchases-storage",
  "retailflow-returns-storage",
  "retailflow-settings-storage",
  "retailflow-auth-storage",
  "retailflow-giftcard-storage",
  "retailflow-inventory-audit-storage",
  "retailflow-account-storage",
  "rf-app-store",
];

/**
 * Creates and exports a full Day-End snapshot to local file
 */
export async function createDayEndBackup(options?: {
  shiftId?: string;
  cashierName?: string;
  backupType?: "day_end_shift_closure" | "manual_export";
  targetDir?: string;
}): Promise<{ success: boolean; filename: string; filePath?: string; error?: string }> {
  try {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const filename = `RetailFlow_DayEnd_Backup_${dateStr}_${timeStr}.json`;

    // 1. Collect all store data
    const storesData: Record<string, any> = {};
    let totalSalesCount = 0;
    let totalRevenue = 0;
    let shopInfo = {};

    for (const key of BACKUP_STORE_KEYS) {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            storesData[key] = parsed;

            if (key === "retailflow-sales-storage" && parsed.state?.sales) {
              totalSalesCount = parsed.state.sales.length;
              totalRevenue = parsed.state.sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
            }
            if (key === "retailflow-settings-storage" && parsed.state?.settings?.shop) {
              shopInfo = parsed.state.settings.shop;
            }
          } catch (e) {
            storesData[key] = raw;
          }
        }
      }
    }

    const payload: DayEndBackupPayload = {
      system: "RetailFlow POS",
      version: "1.0.0",
      backupType: options?.backupType || "day_end_shift_closure",
      timestamp: now.toISOString(),
      date: dateStr,
      device: typeof window !== "undefined" && (window as any).__TAURI__ ? "RetailFlow Desktop Terminal" : "RetailFlow Web Terminal",
      shop: shopInfo,
      summary: {
        totalSalesCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        closedShiftId: options?.shiftId,
        cashierName: options?.cashierName,
      },
      stores: storesData,
    };

    const jsonString = JSON.stringify(payload, null, 2);
    let savedNativePath: string | undefined;

    // 2. Resolve target backup directory from options or settings
    const settingsBackupDir = useSettingsStore.getState().settings.backup?.customBackupDirectory;
    const targetCustomDir = options?.targetDir || settingsBackupDir || undefined;

    // 3. If in Tauri desktop, save to local native filesystem
    if (typeof window !== "undefined" && (window as any).__TAURI__) {
      try {
        const { invoke } = await import("@tauri-apps/api/tauri");
        savedNativePath = await invoke<string>("save_dayend_backup", {
          filename,
          content: jsonString,
          customDir: targetCustomDir,
        });
      } catch (tauriErr) {
        console.warn("Tauri native day-end save notice:", tauriErr);
      }
    }

    // 4. Trigger browser download as reliable local file fallback
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Save recent backup entry to history
    saveBackupHistoryRecord({
      filename,
      timestamp: now.toISOString(),
      sizeBytes: jsonString.length,
      shiftId: options?.shiftId,
      path: savedNativePath || targetCustomDir,
    });

    return {
      success: true,
      filename,
      filePath: savedNativePath,
    };
  } catch (err: any) {
    console.error("Day-End Backup Error:", err);
    return {
      success: false,
      filename: "",
      error: err.message || String(err),
    };
  }
}

export interface BackupHistoryEntry {
  filename: string;
  timestamp: string;
  sizeBytes: number;
  shiftId?: string;
  path?: string;
}

const BACKUP_HISTORY_KEY = "retailflow_dayend_backups_history";

export function getBackupHistory(): BackupHistoryEntry[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBackupHistoryRecord(entry: BackupHistoryEntry) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const existing = getBackupHistory();
    const updated = [entry, ...existing.filter((e) => e.filename !== entry.filename)].slice(0, 30);
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not save backup history:", err);
  }
}

/**
 * Returns the active backup folder path where files are written
 */
export async function getActiveBackupPath(): Promise<string> {
  const custom = useSettingsStore.getState().settings.backup?.customBackupDirectory;
  if (custom && custom.trim().length > 0) {
    return custom.trim();
  }
  if (typeof window !== "undefined" && (window as any).__TAURI__) {
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      return await invoke<string>("get_backups_directory_path");
    } catch {
      return "Installation Folder: RetailFlow POS\\backups";
    }
  }
  return "Downloads / Local Browser Storage";
}

/**
 * Interactive directory picker dialog
 */
export async function selectBackupFolder(): Promise<string | null> {
  if (typeof window !== "undefined" && (window as any).__TAURI__) {
    try {
      const { open } = await import("@tauri-apps/api/dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Day-End Backup Storage Folder",
      });
      if (typeof selected === "string") {
        return selected;
      }
      return null;
    } catch (e) {
      console.warn("Tauri dialog open notice:", e);
    }
  }

  // Web API fallback
  if (typeof window !== "undefined" && (window as any).showDirectoryPicker) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      if (dirHandle && dirHandle.name) {
        return `Selected Folder: ${dirHandle.name}`;
      }
    } catch (e) {
      // User cancelled
    }
  }

  return null;
}

/**
 * Opens a specific folder or default installation folder in Windows File Explorer
 */
export async function openSpecificFolderInExplorer(folderPath?: string): Promise<boolean> {
  if (typeof window !== "undefined" && (window as any).__TAURI__) {
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      if (folderPath && folderPath.trim()) {
        return await invoke<boolean>("open_specific_folder", { folderPath: folderPath.trim() });
      }
      return await invoke<boolean>("open_backups_folder");
    } catch (e) {
      console.warn("Failed to open backup folder:", e);
      return false;
    }
  }
  return false;
}

export async function openBackupsFolderInExplorer(): Promise<boolean> {
  const custom = useSettingsStore.getState().settings.backup?.customBackupDirectory;
  return openSpecificFolderInExplorer(custom);
}
