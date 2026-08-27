import { AuditAction } from "./enums";

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  deviceInfo?: string;
  createdAt: string;
}

export interface AuditLogWithUser extends AuditLog {
  userName: string;
  userRole: string;
}
