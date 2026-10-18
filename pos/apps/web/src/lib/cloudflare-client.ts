/**
 * Cloudflare Worker API & Cloud Backup Client
 * Handles full database snapshots, restore, and live bi-directional sync
 */

import { useSettingsStore } from "@/stores/settings-store";

export interface CloudflareConfig {
  workerUrl: string;
  apiToken: string;
  storeId: string;
}

export interface RemoteBackupEntry {
  key: string;
  filename: string;
  uploadedAt: string;
  sizeBytes: number;
  backupType?: string;
  recordsCount?: number;
}

export interface CloudSnapshotMetadata {
  id: string;
  storeId: string;
  storeName: string;
  timestamp: string;
  sizeBytes: number;
  totalRecords: number;
  checksum?: string;
  uploadedBy?: string;
}

export interface CloudSnapshotPayload {
  metadata: CloudSnapshotMetadata;
  data: {
    products?: any[];
    categories?: any[];
    customers?: any[];
    sales?: any[];
    shifts?: any[];
    accounts?: any[];
    expenses?: any[];
    suppliers?: any[];
    purchases?: any[];
    settings?: any;
  };
}

export interface SyncPushPayload {
  storeId: string;
  terminalId?: string;
  operations: Array<{
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    data: any;
    timestamp: string;
  }>;
}

export interface CentralMutation {
  sequenceId: number;
  storeId: string;
  terminalId: string;
  entityType: string;
  entityId: string;
  action: string;
  data: any;
  timestamp: string;
}

export interface SyncPullResponse {
  success: boolean;
  timestamp: string;
  mutations?: CentralMutation[];
  latestSequenceId?: number;
  d1Active?: boolean;
  products?: any[];
  categories?: any[];
  settings?: any;
}

export class CloudflareClient {
  private config: CloudflareConfig;

