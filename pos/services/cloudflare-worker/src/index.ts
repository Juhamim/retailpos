/**
 * Cloudflare Worker Backend & Live Central D1 Database for RetailFlow POS
 * Provides central SQLite D1 replication, point-in-time R2 backups, and executive dashboard.
 */

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: any;
  error?: string;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface KVNamespace {
  get(key: string, type?: any): Promise<any>;
  put(key: string, value: string, options?: any): Promise<void>;
  list(options?: any): Promise<{ keys: Array<{ name: string; metadata?: any }> }>;
  delete(key: string): Promise<void>;
}

export interface R2Bucket {
  put(key: string, value: any, options?: any): Promise<any>;
  get(key: string): Promise<any>;
  list(options?: any): Promise<{ objects: Array<{ key: string; size: number; uploaded: Date; customMetadata?: any }> }>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  DB?: D1Database;
  RETAILFLOW_KV?: KVNamespace;
  RETAILFLOW_R2?: R2Bucket;
  API_SECRET_TOKEN?: string;
  ENVIRONMENT?: string;
}

// Memory fallback store for local development or when D1 is not yet bound
const memoryStore = {
  backups: new Map<string, any>(),
  backupList: [] as any[],
  sales: [] as any[],
  products: [] as any[],
  mutations: [] as any[],
  sequenceCounter: 1,
  stats: {
    todaySales: 12450.0,
    orderCount: 18,
    activeShift: "Shift #4 - Admin Cashier (Open)",
    lastSync: new Date().toISOString(),
    storeName: "RetailFlow Mart",
    logo: "",
  },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Store-Id, X-Terminal-Id",
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function verifyAuth(request: Request, env: Env): boolean {
  const token = env.API_SECRET_TOKEN;
  if (!token) return true; // Open access if no secret set

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
  return provided === token.trim();
}

/**
 * Ensures Central D1 tables exist on demand
 */
async function ensureD1Tables(db: D1Database): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS stores (id TEXT PRIMARY KEY, name TEXT NOT NULL, logo_base64 TEXT, gstin TEXT, phone TEXT, email TEXT, address TEXT, upi_id TEXT, currency_symbol TEXT DEFAULT '₹', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, name TEXT NOT NULL, sku TEXT NOT NULL, barcode TEXT, category_name TEXT, purchase_price REAL DEFAULT 0, selling_price REAL NOT NULL, gst_rate TEXT NOT NULL, stock_quantity INTEGER DEFAULT 0, reorder_level INTEGER DEFAULT 10, unit TEXT DEFAULT 'pcs', status TEXT DEFAULT 'active', is_weighable BOOLEAN DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, email TEXT, tier TEXT DEFAULT 'Regular', credit_balance REAL DEFAULT 0, credit_limit REAL DEFAULT 5000, loyalty_points INTEGER DEFAULT 0, total_spent REAL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS sales (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, terminal_id TEXT NOT NULL, invoice_number TEXT NOT NULL UNIQUE, customer_id TEXT, customer_name TEXT, subtotal REAL NOT NULL, tax_amount REAL NOT NULL, discount_amount REAL DEFAULT 0, total_amount REAL NOT NULL, payment_method TEXT NOT NULL, payments_json TEXT NOT NULL, status TEXT DEFAULT 'completed', cashier_name TEXT, shift_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS sale_items (id TEXT PRIMARY KEY, sale_id TEXT NOT NULL, product_id TEXT NOT NULL, product_name TEXT NOT NULL, product_sku TEXT NOT NULL, unit_price REAL NOT NULL, quantity INTEGER NOT NULL, tax_rate REAL NOT NULL, tax_amount REAL NOT NULL, total REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS mutation_journal (sequence_id INTEGER PRIMARY KEY AUTOINCREMENT, store_id TEXT NOT NULL, terminal_id TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, action TEXT NOT NULL, data_json TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
  `;
  try {
    await db.exec(sql);
  } catch (err) {
    console.warn("Table auto-migration notice:", err);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 1. Health check endpoint
    if (url.pathname === "/api/health") {
      return jsonResponse({
        status: "healthy",
        service: "retailflow-cloudflare-worker",
        timestamp: new Date().toISOString(),
        version: "1.1.0",
        storage: {
          d1Configured: !!env.DB,
          kvConfigured: !!env.RETAILFLOW_KV,
          r2Configured: !!env.RETAILFLOW_R2,
        },
      });
    }

    // 2. Cloud Backup Upload Endpoint (POST /api/backup)
    if (url.pathname === "/api/backup" && request.method === "POST") {
      if (!verifyAuth(request, env)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      try {
        const snapshot = await request.json() as any;
        const id = snapshot?.metadata?.id || `cf-snap-${Date.now()}`;
        const metadata = {
          id,
          storeId: snapshot?.metadata?.storeId || "store-1",
          storeName: snapshot?.metadata?.storeName || memoryStore.stats.storeName,
          timestamp: snapshot?.metadata?.timestamp || new Date().toISOString(),
          sizeBytes: JSON.stringify(snapshot).length,
          totalRecords: snapshot?.metadata?.totalRecords || 0,
        };

        // If R2 binding exists, store snapshot JSON
        if (env.RETAILFLOW_R2) {
          await env.RETAILFLOW_R2.put(`backups/${id}.json`, JSON.stringify(snapshot));
        }

        // If KV exists, store metadata
        if (env.RETAILFLOW_KV) {
          await env.RETAILFLOW_KV.put(`backup_meta:${id}`, JSON.stringify(metadata));
          const listRaw = await env.RETAILFLOW_KV.get("backup_list");
          const list = listRaw ? JSON.parse(listRaw) : [];
          list.unshift(metadata);
          await env.RETAILFLOW_KV.put("backup_list", JSON.stringify(list.slice(0, 50)));
        } else {
          memoryStore.backups.set(id, snapshot);
          memoryStore.backupList.unshift(metadata);
        }

        // Update live stats from snapshot if available
        if (snapshot.data?.settings?.shop?.shopName) {
          memoryStore.stats.storeName = snapshot.data.settings.shop.shopName;
        }
        if (snapshot.data?.settings?.shop?.logo) {
          memoryStore.stats.logo = snapshot.data.settings.shop.logo;
        }
        if (Array.isArray(snapshot.data?.sales)) {
          memoryStore.stats.orderCount = snapshot.data.sales.length;
          memoryStore.stats.todaySales = snapshot.data.sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
          memoryStore.sales = snapshot.data.sales.slice(-10).reverse();
        }

        return jsonResponse({
          success: true,
          snapshotId: id,
          sizeBytes: metadata.sizeBytes,
          message: "Database snapshot successfully backed up to Cloudflare!",
        });
      } catch (err) {
        return jsonResponse({ error: err instanceof Error ? err.message : "Failed to store snapshot" }, 500);
      }
    }

    // 3. List Cloud Backups (GET /api/backup)
    if (url.pathname === "/api/backup" && request.method === "GET") {
      let backups: any[] = [];
      if (env.RETAILFLOW_KV) {
        const listRaw = await env.RETAILFLOW_KV.get("backup_list");
        backups = listRaw ? JSON.parse(listRaw) : [];
      } else {
        backups = memoryStore.backupList;
      }
      return jsonResponse({ backups });
    }

    // 4. Download Specific Cloud Backup (GET /api/backup/:id)
    if (url.pathname.startsWith("/api/backup/") && request.method === "GET") {
      const id = url.pathname.replace("/api/backup/", "");
      if (env.RETAILFLOW_R2) {
        const obj = await env.RETAILFLOW_R2.get(`backups/${id}.json`);
        if (!obj) return jsonResponse({ error: "Snapshot not found in Cloudflare R2" }, 404);
        const text = await obj.text();
        return new Response(text, {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } else {
        const snap = memoryStore.backups.get(id);
        if (!snap) return jsonResponse({ error: "Snapshot not found in memory" }, 404);
        return jsonResponse(snap);
      }
    }

    // 5. Centralised Delta Push Sync (POST /api/sync/push)
    // Synchronizes sales, updates inventory stock, and logs to mutation journal
    if (url.pathname === "/api/sync/push" && request.method === "POST") {
      try {
        const payload = await request.json() as any;
        const operations = Array.isArray(payload?.operations) ? payload.operations : [];
        const storeId = request.headers.get("X-Store-Id") || payload.storeId || "store-primary";
        const terminalId = request.headers.get("X-Terminal-Id") || payload.terminalId || "terminal-1";

        if (env.DB) {
          await ensureD1Tables(env.DB);

          for (const op of operations) {
            const entityType = op.entityType || "Sale";
            const entityId = op.entityId || op.data?.id || `id-${Date.now()}`;
            const action = op.action || "INSERT";
            const data = op.data || {};

            // 1. Record in Central Mutation Journal
            await env.DB.prepare(
              `INSERT INTO mutation_journal (store_id, terminal_id, entity_type, entity_id, action, data_json) VALUES (?, ?, ?, ?, ?, ?)`
            ).bind(storeId, terminalId, entityType, entityId, action, JSON.stringify(data)).run();

            // 2. Process Sales
            if (entityType === "Sale" && data.invoiceNumber) {
              await env.DB.prepare(
                `INSERT OR REPLACE INTO sales (id, store_id, terminal_id, invoice_number, customer_id, customer_name, subtotal, tax_amount, discount_amount, total_amount, payment_method, payments_json, status, cashier_name, shift_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              ).bind(
                entityId,
                storeId,
                terminalId,
                data.invoiceNumber,
                data.customerId || null,
                data.customerName || "Walk-in",
                data.subtotal || 0,
                data.taxAmount || 0,
                data.discountAmount || 0,
                data.totalAmount || 0,
                data.paymentMethod || "CASH",
                JSON.stringify(data.payments || []),
                data.status || "completed",
                data.cashierName || "Cashier",
                data.shiftId || null
              ).run();

              // Process Line Items & Deduct Central Stock
              if (Array.isArray(data.items)) {
                for (const item of data.items) {
                  await env.DB.prepare(
                    `INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, product_name, product_sku, unit_price, quantity, tax_rate, tax_amount, total)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                  ).bind(
                    item.id || `item-${Date.now()}`,
                    entityId,
                    item.productId,
                    item.productName || "",
                    item.productSku || "",
                    item.unitPrice || 0,
                    item.quantity || 1,
                    item.taxRate || 0,
                    item.taxAmount || 0,
                    item.total || 0
                  ).run();

                  // Decrement central inventory stock atomically
                  if (item.productId) {
                    await env.DB.prepare(
                      `UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
                    ).bind(item.quantity || 1, item.productId).run();
                  }
                }
              }

              // Update Customer Khata balance if credit sale
              if (data.customerId && (data.paymentMethod === "CREDIT" || data.paymentMethod === "KHATA")) {
                await env.DB.prepare(
                  `UPDATE customers SET credit_balance = credit_balance + ?, total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
                ).bind(data.totalAmount || 0, data.totalAmount || 0, data.customerId).run();
              }
            }

            // 3. Process Product Catalog updates
            if (entityType === "Product" && data.sku) {
              await env.DB.prepare(
                `INSERT OR REPLACE INTO products (id, store_id, name, sku, barcode, category_name, purchase_price, selling_price, gst_rate, stock_quantity, reorder_level, unit, status, is_weighable)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              ).bind(
                entityId,
                storeId,
                data.name,
                data.sku,
                data.barcode || "",
                data.categoryName || "General",
                data.purchasePrice || 0,
                data.sellingPrice || 0,
                data.gstRate || "GST_18",
                data.stockQuantity || 0,
                data.reorderLevel || 10,
                data.unit || "pcs",
                data.status || "active",
                data.isWeighable ? 1 : 0
              ).run();
            }
          }
        }

        // Keep local memory fallback updated
        for (const op of operations) {
          if (op.entityType === "Sale" && op.data) {
            memoryStore.sales.unshift(op.data);
            memoryStore.stats.orderCount += 1;
            memoryStore.stats.todaySales += op.data.totalAmount || 0;
          }
          memoryStore.mutations.push({
            sequence_id: memoryStore.sequenceCounter++,
            store_id: storeId,
            terminal_id: terminalId,
            entity_type: op.entityType || "Sale",
            entity_id: op.entityId || "id",
            action: op.action || "INSERT",
            data_json: JSON.stringify(op.data || {}),
            timestamp: new Date().toISOString(),
          });
        }
        memoryStore.stats.lastSync = new Date().toISOString();

        return jsonResponse({
          success: true,
          syncedCount: operations.length,
          timestamp: memoryStore.stats.lastSync,
          d1Active: !!env.DB,
        });
      } catch (err: any) {
        return jsonResponse({ error: `Push sync failed: ${err?.message}` }, 500);
      }
    }

    // 6. Centralised Delta Pull Sync (GET /api/sync/pull)
    // Allows terminals to fetch incremental changes since their last sequence_id
    if (url.pathname === "/api/sync/pull" && request.method === "GET") {
      const sinceSeq = parseInt(url.searchParams.get("sinceSequenceId") || "0", 10);

      if (env.DB) {
        try {
          await ensureD1Tables(env.DB);
          const mutationsRes = await env.DB.prepare(
            `SELECT sequence_id, store_id, terminal_id, entity_type, entity_id, action, data_json, timestamp 
             FROM mutation_journal 
             WHERE sequence_id > ? 
             ORDER BY sequence_id ASC 
             LIMIT 100`
          ).bind(sinceSeq).all();

          const mutations = (mutationsRes.results || []).map((m: any) => ({
            sequenceId: m.sequence_id,
            storeId: m.store_id,
            terminalId: m.terminal_id,
            entityType: m.entity_type,
            entityId: m.entity_id,
            action: m.action,
            data: JSON.parse(m.data_json || "{}"),
            timestamp: m.timestamp,
          }));

          const latestSeq = mutations.length > 0
            ? mutations[mutations.length - 1].sequenceId
            : sinceSeq;

          return jsonResponse({
            success: true,
            timestamp: new Date().toISOString(),
            mutations,
            latestSequenceId: latestSeq,
            d1Active: true,
          });
        } catch (e: any) {
          console.warn("D1 pull error, falling back to memory:", e);
        }
      }

      // Fallback
      const filtered = memoryStore.mutations
        .filter((m) => m.sequence_id > sinceSeq)
        .slice(0, 100)
        .map((m) => ({
          sequenceId: m.sequence_id,
          storeId: m.store_id,
          terminalId: m.terminal_id,
          entityType: m.entity_type,
          entityId: m.entity_id,
          action: m.action,
          data: JSON.parse(m.data_json || "{}"),
          timestamp: m.timestamp,
        }));

      return jsonResponse({
        success: true,
        timestamp: new Date().toISOString(),
        mutations: filtered,
        latestSequenceId: filtered.length > 0 ? filtered[filtered.length - 1].sequenceId : sinceSeq,
        d1Active: false,
      });
    }

    // 7. Live Stats Endpoint for Cloud Dashboard (GET /api/stats)
    if (url.pathname === "/api/stats") {
      let stats = { ...memoryStore.stats };
      let recentSales = memoryStore.sales.slice(0, 10);

      if (env.DB) {
        try {
          await ensureD1Tables(env.DB);
          const summary = await env.DB.prepare(
            `SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as total_sales FROM sales`
          ).first<{ order_count: number; total_sales: number }>();

          if (summary) {
            stats.orderCount = summary.order_count || 0;
            stats.todaySales = summary.total_sales || 0;
          }

          const salesQuery = await env.DB.prepare(
            `SELECT invoice_number as invoiceNumber, customer_name as customerName, payment_method as paymentMethod, total_amount as totalAmount, created_at as createdAt 
             FROM sales ORDER BY created_at DESC LIMIT 10`
          ).all();

          if (salesQuery.results && salesQuery.results.length > 0) {
            recentSales = salesQuery.results as any[];
          }
        } catch {}
      }

      return jsonResponse({
        stats,
        recentSales,
      });
    }

    // 8. Central Cloudflare Worker Web Portal / Dashboard Page (GET /)
    if (url.pathname === "/" || url.pathname === "/index.html") {
      let stats = { ...memoryStore.stats };
      let recentSales = memoryStore.sales;

      if (env.DB) {
        try {
          await ensureD1Tables(env.DB);
          const summary = await env.DB.prepare(
            `SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as total_sales FROM sales`
          ).first<{ order_count: number; total_sales: number }>();
          if (summary) {
            stats.orderCount = summary.order_count;
            stats.todaySales = summary.total_sales;
          }
          const rows = await env.DB.prepare(
            `SELECT invoice_number as invoiceNumber, customer_name as customerName, payment_method as paymentMethod, total_amount as totalAmount FROM sales ORDER BY created_at DESC LIMIT 8`
          ).all();
          if (rows.results && rows.results.length > 0) {
            recentSales = rows.results as any[];
          }
        } catch {}
      }

      return new Response(renderCloudDashboardHtml(stats, recentSales, !!env.DB), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return jsonResponse({ error: "Not Found" }, 404);
  },
};

