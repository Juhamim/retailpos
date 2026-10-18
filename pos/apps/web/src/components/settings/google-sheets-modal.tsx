"use client";

import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  BarChart3, 
  Layers, 
  Send,
  Zap,
  Clock,
  ArrowRight
} from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { useSalesStore } from "@/stores/sales-store";
import { useProductStore } from "@/stores/product-store";
import { googleSheetsSyncService } from "@/lib/google-sheets-sync";

// The pre-configured Google Apps Script code for the customer's sheet
const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action === "append_sale") {
      var sheet = ss.getSheetByName("Sales_Ledger") || ss.insertSheet("Sales_Ledger");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Invoice No", "Date", "Time", "Customer", "Item Count", "Items Summary", "Subtotal", "CGST", "SGST", "Total Tax", "Discount", "Grand Total", "Payment Mode", "Cashier"]);
        sheet.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
      }
      sheet.appendRow(data.row);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "sync_inventory") {
      var sheet = ss.getSheetByName("Inventory_Live") || ss.insertSheet("Inventory_Live");
      sheet.clearContents();
      sheet.appendRow(["SKU", "Product Name", "Category", "Current Stock", "Min Stock", "Purchase Price", "Selling Price", "Total Value", "Status", "Updated At"]);
      sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
      if (data.rows && data.rows.length > 0) {
        sheet.getRange(2, 1, data.rows.length, 10).setValues(data.rows);
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "append_shift") {
      var sheet = ss.getSheetByName("Shift_Audits") || ss.insertSheet("Shift_Audits");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Shift ID", "Cashier", "Start Time", "End Time", "Opening Float", "Cash Sales", "Card Sales", "UPI Sales", "Expected Cash", "Actual Cash", "Variance", "Status"]);
        sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
      }
      sheet.appendRow(data.row);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({status: "ok", action: data.action})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export function GoogleSheetsSettingsPanel() {
  const settings = useSettingsStore((s) => s.settings.googleSheets) || {
    enabled: false,
    webhookUrl: "",
    spreadsheetUrl: "",
    autoSyncSales: true,
    autoSyncInventory: true,
    autoSyncShifts: true,
  };
  const updateGoogleSheets = useSettingsStore((s) => s.updateGoogleSheetsSettings);
  const sales = useSalesStore((s) => s.sales);
  const products = useProductStore((s) => s.products);

  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || "");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(settings.spreadsheetUrl || "");
  const [enabled, setEnabled] = useState(settings.enabled || false);
  const [autoSyncSales, setAutoSyncSales] = useState(settings.autoSyncSales !== false);
  const [autoSyncInventory, setAutoSyncInventory] = useState(settings.autoSyncInventory !== false);
  const [autoSyncShifts, setAutoSyncShifts] = useState(settings.autoSyncShifts !== false);

  const [copiedScript, setCopiedScript] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const [isSyncingStock, setIsSyncingStock] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleSave = () => {
    updateGoogleSheets({
      enabled,
      webhookUrl: webhookUrl.trim(),
      spreadsheetUrl: spreadsheetUrl.trim(),
      autoSyncSales,
      autoSyncInventory,
      autoSyncShifts,
    });
    setTestResult({ success: true, message: "Google Sheets sync configuration saved successfully!" });
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({ success: false, message: "Please paste your Google Apps Script Web App URL first." });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const result = await googleSheetsSyncService.testConnection(webhookUrl.trim());
    setIsTesting(false);
    setTestResult(result);
    if (result.success) {
      setEnabled(true);
      updateGoogleSheets({ enabled: true, webhookUrl: webhookUrl.trim() });
    }
  };

  const handleSyncHistorical = async () => {
    if (!webhookUrl.trim()) return;
    setIsBackfilling(true);
    setBackfillResult(null);
    try {
      const res = await googleSheetsSyncService.syncHistoricalSales(sales);
      setBackfillResult(`Successfully streamed ${res.count} past sales to Google Sheets!`);
    } catch (err: any) {
      setBackfillResult(`Error: ${err.message}`);
    } finally {
      setIsBackfilling(false);
    }
  };

  const handleSyncInventoryNow = async () => {
    if (!webhookUrl.trim()) return;
    setIsSyncingStock(true);
    try {
      await googleSheetsSyncService.syncInventory(products);
      setBackfillResult(`Successfully updated ${products.length} inventory products in Google Sheets!`);
    } catch (err: any) {
      setBackfillResult(`Error: ${err.message}`);
    } finally {
      setIsSyncingStock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Google Sheets Live Sync & Analytics</h2>
              <p className="text-xs text-emerald-100">
                Automatically stream checkout sales, live stock counts, and shift audits to your Google Sheet with interactive charts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
              enabled && webhookUrl
                ? "bg-emerald-400/20 text-emerald-100 border-emerald-300/40 animate-pulse"
                : "bg-white/10 text-white/70 border-white/20"
            }`}>
              {enabled && webhookUrl ? "● Live Sync Active" : "Disabled"}
            </span>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-white text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open Sheet
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 4-Step Quick Setup Guide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black flex items-center justify-center">1</div>
          <p className="font-extrabold text-slate-900 dark:text-white">Create / Copy Sheet</p>
          <p className="text-slate-500 leading-relaxed">
            Create a blank Google Sheet or copy our pre-configured visual analytics workbook.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black flex items-center justify-center">2</div>
          <p className="font-extrabold text-slate-900 dark:text-white">Open Apps Script</p>
          <p className="text-slate-500 leading-relaxed">
            In your sheet, click <strong>Extensions → Apps Script</strong> and paste the free bridge code below.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black flex items-center justify-center">3</div>
          <p className="font-extrabold text-slate-900 dark:text-white">Deploy Web App</p>
          <p className="text-slate-500 leading-relaxed">
            Click <strong>Deploy → New deployment</strong>, select <strong>Web app</strong> (Access: Anyone).
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black flex items-center justify-center">4</div>
          <p className="font-extrabold text-slate-900 dark:text-white">Paste Webhook URL</p>
          <p className="text-slate-500 leading-relaxed">
            Paste the Web App URL below and click <strong>Test Connection</strong> to activate live sync!
          </p>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Webhook Configuration & Credentials
            </h3>
            <p className="text-xs text-slate-500">
              Provide your Google Apps Script Web App URL to receive live JSON sales payloads.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Enable Live Sync</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Google Apps Script Web App URL (Webhook) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Obtained after clicking Deploy → New deployment → Web app in your Google Sheet's Apps Script.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Google Spreadsheet Direct Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZj_..."
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Paste your spreadsheet URL so you can view the live charts in 1 click from the POS terminal.
            </p>
          </div>

          {/* Sync Event Toggles */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
              Automatic Synchronization Triggers
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={autoSyncSales}
                  onChange={(e) => setAutoSyncSales(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Real-time Checkout Sales
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={autoSyncInventory}
                  onChange={(e) => setAutoSyncInventory(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Live Stock Counts (SKUs)
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={autoSyncShifts}
                  onChange={(e) => setAutoSyncShifts(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Register Shift Audits (F9)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            testResult.success
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
          }`}>
            {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Backfill Result */}
        {backfillResult && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
            <span>{backfillResult}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !webhookUrl.trim()}
              className="h-10 px-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              {isTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Test Connection
            </button>

            <button
              onClick={handleSyncHistorical}
              disabled={isBackfilling || !webhookUrl.trim()}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Stream all past completed orders to Google Sheets"
            >
              {isBackfilling ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Sync All Past Sales ({sales.length})
            </button>

            <button
              onClick={handleSyncInventoryNow}
              disabled={isSyncingStock || !webhookUrl.trim()}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Sync current product catalog and stock levels"
            >
              {isSyncingStock ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
              Sync Inventory ({products.length})
            </button>
          </div>

          <button
            onClick={handleSave}
            className="h-10 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black hover:opacity-90 transition-opacity shadow-md"
          >
            Save Google Sheets Settings
          </button>
        </div>
      </div>

      {/* Copyable Apps Script Code Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Free Google Apps Script Bridge Code
            </h4>
            <p className="text-[11px] text-slate-500">
              Paste this code into your Google Sheet (Extensions → Apps Script → Code.gs).
            </p>
          </div>

          <button
            onClick={handleCopyScript}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
          >
            {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedScript ? "Copied!" : "Copy Code"}
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 bg-slate-950 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48 scrollbar-thin border border-slate-800">
            {APPS_SCRIPT_CODE}
          </pre>
        </div>
      </div>
    </div>
  );
}
