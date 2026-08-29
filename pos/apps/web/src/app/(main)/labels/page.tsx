"use client";

import React, { useState, useEffect, useRef } from "react";
import { useProductStore } from "@/stores/product-store";
import JsBarcode from "jsbarcode";
import { Barcode, Printer, Grid, RefreshCw, Layers } from "lucide-react";

export default function BarcodePage() {
  const products = useProductStore((state) => state.products);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [labelQty, setLabelQty] = useState(24);
  const [layout, setLayout] = useState<"sticker" | "sheet-24" | "sheet-30">("sheet-24");
  
  // Custom sticker states
  const [customTitle, setCustomTitle] = useState("RetailFlow Mart");
  const [customPrice, setCustomPrice] = useState("40.00");
  const [customSku, setCustomSku] = useState("CC500");
  const [customBarcode, setCustomBarcode] = useState("8901234567890");

  const barcodeRef = useRef<SVGSVGElement>(null);

  // Effect to render single sticker preview barcode
  useEffect(() => {
    if (barcodeRef.current && customBarcode) {
      try {
        JsBarcode(barcodeRef.current, customBarcode, {
          format: "CODE128",
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 10,
          margin: 0,
        });
      } catch (err) {
        console.error("Barcode generation error", err);
      }
    }
  }, [customBarcode, layout]);

  // Load selected product info into form
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setCustomTitle(prod.name);
      setCustomPrice(prod.sellingPrice.toFixed(2));
      setCustomSku(prod.sku);
      setCustomBarcode(prod.barcode || "8901234567890");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper component to render barcode SVG for sheets
  const SheetBarcodeSVG = ({ value }: { value: string }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    useEffect(() => {
      if (svgRef.current && value) {
        try {
          JsBarcode(svgRef.current, value, {
            format: "CODE128",
            width: 1.2,
            height: 35,
            displayValue: true,
            fontSize: 9,
            margin: 0,
          });
        } catch (e) {
          // ignore
        }
      }
    }, [value]);
    return <svg ref={svgRef}></svg>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header controls (Hidden on Print) */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Barcode className="h-7 w-7 text-indigo-600" /> Barcode & Price Sticker Generator
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">
            Generate 38x25mm individual item tags or full page A4 sheets of retail barcodes
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
        >
          <Printer className="h-4 w-4" /> Print Barcode Sheet
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 print:hidden">
        {/* Editor panel */}
        <div className="w-full lg:w-96 bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-5">
          <h3 className="font-bold text-gray-900 text-sm border-b pb-2 flex items-center gap-1">
            <Layers className="h-4.5 w-4.5 text-indigo-600" /> Layout & Configuration
          </h3>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Quick Populate from Catalog</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{p.sellingPrice})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Output Print Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "sticker", label: "Single Sticker" },
                { id: "sheet-24", label: "A4 (24 Sheets)" },
                { id: "sheet-30", label: "A4 (30 Sheets)" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setLayout(t.id as any);
                    if (t.id === "sheet-24") setLabelQty(24);
                    if (t.id === "sheet-30") setLabelQty(30);
                  }}
                  className={`p-2 rounded-xl border-2 text-center text-xs font-bold transition-all ${
                    layout === t.id ? "border-blue-600 bg-blue-50/50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {layout !== "sticker" && (
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Print Quantity (Labels)</label>
              <input
                type="number"
                value={labelQty}
                onChange={(e) => setLabelQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider">Label Content Details</h4>
            
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Product Name / Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Price (INR)</label>
                <input
                  type="text"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">SKU / Code</label>
                <input
                  type="text"
                  value={customSku}
                  onChange={(e) => setCustomSku(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Barcode Numeric Value</label>
              <input
                type="text"
                value={customBarcode}
                onChange={(e) => setCustomBarcode(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Pane */}
        <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 p-8 flex items-center justify-center">
          <div className="bg-white border rounded-xl p-6 shadow-xs max-w-sm w-full text-center space-y-4">
            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest">Sticker Design Preview</h4>
            <div className="border border-dashed border-gray-300 p-4 bg-white rounded-lg inline-block text-left w-full max-w-[280px]">
              <div className="text-[10px] font-bold text-gray-500 tracking-wider truncate uppercase">{customTitle}</div>
              <div className="text-lg font-black text-gray-900 mt-1">₹{customPrice}</div>
              <div className="text-[9px] font-mono text-gray-400 mt-0.5">SKU: {customSku}</div>
              <div className="flex justify-center mt-3">
                <svg ref={barcodeRef}></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet Preview (A4 layout) */}
      <div className={`w-full ${layout === "sticker" ? "hidden" : "block"}`}>
        <h3 className="font-bold text-sm text-gray-800 mb-3 print:hidden">Printable Grid Preview</h3>
        <div className="bg-slate-100 p-8 rounded-2xl flex justify-center print:bg-white print:p-0">
          <div className="bg-white w-[210mm] min-h-[297mm] p-[10mm] border shadow-md print:shadow-none print:border-none">
            {/* Sheet grid setup */}
            <div className={`grid gap-[4mm] ${
              layout === "sheet-24" ? "grid-cols-3 grid-rows-8" : "grid-cols-3 grid-rows-10"
            }`}>
              {Array.from({ length: labelQty }).map((_, index) => (
                <div
                  key={index}
                  className="border border-gray-200 p-3 flex flex-col justify-between h-[32mm] bg-white rounded-sm box-border overflow-hidden"
                >
                  <div>
                    <div className="text-[9px] font-bold text-gray-800 uppercase tracking-wide truncate">{customTitle}</div>
                    <div className="text-sm font-extrabold text-gray-900 mt-0.5">₹{customPrice}</div>
                    <div className="text-[8px] font-mono text-gray-400">SKU: {customSku}</div>
                  </div>
                  <div className="flex justify-center h-[35px] mt-1">
                    <SheetBarcodeSVG value={customBarcode} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Styles for print output formatting */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Print only the sheet container */
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .bg-slate-100 {
            background-color: transparent !important;
            padding: 0 !important;
          }
          .bg-slate-100 *, .bg-slate-100 select, .bg-slate-100 input, .bg-slate-100 button {
            visibility: hidden;
          }
          .bg-slate-100 div, .bg-slate-100 svg, .bg-slate-100 svg * {
            visibility: visible;
          }
          /* Setup A4 Page */
          @page {
            size: A4;
            margin: 0;
          }
          .bg-slate-100 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
