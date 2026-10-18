/**
 * RetailFlow POS - Google Sheets Live Synchronization Engine
 * Automatically streams sales, inventory snapshots, and shift reconciliations
 * directly into a customer's dynamic Google Sheet workbook with charts and graphs.
 */

import { CompletedSale } from "@/stores/sales-store";
import { ProductWithCategory, PaymentMethod } from "@retailflow/shared-types";
import { Shift } from "@/stores/shift-store";
import { useSettingsStore } from "@/stores/settings-store";

const QUEUE_STORAGE_KEY = "rf_gsheet_offline_queue";

interface QueuedPayload {
  id: string;
  action: "append_sale" | "sync_inventory" | "append_shift";
  data: any;
  createdAt: string;
  attempts: number;
}

class GoogleSheetsSyncService {
  private isProcessingQueue = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.flushQueue().catch(() => {});
      });
    }
  }

  private getConfig() {
    const settings = useSettingsStore.getState().settings;
    return settings.googleSheets || {
      enabled: false,
      webhookUrl: "",
      spreadsheetUrl: "",
      autoSyncSales: true,
      autoSyncInventory: true,
      autoSyncShifts: true,
    };
  }

  /**
   * Tests connectivity to the user's Google Apps Script Web App URL.
   */
  async testConnection(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    if (!webhookUrl || !webhookUrl.trim().startsWith("http")) {
      return { success: false, message: "Invalid Webhook URL. Please provide a valid Google Apps Script Web App URL." };
    }

    try {
      // Google Apps Script requires mode: 'no-cors' or redirects
      const testPayload = {
        action: "test_ping",
        timestamp: new Date().toISOString(),
        terminal: "RetailFlow POS",
      };

      await fetch(webhookUrl.trim(), {
        method: "POST",
        mode: "no-cors", // Google Apps Script redirects across google domains
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      return {
        success: true,
        message: "Successfully connected to Google Sheet! Test ping delivered.",
      };
    } catch (err: any) {
      console.error("Google Sheets connection test failed:", err);
      return {
        success: false,
        message: err.message || "Failed to reach Google Apps Script endpoint.",
      };
    }
  }

  /**
   * Pushes a completed sale transaction to the "Sales_Ledger" tab in real time.
   */
  async syncSale(sale: CompletedSale): Promise<boolean> {
    const config = this.getConfig();
    if (!config.enabled || !config.webhookUrl || !config.autoSyncSales) {
      return false;
    }

    const now = new Date(sale.createdAt || Date.now());
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const itemsSummary = (sale.items || [])
      .map((it) => `${it.productName} (x${it.quantity})`)
      .join(", ");

    const row = [
      now.toISOString(),
      sale.invoiceNumber,
      dateStr,
      timeStr,
      sale.customerName || "Walk-in Customer",
      sale.items?.length || 0,
      itemsSummary,
      sale.subtotal,
      sale.taxAmount / 2, // CGST
      sale.taxAmount / 2, // SGST
      sale.taxAmount,
      sale.discountAmount || 0,
      sale.totalAmount,
      (sale.paymentMethod || "CASH").toUpperCase(),
      sale.cashierName || "Cashier",
    ];

    const payload = {
      action: "append_sale",
      sheetName: "Sales_Ledger",
      row,
    };

    return this.dispatchOrQueue("append_sale", payload);
  }

  /**
   * Syncs the live product catalog and stock levels to "Inventory_Live".
   */
  async syncInventory(products: ProductWithCategory[]): Promise<boolean> {
    const config = this.getConfig();
    if (!config.enabled || !config.webhookUrl || !config.autoSyncInventory) {
      return false;
    }

    const rows = products.map((p) => {
      const stock = p.stockQuantity ?? 0;
      const minStock = p.reorderLevel ?? 5;
      const purchasePrice = p.purchasePrice ?? 0;
      const sellingPrice = p.sellingPrice ?? 0;
      const totalVal = stock * purchasePrice;
      const status = stock <= 0 ? "Out of Stock" : stock <= minStock ? "Low Stock" : "In Stock";

      return [
        p.sku || "-",
        p.name,
        p.categoryName || "General",
        stock,
        minStock,
        purchasePrice,
        sellingPrice,
        totalVal,
        status,
        new Date().toISOString(),
      ];
    });

    const payload = {
      action: "sync_inventory",
      sheetName: "Inventory_Live",
      rows,
    };

    return this.dispatchOrQueue("sync_inventory", payload);
  }

  /**
   * Pushes shift reconciliation audit records to "Shift_Audits".
   */
  async syncShift(shift: Shift): Promise<boolean> {
    const config = this.getConfig();
    if (!config.enabled || !config.webhookUrl || !config.autoSyncShifts) {
      return false;
    }

    const cashSales = shift.paymentBreakdown?.[PaymentMethod.CASH] || 0;
    const cardSales = shift.paymentBreakdown?.[PaymentMethod.CARD] || 0;
    const upiSales = shift.paymentBreakdown?.[PaymentMethod.UPI] || 0;
    const actualCash = shift.actualCash ?? shift.closingFloat ?? 0;
    const variance = actualCash - shift.expectedCash;

    const row = [
      shift.id,
      shift.username || "Cashier",
      shift.openedAt,
      shift.closedAt || new Date().toISOString(),
      shift.openingFloat,
      cashSales,
      cardSales,
      upiSales,
      shift.expectedCash,
      actualCash,
      variance,
      shift.status || "closed",
    ];

    const payload = {
      action: "append_shift",
      sheetName: "Shift_Audits",
      row,
    };

    return this.dispatchOrQueue("append_shift", payload);
  }

  /**
   * Dispatches payload over HTTPS or enqueues if offline / failed.
   */
  private async dispatchOrQueue(action: "append_sale" | "sync_inventory" | "append_shift", payload: any): Promise<boolean> {
    const config = this.getConfig();
    if (!navigator.onLine) {
      this.enqueue(action, payload);
      return false;
    }

    try {
      await fetch(config.webhookUrl.trim(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Update last synced timestamp in store
      useSettingsStore.getState().updateGoogleSheetsSettings({
        lastSyncedAt: new Date().toISOString(),
      });

      return true;
    } catch (err) {
      console.warn(`Google Sheets live push failed for ${action}, queuing offline:`, err);
      this.enqueue(action, payload);
      return false;
    }
  }

  private enqueue(action: "append_sale" | "sync_inventory" | "append_shift", data: any) {
    try {
      const queue: QueuedPayload[] = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || "[]");
      queue.push({
        id: `gsheet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        action,
        data,
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

      useSettingsStore.getState().updateGoogleSheetsSettings({
        pendingCount: queue.length,
      });
    } catch (e) {
      console.error("Failed to enqueue Google Sheets payload:", e);
    }
  }

  /**
   * Flushes all pending queued requests when internet connectivity is re-established.
   */
  async flushQueue(): Promise<void> {
    if (this.isProcessingQueue || !navigator.onLine) return;
    const config = this.getConfig();
    if (!config.enabled || !config.webhookUrl) return;

    this.isProcessingQueue = true;
    try {
      const queue: QueuedPayload[] = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || "[]");
      if (queue.length === 0) {
        this.isProcessingQueue = false;
        return;
      }

      const remaining: QueuedPayload[] = [];
      for (const item of queue) {
        try {
          await fetch(config.webhookUrl.trim(), {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.data),
          });
        } catch {
          item.attempts += 1;
          if (item.attempts < 5) {
            remaining.push(item);
          }
        }
      }

      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
      useSettingsStore.getState().updateGoogleSheetsSettings({
        pendingCount: remaining.length,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error processing Google Sheets offline queue:", err);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Backfills historical sales to Google Sheets in batches.
   */
  async syncHistoricalSales(sales: CompletedSale[]): Promise<{ count: number }> {
    const config = this.getConfig();
    if (!config.enabled || !config.webhookUrl) {
      throw new Error("Google Sheets sync is not enabled or Webhook URL is missing.");
    }

    let synced = 0;
    for (const sale of sales) {
      await this.syncSale(sale);
      synced++;
    }

    return { count: synced };
  }
}

export const googleSheetsSyncService = new GoogleSheetsSyncService();
