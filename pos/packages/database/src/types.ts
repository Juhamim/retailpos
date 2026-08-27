export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  pin?: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: number;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface BrandRow {
  id: string;
  name: string;
  description?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category_id: string;
  brand_id?: string;
  description?: string;
  image_url?: string;
  purchase_price: number;
  selling_price: number;
  gst_rate: string;
  discount_percent: number;
  stock_quantity: number;
  reorder_level: number;
  unit: string;
  status: string;
  is_weighable: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  barcode?: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryRow {
  id: string;
  product_id: string;
  quantity: number;
  reorder_level: number;
  last_restocked_at?: string;
  updated_at: string;
}

export interface InventoryTransactionRow {
  id: string;
  product_id: string;
  type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  reference_id?: string;
  user_id: string;
  created_at: string;
}

export interface CustomerRow {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  notes?: string;
  loyalty_points: number;
  credit_balance: number;
  total_spent: number;
  total_orders: number;
  last_purchase_at?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierRow {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  notes?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SaleRow {
  id: string;
  invoice_number: string;
  customer_id?: string;
  user_id: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItemRow {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  sale_id: string;
  method: string;
  amount: number;
  reference?: string;
  created_at: string;
}

export interface HeldSaleRow {
  id: string;
  sale_data: string;
  note?: string;
  user_id: string;
  created_at: string;
}

export interface ExpenseRow {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string;
  reference?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRow {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  device_info?: string;
  created_at: string;
}

export interface SyncQueueRow {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  data: string;
  status: string;
  attempts: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncLogRow {
  id: string;
  operation_id: string;
  status: string;
  message?: string;
  created_at: string;
}

export interface SettingsRow {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}
