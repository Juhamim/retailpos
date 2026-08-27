import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import type { AuditLogRow } from "@retailflow/database";
import { generateId, getCurrentISO } from "./utils";

export class AuditService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  log(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: string;
  }) {
    const id = generateId();
    const now = getCurrentISO();
    const row: AuditLogRow = {
      id,
      user_id: data.userId,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId,
      details: data.details,
      created_at: now,
    };
    this.db.insert("audit_logs", row as unknown as Record<string, unknown>);
    return id;
  }

  getAll(options?: { userId?: string; action?: string; entityType?: string; limit?: number }) {
    let rows = this.db.getTable<AuditLogRow>("audit_logs");

    if (options?.userId) rows = rows.filter((r) => r.user_id === options.userId);
    if (options?.action) rows = rows.filter((r) => r.action === options.action);
    if (options?.entityType) rows = rows.filter((r) => r.entity_type === options.entityType);

    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (options?.limit) rows = rows.slice(0, options.limit);

    return rows;
  }
}
