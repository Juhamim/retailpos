import { UserRole } from "./enums";

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  pin?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.OWNER]: [
    "dashboard.view",
    "pos.access",
    "products.manage",
    "inventory.manage",
    "customers.manage",
    "suppliers.manage",
    "employees.manage",
    "reports.view_all",
    "expenses.manage",
    "settings.manage",
    "sync.manage",
    "backup.manage",
    "audit.view",
  ],
  [UserRole.MANAGER]: [
    "dashboard.view",
    "pos.access",
    "products.manage",
    "inventory.manage",
    "customers.manage",
    "suppliers.view",
    "reports.view_limited",
    "expenses.view",
  ],
  [UserRole.CASHIER]: [
    "pos.access",
    "products.view",
    "customers.view",
    "pos.process_returns",
  ],
};
