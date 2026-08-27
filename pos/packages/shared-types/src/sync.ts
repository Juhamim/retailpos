import { SyncStatus } from "./enums";

export interface SyncOperation {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  data: string;
  status: SyncStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncLog {
  id: string;
  operationId: string;
  status: SyncStatus;
  message?: string;
  createdAt: string;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: string;
  pendingChanges: number;
  lastError?: string;
  isOnline: boolean;
}

export interface GoogleDriveConfig {
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  folderId?: string;
  folderName?: string;
  lastBackupAt?: string;
}
