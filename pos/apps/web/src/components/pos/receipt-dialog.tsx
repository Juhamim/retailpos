"use client";

import React, { useState } from "react";
import { CartItem } from "@retailflow/shared-types";
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Download, 
  FileText, 
  Smartphone,
  Store,
  Building,
  CreditCard,
  QrCode,
  ShieldCheck,
  Receipt
} from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { useAppStore } from "@/stores/app-store";
import { useCustomerStore } from "@/stores/customer-store";
import { exportTaxInvoicePDF } from "@/lib/pdf-export";

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

  const now = new Date();
  
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalDiscount = Math.max(0, (subtotal + totalTax) - total);

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
    const msg = `*TAX INVOICE FROM ${shop.shopName}*\n------------------------------\nInvoice No: ${invoiceNumber}\nDate: ${now.toLocaleDateString("en-IN")}\nCustomer: ${customerName || "Walk-in"}\nTotal Amount: ₹${total.toFixed(2)}\nItems:\n${itemsText}\n------------------------------\nThank you for shopping with us!`;
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:rounded-none print:w-full print:max-w-none">
        
        {/* Top Dialog Toolbar (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                Sale Completed • Invoice #{invoiceNumber}
              </h2>
              <p className="text-xs text-slate-400">
                Paid ₹{total.toFixed(2)} via {paymentMethod} • Cashier: {currentUser?.firstName || "Terminal 1"}
              </p>
            </div>
          </div>

          {/* Format Selector Toggle */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setFormat("invoice")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                format === "invoice"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> A4 Tax Invoice (Default)
            </button>
            <button
              onClick={() => setFormat("thermal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
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
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Invoice View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:p-0 print:bg-white">
          
          {format === "invoice" ? (
            /* ==================== REDESIGNED A4 TAX INVOICE ==================== */
            <div
              id="printable-receipt"
              className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-10 shadow-sm max-w-3xl mx-auto space-y-6 print:border-none print:shadow-none print:p-6 print:max-w-none print:rounded-none"
            >
              {/* Header: Company Details & Invoice Badge */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-extrabold text-base">
                      R
                    </div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      {shop.shopName || "RetailFlow Mart"}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{shop.address}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span><strong>Phone:</strong> {shop.phone}</span>
                    {shop.email && <span><strong>Email:</strong> {shop.email}</span>}
                  </div>
                  {shop.gstNumber && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200">
                      <span>GSTIN:</span> <span className="font-mono">{shop.gstNumber}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right sm:min-w-[220px] space-y-1.5 self-stretch sm:self-auto">
                  <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider rounded-md">
                    Tax Invoice
                  </span>
                  <p className="text-sm font-black text-slate-900 font-mono">#{invoiceNumber}</p>
                  <p className="text-xs text-slate-500"><strong>Date:</strong> {dateStr}</p>
                  <p className="text-xs text-slate-500"><strong>Time:</strong> {timeStr}</p>
                  <p className="text-xs text-slate-500"><strong>Cashier:</strong> {currentUser?.firstName || "Terminal 1"}</p>
                </div>
              </div>

              {/* Customer / Billed To & Place of Supply Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Billed To (Customer)</p>
                  <p className="text-sm font-bold text-slate-900">{customerName || "Walk-in Customer"}</p>
                  {customerObj?.phone && (
                    <p className="text-xs text-slate-600">Phone: {customerObj.phone}</p>
                  )}
                  {customerObj?.gstNumber && (
                    <p className="text-xs text-slate-600 font-mono font-semibold">GSTIN: {customerObj.gstNumber}</p>
                  )}
                  <p className="text-xs text-slate-600">
                    Payment Method: <span className="font-bold text-slate-800 uppercase">{paymentMethod}</span>
                  </p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-600">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Supply & Fulfilment</p>
                  <p><strong>Place of Supply:</strong> 32-Kerala (Intra-State)</p>
                  <p><strong>Reverse Charge:</strong> Not Applicable</p>
                  <p><strong>Order Status:</strong> <span className="text-emerald-700 font-bold">PAID / COMPLETED</span></p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-2 text-center">HSN/SAC</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-2 text-center">Disc</th>
                      <th className="py-2.5 px-3 text-right">Taxable</th>
                      <th className="py-2.5 px-3 text-right">GST</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => {
                      const itemTotal = item.unitPrice * item.quantity;
                      const lineDiscount = itemTotal * (item.discountPercent / 100);
                      const taxable = itemTotal - lineDiscount;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-slate-900">{item.productName}</p>
                            {item.productSku && (
                              <p className="text-[10px] text-slate-500 font-mono">SKU: {item.productSku}</p>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600 font-bold">
                            {item.hsnCode || "-"}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-700">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-center text-slate-500">
                            {item.discountPercent > 0 ? `${item.discountPercent}%` : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">₹{taxable.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            ₹{item.taxAmount.toFixed(2)}
                            <span className="block text-[9px] text-slate-400">({item.taxRate}%)</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            ₹{item.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Cards & Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Left: Statutory HSN-Wise GST Breakup Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Statutory HSN / SAC Tax Breakdown
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold text-left">
                          <th className="pb-1">HSN</th>
                          <th className="pb-1 text-right">Taxable (₹)</th>
                          <th className="pb-1 text-right">CGST</th>
                          <th className="pb-1 text-right">SGST</th>
                          <th className="pb-1 text-right">Tax (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Array.from(
                          items.reduce((map, it) => {
                            const code = it.hsnCode || "General";
                            const taxable = (it.unitPrice * it.quantity) - ((it.unitPrice * it.quantity) * (it.discountPercent / 100));
                            const curr = map.get(code) || { hsn: code, taxable: 0, tax: 0, rate: it.taxRate };
                            curr.taxable += taxable;
                            curr.tax += it.taxAmount;
                            map.set(code, curr);
                            return map;
                          }, new Map<string, { hsn: string; taxable: number; tax: number; rate: number }>())
                        ).map(([code, row]) => (
                          <tr key={code} className="font-mono">
                            <td className="py-1 font-bold text-slate-800">{code}</td>
                            <td className="py-1 text-right text-slate-700">₹{row.taxable.toFixed(2)}</td>
                            <td className="py-1 text-right text-slate-600">₹{(row.tax / 2).toFixed(2)}</td>
                            <td className="py-1 text-right text-slate-600">₹{(row.tax / 2).toFixed(2)}</td>
                            <td className="py-1 text-right font-bold text-slate-900">₹{row.tax.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1.5">
                    <span>Total GST Tax Liability:</span>
                    <span>₹{totalTax.toFixed(2)}</span>
                  </div>
                </div>

                {/* Right: Net Payable Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal:</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax:</span>
                    <span className="font-medium">+₹{totalTax.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discounts Applied:</span>
                      <span>-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Highlight Net Payable */}
                  <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center shadow-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Grand Total (Net Payable)</p>
                      <p className="text-lg font-black tracking-tight">₹{total.toFixed(2)}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500 text-white rounded-md uppercase">
                      Paid in Full
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Signature Section */}
              <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-500">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">Terms & Conditions:</p>
                  <p>1. Goods once sold are covered under manufacturer warranty.</p>
                  <p>2. Please retain this original tax invoice for any warranty or exchange requests.</p>
                  <p className="text-[11px] text-slate-400 pt-1">This is an authentic computer-generated GST tax invoice.</p>
                </div>

                <div className="text-center sm:text-right space-y-1 self-center sm:self-end">
                  <div className="h-10 border-b border-dashed border-slate-300 min-w-[160px]" />
                  <p className="font-bold text-slate-800 text-xs mt-1">For {shop.shopName || "RetailFlow Mart"}</p>
                  <p className="text-[10px] text-slate-400">Authorized Signatory / Cashier Stamp</p>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== COMPACT THERMAL 80MM SLIP ==================== */
            <div
              id="printable-receipt"
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs font-mono text-xs text-gray-800 space-y-3 mx-auto max-w-sm"
            >
              {/* Header */}
              <div className="text-center space-y-0.5">
                <h3 className="font-bold text-sm tracking-tight text-gray-900 font-sans uppercase">
                  {shop.shopName}
                </h3>
                <p className="text-[11px] text-gray-600 leading-tight">{shop.address}</p>
                <p className="text-[11px] text-gray-600">Ph: {shop.phone}</p>
                {shop.gstNumber && (
                  <p className="text-[11px] text-gray-700 font-bold mt-1">GSTIN: {shop.gstNumber}</p>
                )}
              </div>

              {/* Invoice Meta */}
              <div className="border-t border-b border-dashed border-gray-300 py-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice No:</span>
                  <span className="font-bold text-gray-900">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time:</span>
                  <span>{dateStr} {timeStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-semibold text-gray-800">{customerName || "Walk-in Customer"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment:</span>
                  <span className="font-semibold text-gray-800 uppercase">{paymentMethod}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 py-1">
                <div className="flex justify-between text-[11px] font-bold text-gray-800 border-b border-gray-200 pb-1">
                  <span>Item Description</span>
                  <span className="text-right">Amount (₹)</span>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-xs border-b border-gray-50 pb-1.5">
                    <div className="flex-1 pr-2">
                      <p className="font-medium text-gray-900 leading-tight">{item.productName}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.quantity} x ₹{item.unitPrice.toFixed(2)} (GST {item.taxRate}%)
                      </p>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">
                      ₹{item.totalAmount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>CGST (Tax):</span>
                  <span>₹{(totalTax / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>SGST (Tax):</span>
                  <span>₹{(totalTax / 2).toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-900 pt-2 flex justify-between font-bold text-base text-gray-900 font-sans">
                  <span>Grand Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 border-t border-dashed border-gray-300 text-[10px] text-gray-500 space-y-0.5 font-sans">
                <p className="font-bold text-gray-800">Thank you for shopping with us!</p>
                <p>Goods once sold are covered under standard warranty.</p>
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
              className="h-11 px-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
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
              className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Printer className="h-4 w-4 text-indigo-400" />
              Print A4 Invoice
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
              className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
