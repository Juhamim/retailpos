# RetailFlow POS v1.0.0 — Production Release Notes

**Release Date:** October 18, 2026  
**Version:** `1.0.0` (Build `2026.10.1`)  
**Target Platforms:** Windows 10 / 11 (x64), Modern Web Browsers (PWA), Local Network Multi-Counter POS  
**Repository:** [https://github.com/Juhamim/retailpos](https://github.com/Juhamim/retailpos)  

---

## 🌟 Executive Summary

**RetailFlow POS v1.0.0** is an enterprise-grade, offline-first Point of Sale and retail management system designed for supermarkets, grocery stores, pharmacies, electronics shops, and multi-counter retail enterprises. 

Engineered with a **Local-First Core (Tauri + Next.js + SQLite)** and powered by **Cloudflare Edge Infrastructure (Workers + D1 + R2)**, RetailFlow POS delivers sub-50ms barcode scanning latency with 100% offline autonomy while seamlessly synchronizing transactions, multi-counter stock decrements, and customer credit (Khata) balances across counters in real time.

---

## 🚀 Key Features & Highlights

### 1. Native Windows Desktop Executables & Deployments
- **Standard NSIS 1-Click Installer (`RetailFlow_POS_v1.0.0_Setup.exe`)**:
  - Automatically installs the desktop application, creates Desktop and Start Menu shortcuts, registers standard Windows uninstallation hooks, and configures auto-updater tasks.
- **Enterprise MSI Package (`RetailFlow_POS_v1.0.0_Enterprise.msi`)**:
  - Built with WiX toolset for IT systems administrators. Supports silent, unattended mass deployment across enterprise fleets via Active Directory Group Policy (GPO) and Microsoft Intune (`msiexec /i RetailFlow_POS_v1.0.0_Enterprise.msi /qn`).
- **Zero-Install Portable Binary (`RetailFlow_POS_Portable.exe`)**:
  - Self-contained 64-bit production executable. Runs immediately from flash drives or external drives without administrator privileges.
- **Continuous Differential Auto-Updater (`RetailFlow_POS_v1.0.0_x64-setup.nsis.zip`)**:
  - Compact differential update package consumed by the native Tauri update engine.

---

### 2. Dynamic NPCI UPI QR Payment Engine
- **Real-Time On-Screen Dynamic QR Generation**:
  - Instantly renders an NPCI-compliant UPI payment QR code at checkout formatted with merchant UPI ID (VPA), payee name, exact order total, invoice reference, and transaction note.
- **Thermal Receipt & A4 Invoice QR Codes**:
  - Thermal receipts (80mm / 58mm) and standard A4/A5 PDF invoices print with the dynamic UPI QR code, allowing shoppers to scan and settle unpaid bills on their mobile banking apps (Google Pay, PhonePe, Paytm, BHIM, Cred).
- **Multi-Payment Split Settlement**:
  - Cashiers can split a single ticket across UPI, Cash, Credit Card, and Customer Store Credit/Khata.

---

### 3. Customer Self-Service Cloudflare Setup Wizard
- **Zero-Terminal Cloud Onboarding**:
  - Merchants do not need terminal access, Node.js, or Wrangler CLI on their billing counter computers.
  - A 4-step wizard in **Settings → Cloudflare Sync & Backup** allows the customer to paste their private Cloudflare API Token and Account ID.
- **Automated Cloud Provisioning**:
  - Automatically provisions the merchant's private Cloudflare Worker (`retailflow-worker`), creates the distributed Cloudflare D1 database (`retailflow-db`), runs schema migrations, and sets up private R2 cloud backup buckets with 1 click.
- **Web Terminal Live Sync**:
  - Cash counters synchronize sales, catalog updates, and shift reconciliation records directly to the merchant's Cloudflare Worker web endpoint with automated 30-second heartbeats.

---

### 4. Centralised Distributed Database (Cloudflare D1) & Delta Replication
- **Offline-First Resilience**:
  - Full local storage fallback ensures cashiers can continue billing continuously even during complete internet outages.
- **Multi-Register Inventory Decrement**:
  - Prevents double-selling across multiple checkout registers through version-tagged inventory balance reconciliation.
- **Customer Khata Credit Tracking**:
  - Real-time customer balance updates synchronize debit and credit settlements across counters instantly.

---

### 5. UI/UX Refinement & Visibility Upgrades
- **Permanent Pinned Settings Access**:
  - Settings is pinned permanently to the bottom of the sidebar (above the user profile footer), ensuring it is never pushed off-screen or hidden on 768px, 800px, or 1080p desktop windows.
- **Header & POS Command Bar Direct Shortcuts**:
  - Dedicated Settings gear icon in the top navigation header and on the POS cash register toolbar for immediate access during billing.
- **Industry Standard Hotkeys**:
  - Registered **`Ctrl+,`** (and `Ctrl+Alt+S`) to open Settings instantly from anywhere.
  - Updated **`F1`** Retail Help Menu and **`Ctrl+K`** Command Palette with quick-launch actions for Settings, Cloudflare Setup, Tax/GST, and Thermal Printers.
- **Text & Input Visibility Overhaul**:
  - Upgraded all form inputs, modals, table rows, and search boxes across Light and Dark themes with high-contrast text and crisp focus rings.

---

### 7. Executive Tax Invoice & Thermal Receipt Design Overhaul
- **Statutory Indian GST Compliance & Symmetrical Visual Architecture**:
  - Completely redesigned standard A4/A5 Tax Invoices and 80mm thermal receipts with high-contrast typography, brand color accent ribbons, and clean grid layouts.
  - Symmetrical **Billed By (Supplier)** and **Billed To (Customer / Place of Supply)** cards with GSTIN and state codes.
- **HSN Tax Breakdown Matrix**:
  - Automatic calculation and display of statutory HSN/SAC breakdown tables with Taxable Value, CGST rate & amount, SGST rate & amount, and Total Tax.
- **Statutory Amount in Words**:
  - Automatic conversion of grand totals into words following the Indian numbering system (e.g. *"Rupees Twelve Thousand Four Hundred Fifty Only"*).
- **Executive PDF Export**:
  - Direct browser and desktop print engine aligned with the new visual layout and side-by-side totals card.

---

### 8. Dynamic Google Sheets Live Sync & Executive Analytics
- **Live Cloud Spreadsheet Integration**:
  - Merchants can stream their checkout sales, live catalog inventory levels, and shift closing audits directly into a dynamic Google Sheet workbook in real time.
- **Zero-Code Google Apps Script Webhook Bridge**:
  - Built-in 1-click Apps Script code generator in **Settings → Google Sheets Sync** that routes data dynamically into dedicated tabs:
    - `Sales_Ledger`: Detailed ledger of all completed sales, payment modes, GST amounts, item summaries, and cashier tags.
    - `Inventory_Live`: Real-time stock counts, reorder thresholds, inventory valuation, and stock status alerts.
    - `Shift_Audits`: Shift reconciliation records with opening floats, expected cash, actual counted cash, and variance tracking.
- **Dynamic Charts & Dashboards**:
  - Google Sheets template workbook pre-configured with `SUMIFS`, `QUERY`, and dynamic Google Charts for executive sales trends, top-selling categories, and cashier reconciliation.
- **Offline Queuing**:
  - If the store temporarily loses internet connectivity, transactions are safely queued in local storage (`rf_gsheet_offline_queue`) and automatically flushed when the connection is restored.

---

## 📦 Binary Assets & Cryptographic Checksums

All production packages are verified with SHA-256 cryptographic hashes:

| Filename | Type | Size | SHA-256 Checksum |
|---|---|---|---|
| `RetailFlow_POS_v1.0.0_Setup.exe` | Windows NSIS Setup | 3.54 MB | `f90d6961a73be4aaafab1a8a1c2e76468bb538e6b20c4e4790078d77d401a0e8` |
| `RetailFlow_POS_v1.0.0_Enterprise.msi` | Windows Installer | 4.77 MB | `a5ca63cd0f5c6b9d5414a1cb44e0b81962103f9c497c4e0ed26674ef0f158deb` |
| `RetailFlow_POS_Portable.exe` | Standalone Executable | 9.94 MB | `5871ac17be3f2e3abd75f876ce0e743d082d830cb5ef43b7c780c9ce02208b65` |
| `RetailFlow_POS_v1.0.0_x64-setup.nsis.zip` | Auto-Updater Differential | 3.54 MB | `3515c6ceb8f250258ba483105fb1fca1ab922ad2d2f87c8ba42141a27f3f0f0a` |
| `RETAILFLOW_POS_SETUP_GUIDE.pdf` | Setup & Deployment PDF | 76.5 KB | `c5be6f5eec1592641e7b6ea2488d5ce0d8e17467a2183afa3352fe16fe722579` |
| `latest.json` | Tauri Updater Manifest | 511 B | `bdb2ae1e7b1f540e48dc69f8e62c8e2e72980415e7ed3bc52efc34319475e6dd` |

---

## 🛠️ Installation Instructions

### Windows 1-Click GUI Installation
1. Download `RetailFlow_POS_v1.0.0_Setup.exe`.
2. Double-click the installer and follow the on-screen prompts.
3. Launch **RetailFlow POS** from your Desktop shortcut or Start Menu.
4. Default Administrator PIN: **`1234`** (Username: `admin`, Password: `1234`).

### Silent Enterprise Mass Deployment (GPO / Intune)
```cmd
msiexec /i RetailFlow_POS_v1.0.0_Enterprise.msi /qn /norestart
```

### Zero-Install Portable Run
1. Download `RetailFlow_POS_Portable.exe`.
2. Double-click to execute immediately. All store databases persist in `%APPDATA%\com.retailflow.pos\`.

---

## 📋 Full Changelog

- **feat(invoice)**: Complete redesign of A4 Tax Invoices and 80mm thermal receipts with Indian GST compliance, HSN tax breakdown matrix, Amount in Words in Indian numbering system, and dynamic UPI QR code.
- **feat(google-sheets)**: Real-time background sync engine to Google Sheets with pre-configured multi-tab workbook structure, offline queueing, and Google Apps Script bridge.
- **feat(core)**: Complete Windows x64 native packaging via Tauri v1 with hardware acceleration and silent crash prevention.
- **feat(upi)**: Integrated dynamic NPCI UPI QR specification (`upi://pay?pa=...`) for checkout screens, thermal receipts, and A4 billing.
- **feat(branding)**: Built real-time Store Logo Uploader with instant preview, canvas base64 serialization, and receipt header injection.
- **feat(cloudflare)**: Customer self-service Cloudflare API Wizard with automated Worker, D1 SQLite database, and R2 storage provisioning.
- **feat(sync)**: Bidirectional delta synchronization engine with queue management and offline fallback.
- **feat(updates)**: In-app background update checker and automated differential patching engine.
- **feat(ui)**: Redesigned sidebar with pinned Settings section, top header shortcuts, POS toolbar links, and `Ctrl+,` global hotkey.
- **docs**: Created multi-page executive PDF setup guide (`RETAILFLOW_POS_SETUP_GUIDE.pdf`) and GitHub deployment guides.

---

*RetailFlow POS — High-Performance, Local-First Retail Point of Sale for Modern Businesses.*