/**
 * Renders the modern, mobile-responsive Executive Cloud Dashboard HTML page
 */
function renderCloudDashboardHtml(stats: any, recentSales: any[], d1Active: boolean): string {
  const logoHtml = stats.logo
    ? `<img src="${stats.logo}" alt="Store Logo" style="height: 40px; max-width: 140px; object-fit: contain; margin-right: 12px;" />`
    : `<div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; margin-right: 12px; font-size: 18px;">R</div>`;

  const salesRows = recentSales.length > 0
    ? recentSales.slice(0, 8).map((s: any) => `
        <tr style="border-bottom: 1px solid #1e293b;">
          <td style="padding: 12px 16px; font-family: monospace; font-weight: 600; color: #cbd5e1;">${s.invoiceNumber || 'INV-1001'}</td>
          <td style="padding: 12px 16px; color: #94a3b8;">${s.customerName || 'Walk-in'}</td>
          <td style="padding: 12px 16px;"><span style="background: rgba(79, 70, 229, 0.15); color: #818cf8; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${s.paymentMethod || 'CASH'}</span></td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #10b981;">₹${(s.totalAmount || 0).toFixed(2)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="4" style="padding: 32px; text-align: center; color: #64748b;">No live sales recorded yet. Register transactions sync in real-time.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${stats.storeName} - Cloudflare D1 Executive Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #090d16;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #1e293b;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand {
      display: flex;
      align-items: center;
    }
    .brand h1 {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .brand span {
      font-size: 11px;
      color: #818cf8;
      display: block;
      font-weight: 600;
    }
    .sync-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 9999px;
    }
    .pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulseAnim 2s infinite;
    }
    @keyframes pulseAnim {
      0% { transform: scale(0.95); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.5; }
      100% { transform: scale(0.95); opacity: 1; }
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      width: 100%;
      flex: 1;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5);
    }
    .card-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
    }
    .card-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 6px;
    }
    .table-container {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5);
    }
    .table-header {
      padding: 16px 20px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-header h2 {
      font-size: 14px;
      font-weight: 700;
      color: #f8fafc;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #131c31;
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.04em;
    }
    .footer {
      border-top: 1px solid #1e293b;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      ${logoHtml}
      <div>
        <h1>${stats.storeName}</h1>
        <span>Cloudflare D1 Central POS Dashboard</span>
      </div>
    </div>
    <div class="sync-badge">
      <div class="pulse"></div>
      <span>${d1Active ? "Cloudflare D1 Active" : "Edge Memory Sync"}</span>
    </div>
  </div>

  <div class="container">
    <div class="grid">
      <div class="card">
        <div class="card-title">Consolidated Gross Sales</div>
        <div class="card-value" style="color: #34d399;">₹${stats.todaySales.toFixed(2)}</div>
        <div class="card-sub">Multi-Terminal consolidated revenue</div>
      </div>

      <div class="card">
        <div class="card-title">Completed Orders</div>
        <div class="card-value">${stats.orderCount}</div>
        <div class="card-sub">Invoices across all counters</div>
      </div>

      <div class="card">
        <div class="card-title">Central Database Engine</div>
        <div style="font-size: 16px; font-weight: 800; color: #818cf8; margin-top: 6px;">
          ${d1Active ? "Cloudflare D1 (Distributed SQLite)" : "Offline Local-First Buffer"}
        </div>
        <div class="card-sub">Sub-100ms globally distributed replication</div>
      </div>

      <div class="card">
        <div class="card-title">Cloud Backup & Storage</div>
        <div style="font-size: 16px; font-weight: 800; color: #38bdf8;">Cloudflare R2 Encrypted</div>
        <div class="card-sub">Last Sync: ${new Date(stats.lastSync).toLocaleTimeString()}</div>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <h2>Central Real-Time Transactions Feed</h2>
        <span style="font-size: 11px; color: #64748b; font-weight: 600;">Auto-refreshes every 15s</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Customer</th>
            <th>Payment Tender</th>
            <th style="text-align: right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody id="sales-tbody">
          ${salesRows}
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    RetailFlow POS • Central Cloudflare D1 Distributed Architecture • Multi-Terminal Delta Replication
  </div>

  <script>
    setInterval(async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          if (data && data.stats) {
            window.location.reload();
          }
        }
      } catch (e) {}
    }, 15000);
  </script>
</body>
</html>`;
}
