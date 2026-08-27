export enum UserRole {
  OWNER = "owner",
  MANAGER = "manager",
  CASHIER = "cashier",
}

export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

export enum InventoryTransactionType {
  SALE = "sale",
  RETURN = "return",
  ADJUSTMENT = "adjustment",
  RESTOCK = "restock",
  DAMAGE = "damage",
  OPENING = "opening",
}

export enum PaymentMethod {
  CASH = "cash",
  UPI = "upi",
  CARD = "card",
  BANK_TRANSFER = "bank_transfer",
  CREDIT = "credit",
}

export enum ExpenseCategory {
  RENT = "rent",
  ELECTRICITY = "electricity",
  SALARY = "salary",
  TRANSPORTATION = "transportation",
  INVENTORY = "inventory",
  MAINTENANCE = "maintenance",
  MARKETING = "marketing",
  OTHER = "other",
}

export enum SyncStatus {
  SYNCED = "synced",
  SYNCING = "syncing",
  OFFLINE = "offline",
  PENDING = "pending",
  FAILED = "failed",
}

export enum AuditAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LOGIN = "login",
  LOGOUT = "logout",
  SALE_COMPLETED = "sale_completed",
  SALE_CANCELED = "sale_canceled",
  REFUND = "refund",
  STOCK_ADJUSTMENT = "stock_adjustment",
  SETTINGS_CHANGED = "settings_changed",
  BACKUP_RESTORED = "backup_restored",
  SYNC_FAILED = "sync_failed",
}

export enum SaleStatus {
  COMPLETED = "completed",
  CANCELED = "canceled",
  RETURNED = "returned",
  HELD = "held",
}

export enum GSTRate {
  ZERO = "0",
  FIVE = "5",
  TWELVE = "12",
  EIGHTEEN = "18",
  TWENTY_EIGHT = "28",
}

export enum InvoiceFormat {
  THERMAL_58MM = "thermal_58mm",
  THERMAL_80MM = "thermal_80mm",
  A4 = "a4",
}
