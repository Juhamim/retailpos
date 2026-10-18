/**
 * RetailFlow Cloudflare Sync Service
 * Orchestrates real-time multi-terminal replication between local registers
 * (EXE and Web) and the central Cloudflare D1 distributed SQLite database.
 */

import { CloudflareClient, CentralMutation } from "./cloudflare-client";
import { useSettingsStore } from "@/stores/settings-store";
import { useAppStore } from "@/stores/app-store";
import { useProductStore } from "@/stores/product-store";
import { useCustomerStore } from "@/stores/customer-store";
import { SyncStatus } from "@retailflow/shared-types";

class CloudflareSyncService {
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private terminalId = "";

  constructor() {
    if (typeof window !== "undefined") {
      let tid = localStorage.getItem("rf_terminal_id");
      if (!tid) {
        const isExe = typeof window !== "undefined" && ("__TAURI__" in window || "__TAURI_METADATA__" in window);
        tid = isExe ? `counter-exe-${Math.random().toString(36).substring(2, 6)}` : `counter-web-${Math.random().toString(36).substring(2, 6)}`;
        localStorage.setItem("rf_terminal_id", tid);
      }
      this.terminalId = tid;
    }
  }

  public getTerminalId(): string {
    return this.terminalId;
  }

  private getClient(): CloudflareClient | null {
    const cf = useSettingsStore.getState().settings.cloudflare;
    if (!cf || !cf.workerUrl) return null;
    return new CloudflareClient({
      workerUrl: cf.workerUrl,
      apiToken: cf.apiToken || "",
      storeId: cf.storeId || "store-primary",
    });
  }

  /**
   * Pushes a completed sale immediately to Cloudflare D1
   */
  async pushSaleNow(sale: any): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    const cf = useSettingsStore.getState().settings.cloudflare;
    if (!cf?.autoSync) return false;

