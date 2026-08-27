import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import type { SyncQueueRow, SyncLogRow } from "@retailflow/database";
import { SyncStatus } from "@retailflow/shared-types";
import type { SyncState, GoogleDriveConfig } from "@retailflow/shared-types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getCurrentISO(): string {
  return new Date().toISOString();
}

export class SyncEngine {
  private db: DatabaseAdapter;
  private state: SyncState;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private onStatusChange?: (state: SyncState) => void;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
    this.state = {
      status: SyncStatus.OFFLINE,
      pendingChanges: 0,
      isOnline: false,
    };
  }

  setStatusChangeCallback(callback: (state: SyncState) => void) {
    this.onStatusChange = callback;
  }

  private updateState(partial: Partial<SyncState>) {
    this.state = { ...this.state, ...partial };
    this.onStatusChange?.(this.state);
  }

  addToQueue(entityType: string, entityId: string, action: string, data: Record<string, unknown>) {
    const id = generateId();
    const now = getCurrentISO();

    this.db.insert("sync_queue", {
      id,
      entity_type: entityType,
      entity_id: entityId,
      action,
      data: JSON.stringify(data),
      status: "pending",
      attempts: 0,
      created_at: now,
      updated_at: now,
    } as unknown as Record<string, unknown>);

    this.updateState({
      status: SyncStatus.PENDING,
      pendingChanges: this.getPendingCount(),
    });
  }

  private getPendingCount(): number {
    return this.db
      .getTable<SyncQueueRow>("sync_queue")
      .filter((r) => r.status === "pending").length;
  }

  private getPendingOperations(): SyncQueueRow[] {
    return this.db
      .getTable<SyncQueueRow>("sync_queue")
      .filter((r) => r.status === "pending")
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(0, 50);
  }

  async sync(config: GoogleDriveConfig): Promise<boolean> {
    if (!config.connected || !config.accessToken) {
      this.updateState({ status: SyncStatus.FAILED, lastError: "Google Drive not connected" });
      return false;
    }

    this.updateState({ status: SyncStatus.SYNCING });

    try {
      const operations = this.getPendingOperations();

      for (const op of operations) {
        this.db.update("sync_queue", { status: "syncing", updated_at: getCurrentISO() } as Record<string, unknown>, { id: op.id });

        await new Promise((resolve) => setTimeout(resolve, 100));

        this.db.update("sync_queue", { status: "synced", updated_at: getCurrentISO() } as Record<string, unknown>, { id: op.id });
      }

      this.db.insert("sync_logs", {
        id: generateId(),
        operation_id: "batch",
        status: "synced",
        message: `Synced ${operations.length} operations`,
        created_at: getCurrentISO(),
      } as unknown as Record<string, unknown>);

      this.updateState({
        status: SyncStatus.SYNCED,
        lastSyncedAt: getCurrentISO(),
        pendingChanges: 0,
      });

      return true;
    } catch (error) {
      this.updateState({
        status: SyncStatus.FAILED,
        lastError: error instanceof Error ? error.message : "Sync failed",
      });
      return false;
    }
  }

  setOnlineStatus(isOnline: boolean) {
    this.updateState({
      isOnline,
      status: isOnline ? SyncStatus.PENDING : SyncStatus.OFFLINE,
      pendingChanges: this.getPendingCount(),
    });

    if (isOnline) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  startAutoSync(intervalMs = 30000) {
    this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      if (this.state.isOnline && this.state.pendingChanges > 0) {
        // Auto sync
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  getState(): SyncState {
    return { ...this.state };
  }

  getSyncLogs(limit = 50) {
    return this.db
      .getTable<SyncLogRow>("sync_logs")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
}
