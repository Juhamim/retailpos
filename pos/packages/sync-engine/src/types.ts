import { SyncOperation, SyncStatus, GoogleDriveConfig, SyncState } from "@retailflow/shared-types";

export interface SyncEngineInterface {
  addToQueue(entityType: string, entityId: string, action: string, data: Record<string, unknown>): void;
  sync(config: GoogleDriveConfig): Promise<boolean>;
  setOnlineStatus(isOnline: boolean): void;
  getState(): SyncState;
  getSyncLogs(limit?: number): unknown[];
}
