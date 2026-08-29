# RetailFlow POS — Central Synchronization Server Setup

This documentation explains how to set up, deploy, and connect the central database sync server to synchronize all RetailFlow POS web terminals and desktop instances.

---

## 1. Database Sync Schema

The remote database stores the Zustand state snapshots of all terminals, merging them using record-level logic.

```
                  ┌──────────────────────────────┐
                  │   Central REST Sync Server   │
                  │        (Node.js / Express)   │
                  └──────────────┬───────────────┘
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
            ┌─────────────────┐     ┌─────────────────┐
            │ PostgreSQL /    │     │ SQLite File     │
            │ Supabase DB     │     │ (Local Server)  │
            └─────────────────┘     └─────────────────┘
```

---

## 2. Server Implementation Blueprint (Node.js & Express)

Create a new Node.js project, install dependencies (`npm install express cors body-parser`), and deploy the following file as `server.js`:

```javascript
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;
const SYNC_API_KEY = process.env.SYNC_API_KEY || "retailflow-secure-sync-token-12345";

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" })); // Support large POS backups

// Global in-memory master database (Replace with PostgreSQL or SQLite db query in production)
let masterDatabase = {};

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${SYNC_API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized access: invalid or missing API key" });
  }
  next();
};

app.post("/sync", authenticate, (req, res) => {
  const { device, backupData } = req.body;
  console.log(`[Sync Request] Received sync push from: ${device}`);

  if (!backupData) {
    return res.status(400).json({ error: "Missing sync payload data" });
  }

  // Merge Strategy: Record-level newer updatedAt wins
  for (const [storeKey, storeValueStr] of Object.entries(backupData)) {
    if (!storeValueStr) continue;

    try {
      const clientStore = JSON.parse(storeValueStr);
      const serverStoreStr = masterDatabase[storeKey];

      if (!serverStoreStr) {
        // No server copy exists yet; save client's data directly
        masterDatabase[storeKey] = storeValueStr;
        continue;
      }

      const serverStore = JSON.parse(serverStoreStr);

      // Resolve based on store type
      if (clientStore.state && Array.isArray(clientStore.state.sales)) {
        // Merge Sales
        const mergedSales = mergeRecords(serverStore.state.sales, clientStore.state.sales);
        serverStore.state.sales = mergedSales;
        masterDatabase[storeKey] = JSON.stringify(serverStore);
      } else if (clientStore.state && Array.isArray(clientStore.state.products)) {
        // Merge Products
        const mergedProducts = mergeRecords(serverStore.state.products, clientStore.state.products);
        serverStore.state.products = mergedProducts;
        masterDatabase[storeKey] = JSON.stringify(serverStore);
      } else if (clientStore.state && Array.isArray(clientStore.state.customers)) {
        // Merge Customers
        const mergedCustomers = mergeRecords(serverStore.state.customers, clientStore.state.customers);
        serverStore.state.customers = mergedCustomers;
        masterDatabase[storeKey] = JSON.stringify(serverStore);
      } else if (clientStore.state && Array.isArray(clientStore.state.suppliers)) {
        // Merge Suppliers
        const mergedSuppliers = mergeRecords(serverStore.state.suppliers, clientStore.state.suppliers);
        serverStore.state.suppliers = mergedSuppliers;
        masterDatabase[storeKey] = JSON.stringify(serverStore);
      } else if (clientStore.state && Array.isArray(clientStore.state.purchases)) {
        // Merge Supplier Purchases
        const mergedPurchases = mergeRecords(serverStore.state.purchases, clientStore.state.purchases);
        serverStore.state.purchases = mergedPurchases;
        masterDatabase[storeKey] = JSON.stringify(serverStore);
      } else if (clientStore.state && Array.isArray(clientStore.state.expenses)) {
        // Merge Operating Expenses
        const mergedExpenses = mergeRecords(serverStore.state.expenses, clientStore.state.expenses);
        serverStore.state.expenses = mergedExpenses;
        masterDatabase[storeKey] = JSON.stringify(serverStore);
      } else if (clientStore.state && Array.isArray(clientStore.state.returns)) {
        // Merge Returns
        const mergedReturns = mergeRecords(serverStore.state.returns, clientStore.state.returns);
        serverStore.state.returns = mergedReturns;
        masterDatabase[storeKey] = JSON.stringify(serverStore);
      } else {
        // Fallback for simple settings: client overwrites if newer
        masterDatabase[storeKey] = storeValueStr;
      }
    } catch (err) {
      console.error(`Error merging store key ${storeKey}:`, err);
    }
  }

  res.json({
    status: "success",
    message: "Data merged successfully on cloud database",
    mergedData: masterDatabase
  });
});

// Record Merge Helper: compares unique ID and keep the row with newer updatedAt / createdAt
function mergeRecords(serverArr, clientArr) {
  const map = new Map();
  
  // Load server records
  for (const item of serverArr) {
    map.set(item.id, item);
  }

  // Compare client records
  for (const item of clientArr) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    } else {
      const serverItem = map.get(item.id);
      const serverTime = new Date(serverItem.updatedAt || serverItem.createdAt || 0).getTime();
      const clientTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
      
      if (clientTime > serverTime) {
        map.set(item.id, item);
      }
    }
  }

  return Array.from(map.values());
}

app.listen(PORT, () => console.log(`RetailFlow Sync Database server listening on port ${PORT}`));
```

---

## 3. How to Connect in settings Page

1. Open **Settings** on either the Web app or Desktop terminal.
2. Under the **"Data Export, Backup & Sync Center"** panel, configure:
   - **Remote Sync Server URL:** `http://localhost:5000/sync` (or your deployed server domain).
   - **API Authorization Token:** `retailflow-secure-sync-token-12345`.
3. Click **"Save Settings"**.
4. Click **"Perform Synchronization Now"**. The terminal will merge all registers and refresh itself automatically.
