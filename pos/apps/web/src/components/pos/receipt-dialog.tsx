"use client";

import React, { useState, useEffect } from "react";
import { CartItem } from "@retailflow/shared-types";
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Download, 
  FileText, 
  Smartphone,
  CreditCard,
  QrCode,
  ShieldCheck,
  Receipt,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User,
  Hash
} from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { useAppStore } from "@/stores/app-store";
import { useCustomerStore } from "@/stores/customer-store";
import { exportTaxInvoicePDF } from "@/lib/pdf-export";
import { generateUpiQrDataUrl, generateThermalUpiQr, generateUpiPaymentUrl } from "@/lib/upi-qr";
import { numberToWordsIndian, calculateHsnTaxBreakdown } from "@/lib/invoice-utils";

interface ReceiptDialogProps {
  invoiceNumber: string;
  total: number;
  items: CartItem[];
  customerName?: string;
  paymentMethod?: string;
  onClose: () => void;
}

export function ReceiptDialog({
  invoiceNumber,
  total,
  items,
  customerName,
  paymentMethod = "Cash",
  onClose,
}: ReceiptDialogProps) {
  const shop = useSettingsStore((state) => state.settings.shop);
  const customers = useCustomerStore((state) => state.customers);
  const currentUser = useAppStore((state) => state.currentUser);
  
  const customerObj = customers.find((c) => c.name === customerName);
  
  // Default to A4 Full Tax Invoice
  const [format, setFormat] = useState<"invoice" | "thermal">("invoice");
  const [phone, setPhone] = useState(customerObj?.phone || "");
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [dynamicUpiQr, setDynamicUpiQr] = useState<string>("");
  const [thermalUpiQr, setThermalUpiQr] = useState<string>("");

  useEffect(() => {
    if (shop.upiId && total > 0) {
      generateUpiQrDataUrl({
        upiId: shop.upiId,
        payeeName: shop.shopName,
        amount: total,
        invoiceNumber,
      }).then(setDynamicUpiQr);

      generateThermalUpiQr({
        upiId: shop.upiId,
        payeeName: shop.shopName,
        amount: total,
        invoiceNumber,
      }).then(setThermalUpiQr);
    }
  }, [shop.upiId, shop.shopName, total, invoiceNumber]);

  const now = new Date();
  
  // Accurate financial aggregations
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalDiscount = Math.max(0, (subtotal + totalTax) - total);
  const taxableSubtotal = Math.max(0, subtotal - totalDiscount);
  const hsnRows = calculateHsnTaxBreakdown(items);
  const amountInWords = numberToWordsIndian(total);

  const handleExportPDF = () => {
    const saleData: any = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      customerId: customerObj?.id,
      customerName: customerName || "Walk-in Customer",
      items,
      subtotal,
      taxAmount: totalTax,
      discountAmount: totalDiscount,
      totalAmount: total,
      paymentMethod: paymentMethod as any,
      payments: [{ method: paymentMethod as any, amount: total }],
      status: "completed" as any,
      cashierName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Cashier",
      createdAt: now.toISOString()
    };
    exportTaxInvoicePDF(saleData, shop);
  };

  const triggerWhatsApp = () => {
    if (!phone) {
      setShowPhonePrompt(true);
    } else {
      sendWhatsApp(phone);
    }
  };

  const sendWhatsApp = (targetPhone: string) => {
    const cleanPhone = targetPhone.replace(/[^0-9]/g, "");
    if (!cleanPhone) return;
    const itemsText = items.map((item) => `- ${item.productName} (x${item.quantity}): ₹${item.totalAmount.toFixed(2)}`).join("\n");
    
    const upiPayUrl = shop.upiId ? generateUpiPaymentUrl({
      upiId: shop.upiId,
      payeeName: shop.shopName,
      amount: total,
      invoiceNumber,
    }) : "";

    let msg = `*TAX INVOICE FROM ${shop.shopName}*\n------------------------------\nInvoice No: ${invoiceNumber}\nDate: ${now.toLocaleDateString("en-IN")}\nCustomer: ${customerName || "Walk-in"}\nTotal Amount: ₹${total.toFixed(2)}\nItems:\n${itemsText}\n------------------------------\n`;
    if (upiPayUrl) {
      msg += `💳 Pay Instantly via UPI (GPay/PhonePe):\n${upiPayUrl}\n------------------------------\n`;
    }
    msg += `Thank you for shopping with us!`;

    const url = `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setShowPhonePrompt(false);
  };

  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    let content = `====================================================\n`;
    content += `                ${shop.shopName.toUpperCase()}\n`;
    content += `   ${shop.address}\n`;
    content += `   Ph: ${shop.phone}  |  GSTIN: ${shop.gstNumber || "N/A"}\n`;
    content += `====================================================\n`;
    content += `INVOICE NO: ${invoiceNumber}          DATE: ${dateStr} ${timeStr}\n`;
    content += `CUSTOMER  : ${customerName || "Walk-in Customer"}\n`;
    content += `PAYMENT   : ${paymentMethod.toUpperCase()}              STATUS: COMPLETED\n`;
    content += `----------------------------------------------------\n`;
    content += `ITEM                QTY    PRICE     TAX(%)    TOTAL\n`;
    content += `----------------------------------------------------\n`;
    for (const item of items) {
      const name = item.productName.padEnd(18).slice(0, 18);
      const qty = String(item.quantity).padStart(3);
      const price = item.unitPrice.toFixed(2).padStart(8);
      const tax = `${item.taxRate}%`.padStart(6);
      const rowTotal = item.totalAmount.toFixed(2).padStart(8);
      content += `${name} ${qty} ${price} ${tax} ${rowTotal}\n`;
    }
    content += `----------------------------------------------------\n`;
    content += `Subtotal  : ₹${subtotal.toFixed(2)}\n`;
    content += `CGST (Tax): ₹${(totalTax / 2).toFixed(2)}\n`;
    content += `SGST (Tax): ₹${(totalTax / 2).toFixed(2)}\n`;
    if (totalDiscount > 0) content += `Discount  : -₹${totalDiscount.toFixed(2)}\n`;
    content += `====================================================\n`;
    content += `GRAND TOTAL (NET PAYABLE): ₹${total.toFixed(2)}\n`;
    content += `IN WORDS: ${amountInWords}\n`;
    content += `====================================================\n`;
    content += `        THANK YOU FOR YOUR VALUED BUSINESS!\n`;
    content += `====================================================\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Tax_Invoice_${invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:rounded-none print:w-full print:max-w-none">
        
        {/* Top Dialog Toolbar (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2 tracking-tight">
                Sale Completed • Invoice #{invoiceNumber}
              </h2>
              <p className="text-xs text-slate-400">
                Paid ₹{total.toFixed(2)} via {paymentMethod} • Register: Terminal 1
              </p>
            </div>
          </div>

          {/* Format Selector Toggle */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setFormat("invoice")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                format === "invoice"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> A4 Tax Invoice (Standard)
            </button>
            <button
              onClick={() => setFormat("thermal")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                format === "thermal"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Receipt className="h-3.5 w-3.5" /> Thermal 80mm Slip
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Invoice View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/80 print:p-0 print:bg-white">
          
          {format === "invoice" ? (
            /* ==================== EXECUTIVE A4 TAX INVOICE ==================== */
            <div
              id="printable-receipt"
              className="bg-white border border-slate-200/90 rounded-2xl shadow-sm max-w-3xl mx-auto overflow-hidden print:border-none print:shadow-none print:p-0 print:max-w-none print:rounded-none"
            >
              {/* Top Branded Accent Bar */}
              <div className="h-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 w-full" />

              <div className="p-6 sm:p-10 space-y-6">
                
                {/* 1. Header: Store Branding & Tax Invoice Metadata */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
                  {/* Store Details */}
                  <div className="space-y-2 max-w-md">
                    <div className="flex items-center gap-3">
                      {shop.logo ? (
                        <img
                          src={shop.logo}
                          alt={shop.shopName}
                          className="h-12 max-w-[160px] object-contain rounded p-1 bg-slate-50 border border-slate-100"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                          {shop.shopName?.[0] || "R"}
                        </div>
                      )}
                      <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                          {shop.shopName || "RetailFlow Mart"}
                        </h1>
                        <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">
                          Tax Invoice & Retail Billing
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {shop.address || "Main Commercial Street, City Center"}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <strong>Phone:</strong> {shop.phone || "N/A"}
                      </span>
                      {shop.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <strong>Email:</strong> {shop.email}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {shop.gstNumber ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50/80 text-indigo-900 text-xs font-bold rounded-lg border border-indigo-200/60 font-mono">
                          <span className="text-[10px] uppercase font-bold text-indigo-600">GSTIN:</span>
                          <span>{shop.gstNumber}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">Regular Tax Scheme</span>
                      )}
                      <span className="text-xs text-slate-500 font-semibold">• State: 32-Kerala</span>
                    </div>
                  </div>

                  {/* Invoice Header Badge Box */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:min-w-[240px] text-right space-y-2 self-stretch sm:self-auto shadow-2xs">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="inline-block px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md">
                        TAX INVOICE
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Original
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Invoice Number</p>
                      <p className="text-base font-black text-slate-900 font-mono tracking-tight">#{invoiceNumber}</p>
                    </div>

                    <div className="border-t border-slate-200/80 pt-2 space-y-1 text-xs text-slate-600">
                      <p className="flex justify-between">
                        <span className="text-slate-400 font-medium">Date:</span>
                        <strong className="text-slate-800">{dateStr}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400 font-medium">Time:</span>
                        <span className="font-mono text-slate-700">{timeStr}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400 font-medium">Cashier:</span>
                        <span className="font-semibold text-slate-700">{currentUser?.firstName || "Admin Cashier"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Customer & Supply Grid (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Billed To Card */}
                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-1.5">
                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-600 flex items-center gap-1.5">
                      <User className="h-3 w-3" /> Billed To (Customer Details)
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {customerName || "Walk-in Customer"}
                    </p>
                    {customerObj?.phone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" /> {customerObj.phone}
                      </p>
                    )}
                    {customerObj?.address && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 leading-tight">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {customerObj.address}
                      </p>
                    )}
                    {customerObj?.gstNumber && (
                      <div className="inline-block mt-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-800 font-bold">
                        GSTIN: {customerObj.gstNumber}
                      </div>
                    )}
                    <div className="pt-1 flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Payment Mode:</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black uppercase">
                        {paymentMethod}
                      </span>
                    </div>
                  </div>

                  {/* Supply & Dispatch Card */}
                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-1.5 text-xs text-slate-600">
                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-600 flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" /> Supply & Dispatch Information
                    </p>
                    <div className="space-y-1 pt-0.5">
                      <p className="flex justify-between">
                        <span className="text-slate-400">Place of Supply:</span>
                        <strong className="text-slate-800">32-Kerala (Intra-State)</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Reverse Charge:</span>
                        <span className="text-slate-700">Not Applicable (No)</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Dispatch / Terminal:</span>
                        <span className="text-slate-700">In-Store Checkout (Counter 1)</span>
                      </p>
                      <p className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400">Invoice Status:</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-black uppercase">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Paid in Full
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Professional Itemized Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
                        <th className="py-3 px-3 w-10 text-center text-slate-400">#</th>
                        <th className="py-3 px-3">Item Description</th>
                        <th className="py-3 px-2 text-center">HSN/SAC</th>
                        <th className="py-3 px-2 text-center">Qty</th>
                        <th className="py-3 px-3 text-right">Unit Rate</th>
                        <th className="py-3 px-2 text-center">Disc</th>
                        <th className="py-3 px-3 text-right">Taxable</th>
                        <th className="py-3 px-3 text-right">CGST</th>
                        <th className="py-3 px-3 text-right">SGST</th>
                        <th className="py-3 px-3 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => {
                        const itemTotal = item.unitPrice * item.quantity;
                        const lineDiscount = itemTotal * ((item.discountPercent || 0) / 100);
                        const taxable = itemTotal - lineDiscount;
                        const halfTax = (item.taxAmount || 0) / 2;
                        const halfRate = (item.taxRate || 0) / 2;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/70 even:bg-slate-50/30 transition-colors">
                            <td className="py-3 px-3 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <p className="font-extrabold text-slate-900 leading-snug">{item.productName}</p>
                              {item.productSku && (
                                <p className="text-[10px] text-slate-500 font-mono">SKU: {item.productSku}</p>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-slate-600 font-semibold text-[11px]">
                              {item.hsnCode || "-"}
                            </td>
                            <td className="py-3 px-2 text-center font-extrabold text-slate-900">
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-800">{item.quantity}</span>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-700 font-mono">₹{item.unitPrice.toFixed(2)}</td>
                            <td className="py-3 px-2 text-center text-slate-500 font-mono text-[11px]">
                              {item.discountPercent > 0 ? `${item.discountPercent}%` : "-"}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-800 font-mono font-semibold">₹{taxable.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right text-slate-600 font-mono text-[11px]">
                              ₹{halfTax.toFixed(2)}
                              <span className="block text-[9px] text-slate-400">({halfRate}%)</span>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600 font-mono text-[11px]">
                              ₹{halfTax.toFixed(2)}
                              <span className="block text-[9px] text-slate-400">({halfRate}%)</span>
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900 font-mono text-sm">
                              ₹{item.totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4. Statutory Amount in Words Banner */}
                <div className="p-3 bg-indigo-50/60 border border-indigo-200/60 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-indigo-700 block">
                      Amount in Words:
                    </span>
                    <span className="font-extrabold text-slate-900">{amountInWords}</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    Indian Rupee Standard
                  </span>
                </div>

                {/* 5. Summary Panels: HSN Tax Breakdown & Grand Totals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column: HSN-Wise GST Breakdown Table & UPI QR Box */}
                  <div className="space-y-4">
                    {/* HSN Table Card */}
                    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs space-y-2">
                      <p className="font-black text-slate-900 uppercase tracking-wider text-[10px] flex items-center justify-between">
                        <span>Statutory HSN / SAC Tax Matrix</span>
                        <span className="text-slate-400 font-normal">GST 2026</span>
                      </p>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse font-mono">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-bold text-left text-[10px] uppercase">
                              <th className="pb-1.5">HSN Code</th>
                              <th className="pb-1.5 text-right">Taxable (₹)</th>
                              <th className="pb-1.5 text-right">CGST</th>
                              <th className="pb-1.5 text-right">SGST</th>
                              <th className="pb-1.5 text-right">Total (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {hsnRows.map((row) => (
                              <tr key={row.hsn} className="hover:bg-slate-100/50">
                                <td className="py-1.5 font-bold text-slate-800">{row.hsn}</td>
                                <td className="py-1.5 text-right text-slate-700">₹{row.taxableValue.toFixed(2)}</td>
                                <td className="py-1.5 text-right text-slate-600">₹{row.cgstAmount.toFixed(2)}</td>
                                <td className="py-1.5 text-right text-slate-600">₹{row.sgstAmount.toFixed(2)}</td>
                                <td className="py-1.5 text-right font-black text-slate-900">₹{row.totalTax.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-2 text-xs">
                        <span>Total GST Tax Liability:</span>
                        <span className="font-mono">₹{totalTax.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Instant Dynamic UPI QR Payment Box */}
                    {shop.upiId && dynamicUpiQr && (
                      <div className="flex items-center gap-3.5 p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl">
                        <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs shrink-0">
                          <img
                            src={dynamicUpiQr}
                            alt="Scan to Pay via UPI"
                            className="w-16 h-16 object-contain"
                          />
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <p className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                            <Smartphone className="h-3.5 w-3.5 text-indigo-600" /> Instant UPI QR Settlement
                          </p>
                          <p className="font-mono text-slate-800 font-bold text-xs">{shop.upiId}</p>
                          <p className="text-[10px] text-slate-500">Google Pay • PhonePe • Paytm • Cred • BHIM</p>
                          <p className="text-emerald-700 font-black text-[11px]">Exact Bill: ₹{total.toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Net Payable Breakdown Card */}
                  <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <p className="font-black text-slate-900 uppercase tracking-wider text-[10px]">
                        Payment & Bill Summary
                      </p>

                      <div className="flex justify-between text-slate-600 pt-1">
                        <span>Gross Items Subtotal:</span>
                        <span className="font-mono font-medium">₹{subtotal.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-slate-600">
                        <span>Central GST (CGST Total):</span>
                        <span className="font-mono font-medium">+₹{(totalTax / 2).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-slate-600">
                        <span>State GST (SGST Total):</span>
                        <span className="font-mono font-medium">+₹{(totalTax / 2).toFixed(2)}</span>
                      </div>

                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Discounts Deducted:</span>
                          <span className="font-mono">-₹{totalDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-700">
                        <span>Net Taxable Supplies:</span>
                        <span className="font-mono font-semibold">₹{taxableSubtotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Prominent Grand Total Highlight Card */}
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Grand Total (Net Payable)
                          </p>
                          <p className="text-2xl font-black tracking-tight text-white font-mono mt-0.5">
                            ₹{total.toFixed(2)}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-xs">
                          PAID
                        </span>
                      </div>

                      <div className="border-t border-slate-800 pt-2 flex justify-between text-[11px] text-slate-400">
                        <span>Paid via {paymentMethod.toUpperCase()}</span>
                        <span className="text-emerald-400 font-bold">Balance Due: ₹0.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Terms, Authentication & Signature Footer */}
                <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-500">
                  <div className="space-y-1.5 max-w-sm">
                    <p className="font-bold text-slate-800 text-xs">Terms & Conditions of Sale:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-500 leading-relaxed">
                      <li>Goods once sold are covered under respective manufacturer warranty terms.</li>
                      <li>Please retain this original tax invoice for any exchange or warranty claims within 7 days.</li>
                      <li>All disputes are subject to local district court jurisdiction.</li>
                    </ol>
                    <p className="text-[10px] text-slate-400 pt-1">
                      Certified authentic computer-generated GST tax invoice. No physical signature required.
                    </p>
                  </div>

                  <div className="text-center sm:text-right space-y-1.5 self-center sm:self-end shrink-0">
                    <div className="h-12 border-b-2 border-slate-300 min-w-[180px] flex items-end justify-center pb-1">
                      <span className="text-[10px] font-mono text-slate-300 uppercase">Digitally Authenticated</span>
                    </div>
                    <p className="font-extrabold text-slate-900 text-xs">For {shop.shopName || "RetailFlow Mart"}</p>
                    <p className="text-[10px] text-slate-400">Authorized Signatory / Cashier Stamp</p>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* ==================== PROFESSIONAL THERMAL 80MM SLIP ==================== */
            <div
              id="printable-receipt"
              className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm font-mono text-xs text-gray-800 space-y-3.5 mx-auto max-w-sm print:border-none print:shadow-none print:p-2"
            >
              {/* Header */}
              <div className="text-center space-y-1">
                {shop.logo && (
                  <div className="mb-2">
                    <img
                      src={shop.logo}
                      alt={shop.shopName}
                      className="h-10 max-w-[140px] object-contain mx-auto"
                    />
                  </div>
                )}
                <h3 className="font-black text-base tracking-tight text-gray-900 font-sans uppercase">
                  {shop.shopName}
                </h3>
                <p className="text-[11px] text-gray-600 leading-tight">{shop.address}</p>
                <p className="text-[11px] text-gray-600 font-sans">Phone: {shop.phone}</p>
                {shop.gstNumber && (
                  <div className="inline-block px-2 py-0.5 bg-gray-100 rounded text-[11px] font-bold text-gray-800 mt-1">
                    GSTIN: {shop.gstNumber}
                  </div>
                )}
              </div>

              {/* Invoice Meta */}
              <div className="border-t border-b border-dashed border-gray-300 py-2.5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice No:</span>
                  <strong className="text-gray-900">#{invoiceNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time:</span>
                  <span>{dateStr} {timeStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-bold text-gray-800">{customerName || "Walk-in Customer"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cashier:</span>
                  <span>{currentUser?.firstName || "Terminal 1"}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                  <span className="text-gray-500">Payment:</span>
                  <span className="font-black text-gray-900 uppercase px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">
                    {paymentMethod}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 py-1">
                <div className="flex justify-between text-[11px] font-bold text-gray-900 border-b border-gray-200 pb-1.5 uppercase">
                  <span>Item Description</span>
                  <span className="text-right">Total (₹)</span>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-xs border-b border-gray-100 pb-1.5">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-gray-900 leading-tight">{item.productName}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.quantity} x ₹{item.unitPrice.toFixed(2)} (GST {item.taxRate}%)
                      </p>
                    </div>
                    <span className="font-black text-gray-900 shrink-0 font-mono">
                      ₹{item.totalAmount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="border-t border-dashed border-gray-300 pt-2.5 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal:</span>
                  <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>CGST (Central Tax):</span>
                  <span className="font-mono">₹{(totalTax / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>SGST (State Tax):</span>
                  <span className="font-mono">₹{(totalTax / 2).toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Grand Total */}
                <div className="border-t-2 border-gray-900 pt-2.5 flex justify-between items-baseline font-black text-base text-gray-900 font-sans">
                  <span>NET PAYABLE:</span>
                  <span className="font-mono text-lg">₹{total.toFixed(2)}</span>
                </div>

                <p className="text-[10px] text-gray-500 pt-1 leading-tight">
                  In Words: {amountInWords}
                </p>
              </div>

              {/* Thermal Dynamic UPI QR */}
              {shop.upiId && thermalUpiQr && (
                <div className="text-center pt-3 border-t border-dashed border-gray-300 space-y-1">
                  <p className="font-black text-[10px] text-gray-900 uppercase tracking-widest">
                    Scan to Pay via UPI
                  </p>
                  <div className="p-1.5 bg-white border border-gray-300 inline-block rounded-lg shadow-2xs">
                    <img src={thermalUpiQr} alt="UPI QR" className="w-24 h-24 object-contain mx-auto" />
                  </div>
                  <p className="text-[9px] text-gray-700 font-mono font-bold">{shop.upiId}</p>
                  <p className="text-[9px] font-bold text-gray-900">Exact Bill: ₹{total.toFixed(2)}</p>
                </div>
              )}

              {/* Thermal Barcode Stamp */}
              <div className="text-center pt-3 border-t border-dashed border-gray-300 space-y-1 font-sans">
                <p className="font-black text-gray-900 text-xs">THANK YOU FOR SHOPPING WITH US!</p>
                <p className="text-[10px] text-gray-500">Please retain this receipt for warranty claims.</p>
                <p className="text-[9px] text-gray-400 font-mono">Invoice #{invoiceNumber}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Buttons (Hidden in Print) */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-2 flex-wrap shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="h-11 px-5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Done / Next Sale
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadText}
              className="h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              title="Download text format"
            >
              <Download className="h-4 w-4" /> TXT
            </button>
            <button
              onClick={handleExportPDF}
              className="h-11 px-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              title="Download official A4 PDF tax invoice"
            >
              <FileText className="h-4 w-4" /> Download A4 PDF
            </button>
            <button
              onClick={triggerWhatsApp}
              className="h-11 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              title="Send to WhatsApp"
            >
              <Smartphone className="h-4 w-4 text-emerald-600" /> WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <Printer className="h-4 w-4 text-indigo-400" />
              Print {format === "invoice" ? "A4 Tax Invoice" : "80mm Thermal Slip"}
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Phone Prompt Overlay */}
      {showPhonePrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-51 p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Send Invoice via WhatsApp</h3>
              <p className="text-xs text-slate-500 mt-1">Enter customer's 10-digit mobile number</p>
            </div>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowPhonePrompt(false)}
                className="flex-1 h-10 border border-slate-300 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => sendWhatsApp(phone)}
                disabled={phone.replace(/[^0-9]/g, "").length < 10}
                className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Send Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
