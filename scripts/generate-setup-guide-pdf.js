/**
 * RetailFlow POS - PDF Setup Guide Generator
 * Generates an executive-level, comprehensive multi-page PDF Setup & Deployment Guide.
 */

const fs = require('fs');
const path = require('path');
const { jsPDF } = require('../pos/apps/web/node_modules/jspdf');

function createSetupGuidePdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2);

  // Styling palette
  const colors = {
    primary: [79, 70, 229],      // Indigo #4F46E5
    primaryDark: [67, 56, 202],  // #4338CA
    accent: [249, 115, 22],      // Orange/Amber #F97316
    success: [16, 185, 129],     // Emerald #10B981
    textDark: [15, 23, 42],      // Slate 900
    textMuted: [100, 116, 139],  // Slate 500
    textLight: [248, 250, 252],  // Slate 50
    cardBg: [248, 250, 252],     // Slate 50
    cardBorder: [226, 232, 240], // Slate 200
    tableHeader: [15, 23, 42],   // Slate 900
  };

  function addHeader(pageNum, totalPages, title) {
    if (pageNum === 1) return; // Skip on cover page
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 12, pageWidth - margin, 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.text('RetailFlow POS', margin, 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text(title || 'Complete Setup & Operations Guide', margin + 30, 8);
  }

  function addFooter(pageNum, totalPages) {
    const y = pageHeight - 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.textMuted);
    doc.text('RetailFlow POS • Offline-First Retail Architecture • Cloudflare D1 Cloud', margin, y);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 20, y);
  }

  // ==========================================================================
  // PAGE 1: COVER PAGE
  // ==========================================================================
  // Top Banner Gradient
  doc.setFillColor(...colors.primaryDark);
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Decorative Accent bar
  doc.setFillColor(...colors.accent);
  doc.rect(0, 88, pageWidth, 4, 'F');

  // App Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...colors.textLight);
  doc.text('RetailFlow POS', margin, 38);

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(224, 231, 255);
  doc.text('Complete Setup, Deployment & Operations Guide', margin, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(199, 210, 254);
  doc.text('Native Windows Desktop (EXE), Web Terminal, Customer Cloudflare Architecture & Central D1 Sync', margin, 56);

  // Badges
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 65, 36, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.primaryDark);
  doc.text('Version 1.0.0 / 1.1.0', margin + 4, 70.5);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 40, 65, 36, 8, 2, 2, 'F');
  doc.text('Production Release', margin + 44, 70.5);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 80, 65, 42, 8, 2, 2, 'F');
  doc.text('Cloudflare D1 Enabled', margin + 84, 70.5);

  // Body content: Table of Contents & Quick Summary
  let y = 110;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...colors.textDark);
  doc.text('Table of Contents', margin, y);
  y += 6;

  const tocItems = [
    { num: '1.0', title: 'Executive Overview & System Architecture', page: 'Page 2' },
    { num: '2.0', title: 'Installation & Deployment Options (EXE, MSI, Web)', page: 'Page 2' },
    { num: '3.0', title: 'First-Time Store Onboarding & Dynamic UPI QR Setup', page: 'Page 3' },
    { num: '4.0', title: 'Customer Self-Service Cloudflare Setup Wizard', page: 'Page 4' },
    { num: '5.0', title: 'Centralised Database (Cloudflare D1) & Delta Replication', page: 'Page 5' },
    { num: '6.0', title: 'Centralised Auto-Updates, Backups & Disaster Recovery', page: 'Page 6' },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const item of tocItems) {
    doc.setFillColor(...colors.cardBg);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
    doc.setDrawColor(...colors.cardBorder);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(item.num, margin + 4, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text(item.title, margin + 16, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text(item.page, pageWidth - margin - 22, y + 6.5);

    y += 13;
  }

  y += 5;
  // Key Features Highlight Card
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(margin, y, contentWidth, 36, 3, 3, 'F');
  doc.setDrawColor(...colors.primary);
  doc.roundedRect(margin, y, contentWidth, 36, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...colors.primaryDark);
  doc.text('Key Enterprise Capabilities Included:', margin + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.textDark);
  doc.text('• Sub-50ms local barcode scanning and bill checkout with 100% offline functionality.', margin + 5, y + 14);
  doc.text('• Real-time multi-counter inventory stock decrement & customer Khata credit balance sync.', margin + 5, y + 20);
  doc.text('• Dynamic NPCI UPI QR code generation on checkout screens, thermal receipts, and A4 invoices.', margin + 5, y + 26);
  doc.text('• Zero-terminal 1-click Cloudflare onboarding wizard for private D1 database & R2 backups.', margin + 5, y + 32);

  addFooter(1, 6);

  // ==========================================================================
  // PAGE 2: ARCHITECTURE & INSTALLATION
  // ==========================================================================
  doc.addPage();
  addHeader(2, 6, '1.0 Architecture & 2.0 Installation Options');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...colors.primaryDark);
  doc.text('1.0 Architecture Overview', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.textDark);
  const archDesc = 'RetailFlow POS employs an Offline-First Hybrid Architecture. Cash counters run locally on Windows Desktop (Tauri) or Web browsers (Tablets/Mobiles) with zero internet dependency. When online, registers replicate transactions asynchronously to a central Cloudflare D1 distributed SQLite database.';
  doc.text(doc.splitTextToSize(archDesc, contentWidth), margin, y);
  y += 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...colors.primaryDark);
  doc.text('2.0 Installation & Running Options', margin, y);
  y += 6;

  const installCards = [
    {
      title: 'Option A: Windows Setup Installer (.exe)',
      file: 'publish/RetailFlow_POS_v1.0.0_Setup.exe (3.54 MB)',
      desc: 'Standard 1-click Windows installer. Installs the application to Program Files, creates Start Menu and Desktop shortcuts, registers the uninstaller, and configures native auto-updating.',
      recommended: true,
    },
    {
      title: 'Option B: Enterprise MSI Package (.msi)',
      file: 'publish/RetailFlow_POS_v1.0.0_Enterprise.msi (4.77 MB)',
      desc: 'Windows Installer package built for IT administrators. Supports silent network deployment via Active Directory Group Policy (GPO), Microsoft Intune, and remote management tools.',
      recommended: false,
    },
    {
      title: 'Option C: Standalone Portable Executable (.exe)',
      file: 'publish/RetailFlow_POS_Portable.exe (9.93 MB)',
      desc: 'Zero-installation portable binary. Can be executed directly from a USB drive or local directory. Ideal for testing or running on secondary billing counters immediately.',
      recommended: false,
    },
    {
      title: 'Option D: Web Application & Local Network / Tablet POS',
      file: 'http://localhost:3000 or http://<local-ip>:3000',
      desc: 'Progressive Web Application (PWA). Run on iPads, Android tablets, or smartphones on the store Wi-Fi network without installing software. Scans barcodes using device camera.',
      recommended: false,
    },
  ];

  for (const card of installCards) {
    doc.setFillColor(...colors.cardBg);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
    doc.setDrawColor(...colors.cardBorder);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...colors.textDark);
    doc.text(card.title, margin + 4, y + 6);

    if (card.recommended) {
      doc.setFillColor(...colors.success);
      doc.roundedRect(pageWidth - margin - 32, y + 2, 28, 5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('RECOMMENDED', pageWidth - margin - 30, y + 5.5);
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.text(card.file, margin + 4, y + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.textMuted);
    const splitDesc = doc.splitTextToSize(card.desc, contentWidth - 8);
    doc.text(splitDesc, margin + 4, y + 16.5);

    y += 28;
  }

  // System Requirements Box
  y += 2;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.textDark);
  doc.text('Hardware & Software Requirements:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.textMuted);
  doc.text('• Windows: Windows 10 or Windows 11 (64-bit). Microsoft Edge WebView2 runtime (pre-installed on Win 10/11).', margin + 4, y + 11);
  doc.text('• Hardware: 4 GB RAM minimum (8 GB recommended), Intel Core i3 or equivalent, 200 MB disk space.', margin + 4, y + 16);
  doc.text('• Peripherals: Compatible with all ESC/POS 80mm/58mm thermal receipt printers, USB/Bluetooth barcode scanners.', margin + 4, y + 21);

  addFooter(2, 6);

  // ==========================================================================
  // PAGE 3: STORE ONBOARDING & DYNAMIC UPI QR
  // ==========================================================================
  doc.addPage();
  addHeader(3, 6, '3.0 Store Onboarding & Dynamic UPI QR System');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...colors.primaryDark);
  doc.text('3.0 First-Time Store Setup Wizard', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.textDark);
  const setupDesc = 'On initial application launch, RetailFlow POS greets the store manager with a 4-step Store Setup Wizard. Alternatively, settings can be updated anytime under Settings > Shop Details & Logo.';
  doc.text(doc.splitTextToSize(setupDesc, contentWidth), margin, y);
  y += 12;

  // Key fields table
  doc.setFillColor(...colors.tableHeader);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Setting Field', margin + 3, y + 5);
  doc.text('Description & Format', margin + 45, y + 5);
  doc.text('Used In', margin + 130, y + 5);
  y += 7;

  const fields = [
    { name: 'Shop Name', desc: 'Legal business or trade name displayed on bills.', used: 'All Invoices & Header' },
    { name: 'Store Logo', desc: 'PNG/JPEG/SVG logo. Embedded in base64.', used: 'A4 & Thermal Bills' },
    { name: 'GSTIN / Tax ID', desc: '15-digit Indian GST number (e.g. 32ABCDE1234F1Z5).', used: 'Tax Invoices & GST Reports' },
    { name: 'Currency Symbol', desc: 'Default ₹ (INR), $, €, or any custom unicode currency.', used: 'POS UI & Receipts' },
    { name: 'Merchant UPI ID', desc: 'Valid NPCI VPA (e.g. merchant@okaxis or mobile@paytm).', used: 'Dynamic QR Payments' },
    { name: 'Place of Supply', desc: 'State code and name (e.g. 32-Kerala).', used: 'CGST / SGST Invoices' },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (const f of fields) {
    doc.setFillColor(y % 14 === 0 ? 255 : 248, 250, 252);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setDrawColor(...colors.cardBorder);
    doc.line(margin, y + 7, pageWidth - margin, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text(f.name, margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text(f.desc, margin + 45, y + 5);
    doc.text(f.used, margin + 130, y + 5);

    y += 7;
  }

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...colors.primaryDark);
  doc.text('3.1 Dynamic NPCI UPI QR Payment Engine', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.textDark);
  const upiDesc = 'RetailFlow POS includes a built-in NPCI-compliant Dynamic UPI QR Engine. When the cashier tenders an order as UPI, the system calculates the exact net payable amount and generates a dynamic QR code containing the transaction note, amount, and store VPA:';
  doc.text(doc.splitTextToSize(upiDesc, contentWidth), margin, y);
  y += 14;

  // UPI Box
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'F');
  doc.setDrawColor(196, 181, 253);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(91, 33, 182);
  doc.text('upi://pay?pa=merchant@okaxis&pn=RetailFlow+Mart&am=450.00&cu=INR&tn=Invoice+INV-2026-1042', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.textDark);
  doc.text('Where Dynamic QR appears automatically:', margin + 4, y + 15);
  doc.text('1. Cashier Checkout Screen: Full-screen modal with amount auto-filled for customer phone scan.', margin + 4, y + 21);
  doc.text('2. Thermal Receipts (80mm/58mm): ESC/POS raster QR printed at bottom for instant customer record.', margin + 4, y + 27);
  doc.text('3. A4 GST Tax Invoices: High-resolution vector QR with B2B/B2C invoice details and payment link.', margin + 4, y + 33);

  y += 46;
  // High contrast typography notice
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text('High-Contrast Typography Engine (Zero Invisible Typing Bugs)', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87);
  doc.text('All input fields, search bars, customer select boxes, and payment dialogs feature explicit high-contrast foreground rules and vibrant caret-color indicators ensuring text is always crisp and visible in both Light and Dark themes.', margin + 4, y + 12);

  addFooter(3, 6);

  // ==========================================================================
  // PAGE 4: CLOUDFLARE SETUP WIZARD
  // ==========================================================================
  doc.addPage();
  addHeader(4, 6, '4.0 Customer Self-Service Cloudflare Setup');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...colors.primaryDark);
  doc.text('4.0 Customer Self-Service Cloudflare Setup Wizard', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.textDark);
  const cfDesc = 'Store owners are never forced to use complex CLI tools like Wrangler or terminal commands. RetailFlow POS includes an interactive, 4-step visual onboarding assistant directly in the Settings menu.';
  doc.text(doc.splitTextToSize(cfDesc, contentWidth), margin, y);
  y += 12;

  const cfSteps = [
    {
      step: 'Step 1: Get Free Cloudflare Credentials',
      details: '1. Log into your free Cloudflare account at cloudflare.com.\n2. Navigate to Workers & Pages to copy your 32-character Account ID.\n3. Click My Profile > API Tokens > Create Token.\n4. Select the "Edit Cloudflare Workers" template (grants access to Workers, D1, R2, KV).\n5. Click "Continue to Summary" > "Create Token" and copy the token string.',
    },
    {
      step: 'Step 2: Enter & Verify in POS Settings',
      details: '1. Open RetailFlow POS > Settings > Cloudflare Sync & Backup.\n2. Click "Launch Setup Wizard".\n3. Paste your Cloudflare Account ID and API Token.\n4. Click "Verify & Continue". The app validates permissions directly against Cloudflare v4 REST API.',
    },
    {
      step: 'Step 3: 1-Click Auto-Provisioning Engine',
      details: '1. Click "Auto-Provision Cloud Infrastructure".\n2. POS creates central D1 distributed SQLite database: "retailflow_pos_db".\n3. Automatically executes database schema migrations (sales, products, customers, mutation journal).\n4. Creates Cloudflare R2 backup storage bucket: "retailflow-backups".\n5. Configures serverless Cloudflare Worker API gateway.',
    },
    {
      step: 'Step 4: Diagnostics & Live Dashboard Access',
      details: '1. The wizard tests end-to-end connectivity with animated green checkmarks.\n2. Click "Save & Connect POS Terminals".\n3. Click "Open Dashboard" to launch your live Executive Cloud Dashboard Web Page!',
    },
  ];

  for (const s of cfSteps) {
    doc.setFillColor(...colors.cardBg);
    doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F');
    doc.setDrawColor(...colors.cardBorder);
    doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.accent);
    doc.text(s.step, margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.textDark);
    const split = doc.splitTextToSize(s.details, contentWidth - 8);
    doc.text(split, margin + 4, y + 10.5);

    y += 32;
  }

  // Dashboard Callout
  y += 2;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('Live Cloud Executive Dashboard Web Page (GET /)', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text('Once provisioned, your store URL (e.g. https://retailflow-pos-cloud.<subdomain>.workers.dev) hosts a live executive dashboard accessible from any phone or PC worldwide showing real-time gross revenue, order volume, active cashier shifts, and auto-refreshing transaction feeds.', margin + 4, y + 12);

  addFooter(4, 6);

  // ==========================================================================
  // PAGE 5: CENTRALISED DATABASE & DELTA REPLICATION
  // ==========================================================================
  doc.addPage();
  addHeader(5, 6, '5.0 Centralised Database (Cloudflare D1) & Sync');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...colors.primaryDark);
  doc.text('5.0 Centralised Database (Cloudflare D1) & Sync Engine', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.textDark);
  const d1Desc = 'RetailFlow POS transitions from siloed local registers into a Globally Distributed Central Database powered by Cloudflare D1 (Distributed SQLite). All counters (Counter 1 Desktop EXE, Counter 2 Web, Mobile tablets) share a single source of truth.';
  doc.text(doc.splitTextToSize(d1Desc, contentWidth), margin, y);
  y += 14;

  const d1Features = [
    {
      title: '1. Multi-Counter Real-Time Stock Decrement',
      desc: 'When Counter 1 (Windows EXE) sells 3 units of an item, Cloudflare D1 executes an atomic decrement in the products table. Within seconds, Counter 2 (Web Tablet) pulls the mutation and decrements its local stock count, eliminating double-selling.',
    },
    {
      title: '2. Consolidated Customer Khata (Store Credit Ledger)',
      desc: 'Customer credit limits, current outstanding balances, and loyalty points synchronize across all terminals. If a customer makes a partial repayment at Counter 1, their updated credit balance is immediately honored at Counter 2.',
    },
    {
      title: '3. Offline-First Resilience (Zero Latency at Checkout)',
      desc: 'Cashiers never wait for network requests during checkout. Scanning barcodes and completing transactions takes under 50ms locally. Mutations queue in local storage and push asynchronously when connectivity is present.',
    },
    {
      title: '4. Central Mutation Replication Journal (OpLog)',
      desc: 'All inserts, updates, and stock adjustments append to mutation_journal with an auto-incrementing sequence_id. Terminals pull only incremental changes since their last sync sequence, minimizing bandwidth consumption.',
    },
  ];

  for (const feat of d1Features) {
    doc.setFillColor(...colors.cardBg);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
    doc.setDrawColor(...colors.cardBorder);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.primary);
    doc.text(feat.title, margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.textDark);
    const split = doc.splitTextToSize(feat.desc, contentWidth - 8);
    doc.text(split, margin + 4, y + 11.5);

    y += 28;
  }

  y += 2;
  // Schema Overview Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...colors.textDark);
  doc.text('Central Relational Schema Tables in Cloudflare D1:', margin, y);
  y += 5;

  const tables = [
    { tbl: 'stores', purpose: 'Store branding, GSTIN, UPI ID, logo base64, tax preferences.' },
    { tbl: 'products', purpose: 'Master catalog, SKU, barcode, purchase & selling price, GST slab, stock quantity.' },
    { tbl: 'customers', purpose: 'Customer master, tier, credit balance, credit limit, total spent, loyalty points.' },
    { tbl: 'sales & items', purpose: 'Consolidated transactions, items sold, tenders (Cash/UPI/Card/Credit), cashier.' },
    { tbl: 'mutation_journal', purpose: 'Auto-incrementing delta log powering multi-terminal sync without data loss.' },
  ];

  doc.setFillColor(...colors.tableHeader);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Table Name', margin + 3, y + 4.5);
  doc.text('Enterprise Purpose & Multi-Terminal Functionality', margin + 45, y + 4.5);
  y += 6;

  for (const t of tables) {
    doc.setFillColor(y % 12 === 0 ? 255 : 248, 250, 252);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setDrawColor(...colors.cardBorder);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.primary);
    doc.text(t.tbl, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.textDark);
    doc.text(t.purpose, margin + 45, y + 4.5);

    y += 6;
  }

  addFooter(5, 6);

  // ==========================================================================
  // PAGE 6: AUTO-UPDATES & BACKUPS
  // ==========================================================================
  doc.addPage();
  addHeader(6, 6, '6.0 Centralised Auto-Updates & Day-End Backups');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...colors.primaryDark);
  doc.text('6.0 Centralised Auto-Updates Pipeline', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.textDark);
  doc.text('When code changes are made, updates distribute seamlessly to all terminals:', margin, y);
  y += 7;

  // EXE & Web update comparison
  doc.setFillColor(...colors.cardBg);
  doc.roundedRect(margin, y, contentWidth / 2 - 2, 38, 2, 2, 'F');
  doc.setDrawColor(...colors.cardBorder);
  doc.roundedRect(margin, y, contentWidth / 2 - 2, 38, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colors.primary);
  doc.text('Windows Desktop (EXE) Auto-Updater', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.textDark);
  doc.text('• Powered by native Tauri v1 Auto-Updater engine.', margin + 4, y + 12);
  doc.text('• Cryptographically verifies Ed25519 signatures.', margin + 4, y + 17);
  doc.text('• In-app update modal with changelog and progress bar.', margin + 4, y + 22);
  doc.text('• 1-Click "Download & Restart" applies differential patch.', margin + 4, y + 27);
  doc.text('• Local SQLite and settings preserved with zero data loss.', margin + 4, y + 32);

  const xRight = margin + contentWidth / 2 + 2;
  doc.setFillColor(...colors.cardBg);
  doc.roundedRect(xRight, y, contentWidth / 2 - 2, 38, 2, 2, 'F');
  doc.setDrawColor(...colors.cardBorder);
  doc.roundedRect(xRight, y, contentWidth / 2 - 2, 38, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colors.accent);
  doc.text('Web Application Continuous Deployment', xRight + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.textDark);
  doc.text('• Zero-downtime continuous deployment on Cloudflare Pages.', xRight + 4, y + 12);
  doc.text('• Background client polling checks /version.json every 5m.', xRight + 4, y + 17);
  doc.text('• Unobtrusive floating banner notifies cashier on new version.', xRight + 4, y + 22);
  doc.text('• 1-Click "Refresh & Apply" clears cache and updates PWA.', xRight + 4, y + 27);
  doc.text('• Never interrupts active transactions or tender modals.', xRight + 4, y + 32);

  y += 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...colors.primaryDark);
  doc.text('6.1 Dual Day-End Backups & Disaster Recovery', margin, y);
  y += 6;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(...colors.cardBorder);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.textDark);
  doc.text('Dual-Layer Redundant Backup Architecture:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.textMuted);
  doc.text('1. Local Installation Directory: Whenever a cashier closes a shift or triggers a manual backup, a JSON snapshot saves directly into the installation /backups folder for offline recovery.', margin + 4, y + 13);
  doc.text('2. Cloudflare R2 Encrypted Storage: Simultaneously packages encrypted snapshots to Cloudflare R2 for offsite catastrophe protection.', margin + 4, y + 21);
  doc.text('3. 1-Click Restore: Browse remote cloud backups in POS Settings and restore point-in-time state with 1 click.', margin + 4, y + 29);

  y += 40;
  // Publishing commands
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(248, 250, 252);
  doc.text('GitHub Release Publishing Commands (publish/ directory):', margin + 4, y + 6);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(56, 189, 248);
  doc.text('git tag v1.0.0', margin + 4, y + 13);
  doc.text('git push origin v1.0.0', margin + 4, y + 18);
  doc.text('gh release create v1.0.0 publish/*.exe publish/*.msi publish/*.zip --title "v1.0.0"', margin + 4, y + 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('GitHub Actions automatically signs Windows binaries and generates latest.json updater manifest.', margin + 4, y + 28.5);

  addFooter(6, 6);

  // Save PDF to project root
  const outputPath = path.resolve(__dirname, '../RETAILFLOW_POS_SETUP_GUIDE.pdf');
  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

  console.log(`[Success] Setup Guide PDF generated successfully at: ${outputPath}`);
  return outputPath;
}

try {
  createSetupGuidePdf();
} catch (e) {
  console.error('[Error] Failed to generate Setup Guide PDF:', e);
  process.exit(1);
}
