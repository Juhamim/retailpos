import { User, UserRole, ROLE_PERMISSIONS } from "@retailflow/shared-types";
import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import type { UserRow } from "@retailflow/database";

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    pin: row.pin,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role as UserRole,
    isActive: Boolean(row.is_active),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class AuthService {
  private currentUser: User | null = null;
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  async login(username: string, password: string): Promise<AuthResult> {
    const row = this.db
      .getTable<UserRow>("users")
      .find((u) => u.username === username);

    if (!row) {
      return { success: false, error: "User not found" };
    }

    if (!row.is_active) {
      return { success: false, error: "Account is deactivated" };
    }

    this.currentUser = mapUserRow(row);

    this.db.update(
      "users",
      { last_login_at: new Date().toISOString() },
      { id: row.id }
    );

    return { success: true, user: this.currentUser };
  }

  async loginWithPin(pin: string): Promise<AuthResult> {
    const row = this.db
      .getTable<UserRow>("users")
      .find((u) => u.pin === pin);

    if (!row) {
      return { success: false, error: "Invalid PIN" };
    }

    this.currentUser = mapUserRow(row);
    return { success: true, user: this.currentUser };
  }

  logout() {
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    const permissions = ROLE_PERMISSIONS[this.currentUser.role] || [];
    return permissions.includes(permission);
  }
}