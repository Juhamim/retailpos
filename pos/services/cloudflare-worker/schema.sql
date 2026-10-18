-- ============================================================================
-- RetailFlow POS - Central Cloudflare D1 Distributed SQLite Database Schema
-- Provides multi-terminal real-time inventory, sales, customer khata, and delta sync
-- ============================================================================

-- Stores Registry
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_base64 TEXT,
    gstin TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    upi_id TEXT,
    currency_symbol TEXT DEFAULT '₹',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Retail Terminals (Counter 1 Desktop EXE, Counter 2 Web, Mobile Tablets)
CREATE TABLE IF NOT EXISTS terminals (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    terminal_type TEXT DEFAULT 'desktop_exe', -- 'desktop_exe' | 'web_browser' | 'mobile_pos'
    ip_address TEXT,
    last_ping DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Central Product Catalog & Live Multi-Counter Inventory
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    category_name TEXT,
    purchase_price REAL DEFAULT 0,
    selling_price REAL NOT NULL,
    gst_rate TEXT NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    unit TEXT DEFAULT 'pcs',
    status TEXT DEFAULT 'active',
    is_weighable BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Central Customers & Khata (Credit Ledger)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    tier TEXT DEFAULT 'Regular',
    credit_balance REAL DEFAULT 0,
    credit_limit REAL DEFAULT 5000,
    loyalty_points INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Consolidated Retail Sales
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    terminal_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id TEXT,
    customer_name TEXT,
    subtotal REAL NOT NULL,
    tax_amount REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    payments_json TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    cashier_name TEXT,
    shift_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    tax_rate REAL NOT NULL,
    tax_amount REAL NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Shift Management
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    terminal_id TEXT NOT NULL,
    cashier_name TEXT NOT NULL,
    opening_float REAL DEFAULT 0,
    expected_cash REAL DEFAULT 0,
    actual_cash REAL DEFAULT 0,
    difference REAL DEFAULT 0,
    status TEXT DEFAULT 'open', -- 'open' | 'closed'
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME
);

-- Inventory Movement Audit Log
CREATE TABLE IF NOT EXISTS inventory_logs (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL, -- 'sale' | 'purchase' | 'manual_adjustment' | 'return'
    terminal_id TEXT,
    reference_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Central Delta Mutation Replication Journal (OpLog for Multi-Terminal Sync)
CREATE TABLE IF NOT EXISTS mutation_journal (
    sequence_id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    terminal_id TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'Product' | 'Sale' | 'Customer' | 'Shift'
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'INSERT' | 'UPDATE' | 'DELETE' | 'STOCK_DECREMENT'
    data_json TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_mutation_sequence ON mutation_journal(sequence_id);
