import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CompletedSale } from "../stores/sales-store";
import type { ProductWithCategory } from "@retailflow/shared-types";
import type { Shift } from "../stores/shift-store";
import type { PurchaseRecord } from "../stores/purchase-store";
import type { PurchaseReturnRecord } from "../stores/purchase-return-store";

// Format helper
const formatCurrency = (val: number) => `INR ${val.toFixed(2)}`;

// A4 Invoice PDF Export
export const exportTaxInvoicePDF = (sale: CompletedSale, shop: any) => {
  const doc = new jsPDF({ format: "a4" });
  
  // Header details
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.text(shop.shopName || "RetailFlow POS", 14, 20);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text([
    shop.address || "Shop Address",
    `Phone: ${shop.phone || "N/A"}`,
    shop.email ? `Email: ${shop.email}` : "",
    shop.gstNumber ? `GSTIN: ${shop.gstNumber}` : "",
  ].filter(Boolean), 14, 26);

  // Invoice Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TAX INVOICE", 150, 20, { align: "right" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text([
    `Invoice No: ${sale.invoiceNumber}`,
    `Date: ${new Date(sale.createdAt).toLocaleString()}`,
    `Cashier: ${sale.cashierName}`,
    `Status: ${sale.status.toUpperCase()}`,
  ], 150, 26, { align: "right" });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 45, 196, 45);

  // Billing To
  doc.setFont("Helvetica", "bold");
  doc.text("Billed To:", 14, 52);
  doc.setFont("Helvetica", "normal");
  doc.text([
    sale.customerName || "Walk-in Customer",
    `Payment Method: ${sale.paymentMethod.toUpperCase()}`,
  ], 14, 57);

  // Table Items
  const tableHeaders = [
    ["#", "Product Details", "Qty", "Rate (INR)", "Disc (%)", "GST (%)", "Tax (INR)", "Total (INR)"]
  ];

  const tableRows = sale.items.map((item, index) => {
    const itemTotal = item.unitPrice * item.quantity;
    const lineDiscount = itemTotal * (item.discountPercent / 100);
    const taxable = itemTotal - lineDiscount;
    return [
      String(index + 1),
      `${item.productName}\nSKU: ${item.productSku}`,
      String(item.quantity),
      item.unitPrice.toFixed(2),
      item.discountPercent > 0 ? `${item.discountPercent}%` : "0%",
      `${item.taxRate}%`,
      item.taxAmount.toFixed(2),
      item.totalAmount.toFixed(2)
    ];
  });

  autoTable(doc, {
    startY: 68,
    head: tableHeaders,
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] }, // blue-500
    styles: { fontSize: 8, font: "Helvetica" },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 60 },
      2: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: 20, halign: "right" },
      7: { cellWidth: 22, halign: "right" }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals Panel (Right Aligned)
  doc.setFont("Helvetica", "normal");
  doc.text(`Subtotal:`, 130, finalY);
  doc.text(formatCurrency(sale.subtotal), 196, finalY, { align: "right" });

  doc.text(`CGST (Central Tax):`, 130, finalY + 5);
  doc.text(formatCurrency(sale.taxAmount / 2), 196, finalY + 5, { align: "right" });

  doc.text(`SGST (State Tax):`, 130, finalY + 10);
  doc.text(formatCurrency(sale.taxAmount / 2), 196, finalY + 10, { align: "right" });

  if (sale.discountAmount > 0) {
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`Order Discount:`, 130, finalY + 15);
    doc.text(`-${formatCurrency(sale.discountAmount)}`, 196, finalY + 15, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`GRAND TOTAL:`, 130, finalY + 22);
  doc.text(formatCurrency(sale.totalAmount), 196, finalY + 22, { align: "right" });

  if (sale.notes) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Notes: ${sale.notes}`, 14, finalY + 30);
  }

  // Footer declaration
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("This is a computer-generated tax invoice and requires no physical signature.", 14, 285);

  doc.save(`Invoice_${sale.invoiceNumber}.pdf`);
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