    try {
      useAppStore.getState().setSyncStatus(SyncStatus.SYNCING);
      await client.pushSync({
        storeId: cf.storeId || "store-primary",
        terminalId: this.terminalId,
        operations: [
          {
            id: `sale-${sale.id || sale.invoiceNumber}-${Date.now()}`,
            entityType: "Sale",
            entityId: sale.id || sale.invoiceNumber,
            action: "INSERT",
            data: sale,
            timestamp: new Date().toISOString(),
          },
        ],
      });
      useAppStore.getState().setSyncStatus(SyncStatus.SYNCED);
      useAppStore.getState().setLastSyncedAt(new Date().toISOString());
      return true;
    } catch (err) {
      console.warn("Immediate sale push warning:", err);
      useAppStore.getState().setSyncStatus(SyncStatus.PENDING);
      return false;
    }
  }

  /**
   * Applies incoming remote mutations from central Cloudflare D1
   */
  private applyRemoteMutations(mutations: CentralMutation[]): number {
    let appliedCount = 0;

    for (const mutation of mutations) {
      // Avoid re-applying mutations originated by this terminal
      if (mutation.terminalId === this.terminalId) {
        continue;
      }

      try {
        if (mutation.entityType === "Sale") {
          // 1. Decrement local stock for sale registered on other counter
          if (Array.isArray(mutation.data?.items)) {
            const itemsToDeduct = mutation.data.items
              .filter((it: any) => it.productId && it.quantity > 0)
              .map((it: any) => ({
                productId: it.productId,
                quantity: it.quantity,
              }));

            if (itemsToDeduct.length > 0) {
              useProductStore.getState().deductStockForSale(itemsToDeduct);
              appliedCount++;
            }
          }

          // 2. Update customer credit ledger if credit sale registered on other counter
          if (
            mutation.data?.customerId &&
            (mutation.data?.paymentMethod === "CREDIT" || mutation.data?.paymentMethod === "KHATA")
          ) {
            useCustomerStore.getState().recordCreditTransaction(
              mutation.data.customerId,
              "charge",
              mutation.data.totalAmount || 0,
              "CREDIT",
              `Sale ${mutation.data.invoiceNumber || ""} at ${mutation.terminalId}`
            );
            appliedCount++;
          }
        } else if (mutation.entityType === "Product" && mutation.data?.id) {
          useProductStore.getState().updateProduct(mutation.data.id, mutation.data);
          appliedCount++;
        }
      } catch (err) {
        console.warn("Failed to apply remote mutation:", err);
      }
    }

    return appliedCount;
  }

  /**
   * Performs full bi-directional sync cycle with central Cloudflare D1
   */
  async syncCycle(): Promise<boolean> {
    if (this.isSyncing) return false;
    const client = this.getClient();
    if (!client) return false;

    const cf = useSettingsStore.getState().settings.cloudflare;
    if (!cf?.autoSync) return false;

    this.isSyncing = true;
    useAppStore.getState().setSyncStatus(SyncStatus.SYNCING);

    try {
      // 1. Get last sequence id from local storage
      const lastSeq = typeof window !== "undefined"
        ? parseInt(localStorage.getItem("rf_d1_last_sequence_id") || "0", 10)
        : 0;

      // 2. Pull central updates
      const pullRes = await client.pullSync(lastSeq);

      if (pullRes.mutations && pullRes.mutations.length > 0) {
        this.applyRemoteMutations(pullRes.mutations);
      }

      if (pullRes.latestSequenceId && typeof window !== "undefined") {
        localStorage.setItem("rf_d1_last_sequence_id", pullRes.latestSequenceId.toString());
      }

      // 3. Mark synced
      const now = new Date().toISOString();
      useSettingsStore.getState().updateCloudflareSettings({ lastSyncedAt: now });
      useAppStore.getState().setSyncStatus(SyncStatus.SYNCED);
      useAppStore.getState().setLastSyncedAt(now);
      this.isSyncing = false;
      return true;
    } catch (err) {
      console.warn("Cloudflare D1 sync error:", err);
      useAppStore.getState().setSyncStatus(SyncStatus.FAILED);
      this.isSyncing = false;
      return false;
    }
  }

  /**
   * Manual 1-click sync trigger from header or settings
   */
  async syncNow(): Promise<{
    success: boolean;
    pushedSales: number;
    pulledMutations: number;
    pulledProducts: number;
    error?: string;
  }> {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        pushedSales: 0,
        pulledMutations: 0,
        pulledProducts: 0,
        error: "Cloudflare Worker URL is not configured.",
      };
    }

    const cf = useSettingsStore.getState().settings.cloudflare;
    this.isSyncing = true;
    useAppStore.getState().setSyncStatus(SyncStatus.SYNCING);

    try {
      // 1. Gather recent local sales to push
      let pushedSales = 0;
      try {
        const rawSales = typeof window !== "undefined" ? localStorage.getItem("rf-sales-store") : null;
        if (rawSales) {
          const parsed = JSON.parse(rawSales);
          const salesList = (parsed.state?.sales || parsed.sales || []).slice(-15);
          if (salesList.length > 0) {
            const pushRes = await client.pushSync({
              storeId: cf?.storeId || "store-primary",
              terminalId: this.terminalId,
              operations: salesList.map((s: any) => ({
                id: `sync-${s.id || s.invoiceNumber}`,
                entityType: "Sale",
                entityId: s.id || s.invoiceNumber,
                action: "INSERT",
                data: s,
                timestamp: s.createdAt || new Date().toISOString(),
              })),
            });
            pushedSales = pushRes.syncedCount || salesList.length;
          }
        }
      } catch (pushErr) {
        console.warn("Push error during syncNow:", pushErr);
      }

      // 2. Pull incremental updates from central D1
      const lastSeq = typeof window !== "undefined"
        ? parseInt(localStorage.getItem("rf_d1_last_sequence_id") || "0", 10)
        : 0;

      const pullRes = await client.pullSync(lastSeq);
      let pulledMutations = 0;

      if (pullRes.mutations && pullRes.mutations.length > 0) {
        pulledMutations = this.applyRemoteMutations(pullRes.mutations);
      }

      if (pullRes.latestSequenceId && typeof window !== "undefined") {
        localStorage.setItem("rf_d1_last_sequence_id", pullRes.latestSequenceId.toString());
      }

      const now = new Date().toISOString();
      useSettingsStore.getState().updateCloudflareSettings({ lastSyncedAt: now });
      useAppStore.getState().setSyncStatus(SyncStatus.SYNCED);
      useAppStore.getState().setLastSyncedAt(now);
      this.isSyncing = false;

      return { success: true, pushedSales, pulledMutations, pulledProducts: pulledMutations };
    } catch (err: any) {
      this.isSyncing = false;
      useAppStore.getState().setSyncStatus(SyncStatus.FAILED);
      return {
        success: false,
        pushedSales: 0,
        pulledMutations: 0,
        pulledProducts: 0,
        error: err.message || "Sync failed",
      };
    }
  }

  /**
   * Starts periodic background synchronization (every 25 seconds)
   */
  start(intervalMs = 25000) {
    this.stop();
    this.intervalTimer = setInterval(() => {
      if (typeof window !== "undefined" && navigator.onLine) {
        this.syncCycle().catch(() => {});
      }
    }, intervalMs);
  }

  /**
   * Stops background synchronization
   */
  stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
}

export const cloudflareSyncService = new CloudflareSyncService();
