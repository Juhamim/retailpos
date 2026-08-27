"use client";

import React, { useState } from "react";
import { CartItem } from "@retailflow/shared-types";
import { X, Printer, CheckCircle2, Download, FileText, Smartphone } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";

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
  const [format, setFormat] = useState<"thermal" | "invoice">("thermal");

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalDiscount = Math.max(0, (subtotal + totalTax) - total);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    let content = `========================================\n`;
    content += `         ${shop.shopName.toUpperCase()}\n`;
    content += `      ${shop.address}\n`;
    content += `      Ph: ${shop.phone}\n`;
    if (shop.gstNumber) content += `      GSTIN: ${shop.gstNumber}\n`;
    content += `========================================\n`;
    content += `Invoice: ${invoiceNumber}\n`;
    content += `Date   : ${dateStr} ${timeStr}\n`;
    content += `Customer: ${customerName || "Walk-in Customer"}\n`;
    content += `Payment: ${paymentMethod.toUpperCase()}\n`;
    content += `----------------------------------------\n`;
    content += `ITEM                QTY    PRICE   TOTAL\n`;
    content += `----------------------------------------\n`;
    for (const item of items) {
      const name = item.productName.padEnd(18).slice(0, 18);
      const qty = String(item.quantity).padStart(3);
      const price = item.unitPrice.toFixed(2).padStart(8);
      const rowTotal = (item.unitPrice * item.quantity).toFixed(2).padStart(8);
      content += `${name} ${qty} ${price} ${rowTotal}\n`;
    }
    content += `----------------------------------------\n`;
    content += `Subtotal  : ₹${subtotal.toFixed(2)}\n`;
    content += `GST Tax   : ₹${totalTax.toFixed(2)}\n`;
    if (totalDiscount > 0) content += `Discount  : -₹${totalDiscount.toFixed(2)}\n`;
    content += `GRAND TOTAL: ₹${total.toFixed(2)}\n`;
    content += `========================================\n`;
    content += `       THANK YOU FOR SHOPPING!\n`;
    content += `========================================\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Success header */}
        <div className="p-4 text-center bg-emerald-50 border-b border-emerald-100 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-1" />
          <h2 className="text-sm font-bold text-emerald-900">Sale Successfully Completed!</h2>
          <p className="text-xs text-emerald-700">Invoice #{invoiceNumber} • Paid with {paymentMethod}</p>

          {/* Format Toggle */}
          <div className="flex justify-center gap-1 mt-2.5">
            <button
              onClick={() => setFormat("thermal")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                format === "thermal"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200"
              }`}
            >
              Thermal 80mm
            </button>
            <button
              onClick={() => setFormat("invoice")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                format === "invoice"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200"
              }`}
            >
              Full Tax Invoice
            </button>
          </div>
        </div>

        {/* Printable Receipt Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
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
              {format === "invoice" && (
                <span className="inline-block mt-1 font-sans text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                  Tax Invoice
                </span>
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
                    ₹{(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (Central Tax):</span>
                <span>₹{(totalTax / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (State Tax):</span>
                <span>₹{(totalTax / 2).toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount Applied:</span>
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
              <p>Goods once sold are covered by standard warranty.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t bg-white flex gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Done / Next Sale
          </button>
          <button
            onClick={handleDownloadText}
            className="h-11 px-3.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            title="Download text invoice"
          >
            <Download className="h-4 w-4" /> TXT
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 h-11 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