  constructor(config: CloudflareConfig) {
    this.config = {
      ...config,
      workerUrl: (config.workerUrl || "").replace(/\/+$/, ""),
    };
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiToken.trim()}`,
      "X-Store-Id": this.config.storeId.trim(),
    };
  }

  /**
   * Tests connection and health of the Cloudflare Worker endpoint
   */
  async testConnection(): Promise<{ success: boolean; latencyMs?: number; message?: string; error?: string }> {
    if (!this.config.workerUrl) {
      return { success: false, error: "Cloudflare Worker URL is not configured." };
    }

    const start = Date.now();
    try {
      const res = await fetch(`${this.config.workerUrl}/api/health`, {
        method: "GET",
        headers: this.getHeaders(),
      });
      const latencyMs = Date.now() - start;

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          success: true,
          latencyMs,
          message: data.message || `Connected to Cloudflare Worker (${latencyMs}ms)`,
        };
      } else {
        const err = await res.text().catch(() => res.statusText);
        return {
          success: false,
          latencyMs,
          error: `Worker returned HTTP ${res.status}: ${err}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        error: err.message || "Failed to reach Cloudflare Worker. Check network connection.",
      };
    }
  }

  /**
   * Uploads a complete point-in-time database snapshot to Cloudflare
   */
  async uploadBackup(
    snapshot: CloudSnapshotPayload,
    backupType = "manual_snapshot"
  ): Promise<{ success: boolean; snapshotId?: string; filename?: string; error?: string }> {
    if (!this.config.workerUrl) {
      return { success: false, error: "Cloudflare Worker URL not configured." };
    }

    try {
      const payload = {
        storeId: this.config.storeId,
        backupType,
        timestamp: new Date().toISOString(),
        snapshot,
      };

      const res = await fetch(`${this.config.workerUrl}/api/backup`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        return { success: false, error: `Upload failed: ${err}` };
      }

      const data = await res.json();
      return {
        success: true,
        snapshotId: data.key || snapshot.metadata.id,
        filename: data.filename || `backup_${snapshot.metadata.id}.json`,
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Error connecting to Cloudflare Worker." };
    }
  }

  /**
   * Retrieves list of available cloud snapshots from Cloudflare
   */
  async listBackups(): Promise<{ success: boolean; data?: RemoteBackupEntry[]; error?: string }> {
    if (!this.config.workerUrl) return { success: false, error: "No Worker URL", data: [] };

    try {
      const res = await fetch(
        `${this.config.workerUrl}/api/backup?storeId=${encodeURIComponent(this.config.storeId)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}`, data: [] };
      }

      const data = await res.json();
      const rawList = Array.isArray(data.backups) ? data.backups : [];
      const formatted: RemoteBackupEntry[] = rawList.map((b: any) => ({
        key: b.key || b.id,
        filename: b.filename || b.id,
        uploadedAt: b.uploadedAt || b.timestamp,
        sizeBytes: b.sizeBytes || 0,
        backupType: b.backupType || "snapshot",
        recordsCount: b.recordsCount || 0,
      }));

      return { success: true, data: formatted };
    } catch (err: any) {
      return { success: false, error: err.message, data: [] };
    }
  }

  /**
   * Downloads a specific snapshot from Cloudflare for restoration
   */
  async downloadBackup(key: string): Promise<{ success: boolean; snapshot?: any; error?: string }> {
    if (!this.config.workerUrl) return { success: false, error: "No Worker URL" };

    try {
      const res = await fetch(
        `${this.config.workerUrl}/api/backup?key=${encodeURIComponent(key)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!res.ok) {
        return { success: false, error: `Download failed (${res.status}): ${res.statusText}` };
      }

      const data = await res.json();
      return { success: true, snapshot: data.backup || data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Pushes batched changes from local terminal to Cloudflare Worker
   */
  async pushSync(payload: SyncPushPayload): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (!this.config.workerUrl) return { success: false, syncedCount: 0 };

    try {
      const res = await fetch(`${this.config.workerUrl}/api/sync/push`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return { success: false, syncedCount: 0, error: `Push failed: ${res.statusText}` };
      }

      const data = await res.json();
      return {
        success: true,
        syncedCount: data.syncedCount || payload.operations.length,
      };
    } catch (err: any) {
      return { success: false, syncedCount: 0, error: err.message };
    }
  }

  /**
   * Pulls incremental delta changes from central Cloudflare D1 mutation journal
   */
  async pullSync(sinceParam?: string | number): Promise<SyncPullResponse> {
    if (!this.config.workerUrl) return { success: false, timestamp: new Date().toISOString() };

    let url = `${this.config.workerUrl}/api/sync/pull?storeId=${encodeURIComponent(this.config.storeId)}`;
    if (typeof sinceParam === "number") {
      url += `&sinceSequenceId=${sinceParam}`;
    } else if (sinceParam) {
      url += `&sinceSequenceId=${encodeURIComponent(sinceParam)}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Pull sync failed: ${res.statusText}`);
    }

    return await res.json();
  }
}

/**
 * Singleton proxy client that always uses active configuration from settings store
 */
function getActiveClient(): CloudflareClient {
  const cf = useSettingsStore.getState().settings.cloudflare;
  return new CloudflareClient({
    workerUrl: cf?.workerUrl || "",
    apiToken: cf?.apiToken || "",
    storeId: cf?.storeId || "store-kerala-01",
  });
}

export const cloudflareClient = {
  testConnection: () => getActiveClient().testConnection(),
  uploadBackup: (snapshot: CloudSnapshotPayload, type?: string) => getActiveClient().uploadBackup(snapshot, type),
  listBackups: () => getActiveClient().listBackups(),
  downloadBackup: (key: string) => getActiveClient().downloadBackup(key),
  pushSync: (payload: SyncPushPayload) => getActiveClient().pushSync(payload),
  pullSync: (sinceTimestamp?: string) => getActiveClient().pullSync(sinceTimestamp),
};
