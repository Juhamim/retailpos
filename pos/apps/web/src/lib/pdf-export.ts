import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CompletedSale } from "../stores/sales-store";
import type { ProductWithCategory } from "@retailflow/shared-types";
import type { Shift } from "../stores/shift-store";
import type { PurchaseRecord } from "../stores/purchase-store";
import type { PurchaseReturnRecord } from "../stores/purchase-return-store";

// Format helper
const formatCurrency = (val: number) => `₹${val.toFixed(2)}`;

// Premium A4 GST Tax Invoice PDF Export
export const exportTaxInvoicePDF = (sale: CompletedSale, shop: any) => {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = 210;
  const margin = 14;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 5, "F");

  doc.setFillColor(59, 130, 246); // blue-500 accent stripe
  doc.rect(0, 5, pageWidth, 1.5, "F");

  // 2. Company Brand & Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(shop.shopName || "RetailFlow Mart", margin, 18);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const addressLines = [
    shop.address || "Main Street Commercial Center",
    `Phone: ${shop.phone || "N/A"}  |  Email: ${shop.email || "support@retailflow.in"}`,
    shop.gstNumber ? `GSTIN: ${shop.gstNumber}  |  State: 32-Kerala` : "State: 32-Kerala",
  ];
  doc.text(addressLines, margin, 24);

  // 3. Tax Invoice Header Right Badge
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(125, 12, 71, 24, 3, 3, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(125, 12, 71, 24, 3, 3, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text("ORIGINAL TAX INVOICE", 160.5, 18, { align: "center" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Invoice No: ${sale.invoiceNumber}`, 129, 24);
  doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString("en-IN")} ${new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 129, 29);
  doc.text(`Cashier: ${sale.cashierName || "Terminal 1"}`, 129, 34);

  // 4. Two-Column Cards: Billed To / Supply Details
  const cardY = 40;
  
  // Left: Customer Details Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cardY, 88, 22, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cardY, 88, 22, 2, 2, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("BILLED TO (CUSTOMER):", margin + 3, cardY + 5);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text([
    `Name: ${sale.customerName || "Walk-in Customer"}`,
    `Payment Mode: ${String(sale.paymentMethod || "CASH").toUpperCase()}`,
    `Invoice Status: COMPLETED / PAID`,
  ], margin + 3, cardY + 10);

  // Right: Dispatch / Store Details Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, cardY, 88, 22, 2, 2, "F");
  doc.roundedRect(108, cardY, 88, 22, 2, 2, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("PLACE OF SUPPLY & BILLING DETAILS:", 111, cardY + 5);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text([
    `Place of Supply: 32-Kerala (Intra-State)`,
    `Reverse Charge: No`,
    `Fulfillment: Retail POS In-Store Counter`,
  ], 111, cardY + 10);

  // 5. Itemized Table
  const tableHeaders = [
    ["#", "Item Description & SKU", "HSN/SAC", "Qty", "Rate", "Disc", "Taxable", "CGST", "SGST", "Total Amount"]
  ];

  const tableRows = sale.items.map((item, index) => {
    const itemTotal = item.unitPrice * item.quantity;
    const lineDiscount = itemTotal * (item.discountPercent / 100);
    const taxable = itemTotal - lineDiscount;
    const cgstAmt = item.taxAmount / 2;
    const sgstAmt = item.taxAmount / 2;

    return [
      String(index + 1),
      `${item.productName}\nSKU: ${item.productSku || "N/A"}`,
      item.hsnCode || "-",
      String(item.quantity),
      `₹${item.unitPrice.toFixed(2)}`,
      item.discountPercent > 0 ? `${item.discountPercent}%` : "-",
      `₹${taxable.toFixed(2)}`,
      `${(item.taxRate / 2)}%\n₹${cgstAmt.toFixed(2)}`,
      `${(item.taxRate / 2)}%\n₹${sgstAmt.toFixed(2)}`,
      `₹${item.totalAmount.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: 66,
    head: tableHeaders,
    body: tableRows,
    theme: "grid",
    headStyles: { 
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
      halign: "center",
    },
    styles: { 
      fontSize: 7, 
      font: "Helvetica",
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 6, halign: "center" },
      1: { cellWidth: 50 },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 9, halign: "center" },
      4: { cellWidth: 16, halign: "right" },
      5: { cellWidth: 10, halign: "center" },
      6: { cellWidth: 18, halign: "right" },
      7: { cellWidth: 17, halign: "right" },
      8: { cellWidth: 17, halign: "right" },
      9: { cellWidth: 21, halign: "right", fontStyle: "bold" }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // 6. Summary Panels (Side by Side)
  // Left: GST Breakup & Notes
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, finalY, 100, 36, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, finalY, 100, 36, 2, 2, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("TAX BREAKDOWN SUMMARY (INR):", margin + 3, finalY + 5);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Taxable Supplies : ₹${(sale.subtotal - sale.discountAmount).toFixed(2)}`, margin + 3, finalY + 11);
  doc.text(`Central Tax (CGST Total): ₹${(sale.taxAmount / 2).toFixed(2)}`, margin + 3, finalY + 16);
  doc.text(`State Tax (SGST Total)  : ₹${(sale.taxAmount / 2).toFixed(2)}`, margin + 3, finalY + 21);
  doc.text(`Total GST Liability     : ₹${sale.taxAmount.toFixed(2)}`, margin + 3, finalY + 26);
  doc.text(`Terms: Warranty claims valid with this original tax invoice.`, margin + 3, finalY + 32);

  // Right: Grand Total Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(120, finalY, 76, 36, 2, 2, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(120, finalY, 76, 36, 2, 2, "D");

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Items Subtotal:", 123, finalY + 6);
  doc.text(`₹${sale.subtotal.toFixed(2)}`, 193, finalY + 6, { align: "right" });

  doc.text("GST Tax Total:", 123, finalY + 12);
  doc.text(`+₹${sale.taxAmount.toFixed(2)}`, 193, finalY + 12, { align: "right" });

  if (sale.discountAmount > 0) {
    doc.setTextColor(16, 185, 129); // green
    doc.text("Discounts:", 123, finalY + 18);
    doc.text(`-₹${sale.discountAmount.toFixed(2)}`, 193, finalY + 18, { align: "right" });
    doc.setTextColor(51, 65, 85);
  }

  // Grand Total Highlight Banner
  doc.setFillColor(15, 23, 42); // dark navy
  doc.roundedRect(121, finalY + 23, 74, 11, 2, 2, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("NET PAYABLE:", 124, finalY + 30);
  doc.text(`₹${sale.totalAmount.toFixed(2)}`, 193, finalY + 30, { align: "right" });

  // 7. Signature & Certification Footer
  const footerY = Math.max(finalY + 44, 255);

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Thank you for your business! Goods once sold are covered under retailer warranty terms.", margin, footerY + 5);
  doc.text("This is an authenticated computer-generated GST Tax Invoice.", margin, footerY + 9);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`For ${shop.shopName || "RetailFlow Mart"}`, 150, footerY + 14, { align: "center" });
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Authorized Signatory / Cashier Stamp", 150, footerY + 22, { align: "center" });

  doc.save(`Tax_Invoice_${sale.invoiceNumber}.pdf`);
};

// Financial Summary PDF
export const exportFinancialReportPDF = (sales: CompletedSale[], expenses: any[], dateRange: string) => {
  const doc = new jsPDF();
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Financial Analytics & Sales Report", 14, 20);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Period: ${dateRange} • Generated: ${new Date().toLocaleString()}`, 14, 26);

  const grossSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTax = sales.reduce((sum, s) => sum + s.taxAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  let totalCOGS = 0;
  for (const s of sales) {
    for (const item of s.items) {
      totalCOGS += (item.purchasePrice || item.unitPrice * 0.7) * item.quantity;
    }
  }
  const grossProfit = Math.max(0, grossSales - totalCOGS);
  const netProfit = grossProfit - totalExpenses;

  autoTable(doc, {
    startY: 32,
    head: [["Financial Metric", "Amount (INR)"]],
    body: [
      ["Gross Sales Revenue", formatCurrency(grossSales)],
      ["Cost of Goods Sold (COGS)", formatCurrency(totalCOGS)],
      ["Gross Profit Margin", formatCurrency(grossProfit)],
      ["Total Business Expenses", formatCurrency(totalExpenses)],
      ["Net Register Profit", formatCurrency(netProfit)],
      ["GST Output Liability", formatCurrency(totalTax)]
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59] } // dark slate
  });

  const nextY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Detailed Invoice Records", 14, nextY);

  const invoicesRows = sales.map(s => [
    s.invoiceNumber,
    new Date(s.createdAt).toLocaleDateString(),
    s.customerName || "Walk-in",
    s.paymentMethod.toUpperCase(),
    formatCurrency(s.totalAmount)
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [["Invoice No", "Date", "Customer", "Payment Mode", "Total"]],
    body: invoicesRows,
    theme: "striped"
  });

  doc.save(`Financial_Report_${Date.now()}.pdf`);
};

// Inventory Valuation Report
export const exportInventoryValuationPDF = (products: ProductWithCategory[]) => {
  const doc = new jsPDF();

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Inventory Stock Valuation Report", 14, 20);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

  let totalAssetValue = 0;
  let totalRetailValue = 0;
  let totalProductsCount = products.length;

  for (const p of products) {
    totalAssetValue += p.purchasePrice * p.stockQuantity;
    totalRetailValue += p.sellingPrice * p.stockQuantity;
  }

  autoTable(doc, {
    startY: 32,
    head: [["Summary Metric", "Value"]],
    body: [
      ["Total Product SKU Lines", String(totalProductsCount)],
      ["Total Asset Value (Purchase Price)", formatCurrency(totalAssetValue)],
      ["Total Retail Value (Selling Price)", formatCurrency(totalRetailValue)],
      ["Expected Profit on Stock", formatCurrency(totalRetailValue - totalAssetValue)]
    ],
    theme: "grid",
    headStyles: { fillColor: [4, 120, 87] } // emerald-700
  });

  const nextY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Current Stock Inventory Status", 14, nextY);

  const stockRows = products.map(p => [
    p.name,
    p.sku,
    p.categoryName || "N/A",
    String(p.stockQuantity),
    p.purchasePrice.toFixed(2),
    (p.purchasePrice * p.stockQuantity).toFixed(2)
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [["Product Name", "SKU", "Category", "In Stock", "Purchase Price", "Valuation"]],
    body: stockRows,
    theme: "striped"
  });

  doc.save(`Inventory_Valuation_${Date.now()}.pdf`);
};

// Shift Closure Z-Report PDF
export const exportZReportPDF = (shift: Shift) => {
  const doc = new jsPDF();

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Shift Z-Report (Register Closure)`, 14, 20);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text([
    `Cashier: ${shift.username}`,
    `Register Opened: ${new Date(shift.openedAt).toLocaleString()}`,
    `Register Closed: ${shift.closedAt ? new Date(shift.closedAt).toLocaleString() : "N/A"}`
  ], 14, 26);

  const expectedDrawer = shift.expectedCash;
  const actualDrawer = shift.actualCash ?? 0;
  const discrepancy = actualDrawer - expectedDrawer;

  autoTable(doc, {
    startY: 42,
    head: [["Register Status", "Amount (INR)"]],
    body: [
      ["Opening Float", formatCurrency(shift.openingFloat)],
      ["Expected Cash in Drawer", formatCurrency(expectedDrawer)],
      ["Actual Cash Reconciled", formatCurrency(actualDrawer)],
      ["Drawer Discrepancy", discrepancy === 0 ? "Perfect Match" : formatCurrency(discrepancy)],
      ["Total Sales Revenue", formatCurrency(shift.salesTotal)],
      ["Total Transactions Count", String(shift.salesCount)]
    ],
    theme: "grid",
    headStyles: { fillColor: [124, 58, 237] } // violet-600
  });

  const nextY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Sales Payment Distribution", 14, nextY);

  const breakdownRows = Object.entries(shift.paymentBreakdown).map(([mode, amt]) => [
    mode.toUpperCase(),
    formatCurrency(amt)
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [["Payment Mode", "Total Allocated"]],
    body: breakdownRows,
    theme: "striped"
  });

  doc.save(`Z_Report_${shift.id}.pdf`);
};

// GST GSTR-1 Portal Submission Report (CSV Download)
export const exportGstReportCSV = (sales: CompletedSale[], dateRange: string) => {
  const headers = [
    "GSTIN/UIN of Recipient",
    "Receiver Name",
    "Invoice Number",
    "Invoice Date",
    "Invoice Value",
    "Place Of Supply",
    "Reverse Charge",
    "Applicable % of Tax Rate",
    "Invoice Type",
    "E-Commerce GSTIN",
    "Rate",
    "Taxable Value",
    "Central Tax (CGST)",
    "State Tax (SGST)",
    "Total Tax Value"
  ];

  const rows: string[][] = [];

  for (const sale of sales) {
    const isB2B = !!sale.customerId && sale.customerName !== "Walk-in";
    const dateFormatted = new Date(sale.createdAt).toLocaleDateString("en-GB"); // DD/MM/YYYY

    // Group items by GST rate
    const gstRateGroups = new Map<number, { taxableValue: number; taxAmount: number }>();
    
    for (const item of sale.items) {
      const current = gstRateGroups.get(item.taxRate) || { taxableValue: 0, taxAmount: 0 };
      const itemTotal = item.unitPrice * item.quantity;
      const discount = itemTotal * (item.discountPercent / 100);
      current.taxableValue += (itemTotal - discount);
      current.taxAmount += item.taxAmount;
      gstRateGroups.set(item.taxRate, current);
    }

    for (const [rate, values] of gstRateGroups.entries()) {
      rows.push([
        "", // Recipient GSTIN if B2B (could fetch from customer profiles, we will leave empty or add dummy if B2C)
        sale.customerName || "Walk-in Customer",
        sale.invoiceNumber,
        dateFormatted,
        sale.totalAmount.toFixed(2),
        "32-Kerala", // Default POS location (State code + Name)
        "N", // Reverse Charge
        "", // Applicable % of Tax Rate
        isB2B ? "B2B" : "B2CS", // Invoice Type (Business to Customer Small)
        "", // E-Commerce GSTIN
        `${rate}`,
        values.taxableValue.toFixed(2),
        (values.taxAmount / 2).toFixed(2),
        (values.taxAmount / 2).toFixed(2),
        values.taxAmount.toFixed(2)
      ]);
    }
  }

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `GSTR1_Report_${dateRange.replace(/\s+/g, "_")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// GSTR-2 Inward Supplies (Purchase Register) GST CSV Exporter
export const exportGstr2Csv = (purchases: PurchaseRecord[], dateRange: string) => {
  const headers = [
    "Supplier GSTIN",
    "Supplier Name",
    "Invoice Number",
    "Invoice Date",
    "GST Rate (%)",
    "Taxable Value (INR)",
    "Central Tax (CGST)",
    "State Tax (SGST)",
    "Total GST Input Claimed"
  ];

  const rows: string[][] = [];
  for (const pur of purchases) {
    const dateFormatted = new Date(pur.createdAt).toLocaleDateString("en-GB");

    const rateGroups = new Map<number, { taxableValue: number; taxAmount: number }>();
    for (const item of pur.items) {
      const current = rateGroups.get(item.taxRate) || { taxableValue: 0, taxAmount: 0 };
      current.taxableValue += (item.purchasePrice * item.quantity);
      current.taxAmount += item.taxAmount;
      rateGroups.set(item.taxRate, current);
    }

    for (const [rate, values] of rateGroups.entries()) {
      rows.push([
        "32AAAAA1111A1Z1",
        pur.supplierName,
        pur.invoiceNumber,
        dateFormatted,
        `${rate}%`,
        values.taxableValue.toFixed(2),
        (values.taxAmount / 2).toFixed(2),
        (values.taxAmount / 2).toFixed(2),
        values.taxAmount.toFixed(2)
      ]);
    }
  }

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `GSTR2_Report_${dateRange.replace(/\s+/g, "_")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// GSTR-3B Consolidated Return (PDF Exporter)
export const exportGstr3bPDF = (sales: CompletedSale[], purchases: PurchaseRecord[], dateRange: string) => {
  const doc = new jsPDF();
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text("GSTR-3B Consolidated Return Summary", 14, 20);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Period: ${dateRange} • Generated: ${new Date().toLocaleString()}`, 14, 26);
  
  // Outward supplies totals (Liabilities)
  const totalOutwardSales = sales.reduce((sum, s) => sum + s.subtotal, 0);
  const totalOutwardTax = sales.reduce((sum, s) => sum + s.taxAmount, 0);
  
  // Inward supplies totals (Input Credit Claimed)
  const totalInwardPurchases = purchases.reduce((sum, p) => sum + p.subtotal, 0);
  const totalInwardTax = purchases.reduce((sum, p) => sum + p.taxAmount, 0);
  
  // Net GST payable
  const netGstPayable = Math.max(0, totalOutwardTax - totalInwardTax);
  
  autoTable(doc, {
    startY: 32,
    head: [["Section", "Taxable Value (INR)", "CGST (INR)", "SGST (INR)", "Total GST Liability (INR)"]],
    body: [
      ["1. Outward Taxable Supplies (Sales)", totalOutwardSales.toFixed(2), (totalOutwardTax/2).toFixed(2), (totalOutwardTax/2).toFixed(2), totalOutwardTax.toFixed(2)],
      ["2. Eligible Input Tax Credit (Purchases)", totalInwardPurchases.toFixed(2), (totalInwardTax/2).toFixed(2), (totalInwardTax/2).toFixed(2), totalInwardTax.toFixed(2)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Summary Reconciliation:", 14, finalY);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text([
    `Total Outward GST Liability: ₹${totalOutwardTax.toFixed(2)}`,
    `Total Eligible Input Tax Credit (ITC): ₹${totalInwardTax.toFixed(2)}`,
    `Final Net GST Payable to Government: ₹${netGstPayable.toFixed(2)}`
  ], 14, finalY + 8);
  
  doc.save(`GSTR3B_Consolidated_Return_${Date.now()}.pdf`);
};

// Supplier Purchases Returns A4 Debit Note PDF Exporter
export const exportDebitNotePDF = (record: PurchaseReturnRecord) => {
  const doc = new jsPDF();

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.text("DEBIT NOTE", 14, 22);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text([
    "RetailFlow Commerce POS System",
    "GST State Location: 32-Kerala",
    "Compliance: Commercial Purpose Ready"
  ], 14, 28);

  doc.setFontSize(10);
  doc.text([
    `Debit Note Number: ${record.debitNoteNumber}`,
    `Reference Bill Number: ${record.purchaseInvoiceNumber}`,
    `Date Filed: ${new Date(record.createdAt).toLocaleDateString()}`,
    `Supplier: ${record.supplierName}`
  ], 120, 22);

  autoTable(doc, {
    startY: 42,
    head: [["Item Name", "Qty Returned", "Purchase Rate (INR)", "Tax Rate", "Total Value (INR)"]],
    body: record.itemsReturned.map((item) => [
      item.productName,
      item.quantity.toString(),
      item.purchasePrice.toFixed(2),
      `${item.taxRate}%`,
      item.totalAmount.toFixed(2)
    ]),
    theme: "striped",
    headStyles: { fillColor: [225, 29, 72] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total Defective Refund Value: ₹${record.totalRefundAmount.toFixed(2)}`, 14, finalY);

  if (record.notes) {
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9);
    doc.text(`Notes: ${record.notes}`, 14, finalY + 8);
  }

  doc.save(`Debit_Note_${record.debitNoteNumber}.pdf`);
};

// Comprehensive Stock & Inventory Valuation A4 PDF Exporter
export const exportStockInventoryReportPDF = (products: ProductWithCategory[], sales: CompletedSale[]) => {
  const doc = new jsPDF({ format: "a4" });

  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 4, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("Comprehensive Inventory & Stock Valuation Report", 14, 18);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}  |  Active Catalog Items: ${products.length} SKUs`, 14, 24);

  let totalCostValuation = 0;
  let totalRetailValuation = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of products) {
    totalCostValuation += (p.purchasePrice || 0) * (p.stockQuantity || 0);
    totalRetailValuation += (p.sellingPrice || 0) * (p.stockQuantity || 0);
    if (p.stockQuantity <= 0) outOfStockCount++;
    else if (p.stockQuantity <= (p.reorderLevel || 5)) lowStockCount++;
  }

  const potentialGrossMargin = totalRetailValuation - totalCostValuation;

  autoTable(doc, {
    startY: 30,
    head: [["Catalog Metric", "Value (INR)", "Status & Remarks"]],
    body: [
      ["Total Asset Value (Cost / Wholesale)", formatCurrency(totalCostValuation), "Capital invested in current warehouse stock"],
      ["Total Realizable Retail Value", formatCurrency(totalRetailValuation), "Projected revenue at standard selling price"],
      ["Potential Unrealized Gross Profit", formatCurrency(potentialGrossMargin), `${Math.round((potentialGrossMargin / (totalRetailValuation || 1)) * 100)}% projected retail margin`],
      ["Out of Stock Alert", `${outOfStockCount} SKUs`, outOfStockCount > 0 ? "URGENT: Requires immediate supplier reorder" : "All lines in stock"],
      ["Low Stock Warning", `${lowStockCount} SKUs`, lowStockCount > 0 ? "Approaching safety buffer threshold" : "Optimal safety stock"]
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8 }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Itemized SKU Inventory Details & Valuation", 14, nextY);

  const productRows = products.map((p, idx) => {
    const costVal = (p.purchasePrice || 0) * (p.stockQuantity || 0);
    const status = p.stockQuantity <= 0 ? "OUT OF STOCK" : p.stockQuantity <= (p.reorderLevel || 5) ? "LOW STOCK" : "HEALTHY";
    return [
      String(idx + 1),
      `${p.name}\nSKU: ${p.sku}`,
      p.categoryName || "General",
      String(p.stockQuantity),
      `₹${p.purchasePrice.toFixed(2)}`,
      `₹${p.sellingPrice.toFixed(2)}`,
      `₹${costVal.toFixed(2)}`,
      status
    ];
  });

  autoTable(doc, {
    startY: nextY + 4,
    head: [["#", "Product & SKU", "Category", "Stock", "Cost", "Price", "Valuation", "Status"]],
    body: productRows,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: "center", fontStyle: "bold" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 24, halign: "right", fontStyle: "bold" },
      7: { cellWidth: 25, halign: "center" }
    }
  });

  doc.save(`Stock_Inventory_Report_${Date.now()}.pdf`);
};

// Cashier & Register Shifts Performance Report PDF
export const exportCashierPerformanceReportPDF = (shifts: Shift[], sales: CompletedSale[]) => {
  const doc = new jsPDF({ format: "a4" });

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 4, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("Cashier Register Shifts & Reconciliation Audit", 14, 18);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Shift Logs: ${shifts.length}`, 14, 24);

  const shiftRows = shifts.map((s, idx) => {
    const discrepancy = (s.actualCash ?? 0) - s.expectedCash;
    const discStr = discrepancy === 0 ? "Match (₹0)" : discrepancy > 0 ? `+₹${discrepancy.toFixed(0)}` : `-₹${Math.abs(discrepancy).toFixed(0)}`;
    return [
      String(idx + 1),
      s.username,
      new Date(s.openedAt).toLocaleDateString(),
      s.closedAt ? new Date(s.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Open",
      String(s.salesCount),
      `₹${s.salesTotal.toFixed(2)}`,
      `₹${(s.actualCash ?? 0).toFixed(2)}`,
      discStr
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [["#", "Cashier", "Date", "Closed At", "Orders", "Sales Total", "Drawer Cash", "Discrepancy"]],
    body: shiftRows,
    theme: "striped",
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 32, fontStyle: "bold" },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 28, halign: "right" },
      6: { cellWidth: 28, halign: "right" },
      7: { cellWidth: 26, halign: "center", fontStyle: "bold" }
    }
  });

  doc.save(`Cashier_Performance_Audit_${Date.now()}.pdf`);
};

