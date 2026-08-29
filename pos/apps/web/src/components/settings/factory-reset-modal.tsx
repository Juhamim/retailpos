"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Lock,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  RefreshCw,
  Key,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FactoryResetModal({ isOpen, onClose, onSuccess }: FactoryResetModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser) || useAppStore((s) => s.currentUser);
  const verifyPassword = useAuthStore((s) => s.verifyPassword);

  // Steps: 1 = Admin Auth & Scope, 2 = Final Danger Confirmation
  const [step, setStep] = useState<1 | 2>(1);
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetScope, setResetScope] = useState<"standard" | "full">("standard");

  // Step 2 timer & confirmation text
  const [confirmInput, setConfirmInput] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [isWiping, setIsWiping] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAdminPassword("");
      setPasswordError("");
      setConfirmInput("");
      setCountdown(5);
      setIsWiping(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    const username = currentUser?.username || "admin";
    const user = verifyPassword(username, adminPassword);
    
    // Fallback: in local offline environment, accept pin 1234 or matching hash
    if (!user && adminPassword !== "1234") {
      setPasswordError("Incorrect Admin password or PIN. Action aborted.");
      return;
    }

    setStep(2);
    setCountdown(5);
  };

  const handleExecuteWipe = () => {
    if (confirmInput.trim().toUpperCase() !== "CONFIRM DATA WIPE") {
      return;
    }

    setIsWiping(true);

    const wipeKeys = [
      "retailflow-sales-storage",
      "retailflow-products-storage",
      "retailflow-customers-storage",
      "retailflow-shift-storage",
      "retailflow-expenses-storage",
      "retailflow-suppliers-storage",
      "retailflow-purchases-storage",
      "retailflow-returns-storage",
      "retailflow-giftcard-storage",
      "retailflow-inventory-audit-storage",
      "retailflow-pos-cart-storage",
      "retailflow-promo-storage",
      "retailflow-account-storage",
      "retailflow_dayend_backups_history",
      "rf-app-store",
    ];

    if (resetScope === "full") {
      wipeKeys.push("retailflow-settings-storage");
      wipeKeys.push("retailflow-auth-storage");
    }

    // Clear from localStorage
    for (const key of wipeKeys) {
      localStorage.removeItem(key);
    }

    // If Tauri desktop, clear native AppData database directory if possible
    if (typeof window !== "undefined" && (window as any).__TAURI__) {
      try {
        import("@tauri-apps/api/fs").then(({ removeFile, BaseDirectory }) => {
          for (const key of wipeKeys) {
            const cleanKey = key.replace("retailflow-", "").replace("-storage", "");
            removeFile(`${cleanKey}.json`, { dir: BaseDirectory.AppData }).catch(() => {});
          }
        });
      } catch {
        // ignore
      }
    }

    setTimeout(() => {
      onSuccess();
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
        
        {/* Header with Danger Accent */}
        <div className="p-4 bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">
                {step === 1 ? "Store Data Wipe & Factory Reset" : "CRITICAL WARNING: Irreversible Wipe"}
              </h3>
              <p className="text-[11px] text-rose-100 font-medium">
                Step {step} of 2 • Security Verification & Double Confirmation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP 1: AUTHENTICATION & SCOPE */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="p-6 space-y-5">
            {/* Warning Alert Banner */}
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Permanent Store Data Erasure Notice</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Performing a Store Data Wipe erases all operational records to prepare the register for a brand new store lifecycle.
              </p>
              <ul className="list-disc list-inside text-[11px] text-rose-700/90 space-y-0.5 pt-1">
                <li>All POS transactions, sales receipts, and refunds</li>
                <li>All product inventory, barcode SKUs, and stock logs</li>
                <li>All customer profiles, Khata credit balances, and loyalty points</li>
                <li>All cashier shift registers, cash drawer floats, and day-end reports</li>
                <li>All expense records, supplier bills, gift cards, and treasury adjustments</li>
              </ul>
            </div>

            {/* Reset Scope Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 block">Select Reset Scope</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    resetScope === "standard"
                      ? "border-rose-600 bg-rose-50/40 text-rose-950"
                      : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Standard Store Reset</span>
                    <input
                      type="radio"
                      name="scope"
                      checked={resetScope === "standard"}
                      onChange={() => setResetScope("standard")}
                      className="text-rose-600"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Clears all transactions & products. <strong className="text-gray-700">Preserves Admin login & store details.</strong>
                  </p>
                </label>

                <label
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    resetScope === "full"
                      ? "border-rose-600 bg-rose-50/40 text-rose-950"
                      : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Complete Factory Reset</span>
                    <input
                      type="radio"
                      name="scope"
                      checked={resetScope === "full"}
                      onChange={() => setResetScope("full")}
                      className="text-rose-600"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Total wipe back to initial installation wizard.
                  </p>
                </label>
              </div>
            </div>

            {/* Admin Password Verification Input */}
            <div className="space-y-1.5 pt-2 border-t">
              <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                <span>Enter Admin Password or PIN *</span>
                <span className="text-[10px] font-normal text-gray-400">Default PIN: 1234</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter store admin password..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
              {passwordError && (
                <p className="text-xs font-semibold text-rose-600 pt-1 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel / Keep Store Data
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Verify & Proceed to Step 2 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: CRITICAL DOUBLE CONFIRMATION & COUNTDOWN */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-rose-950 text-white rounded-2xl space-y-3 text-center border border-rose-800">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-rose-400 animate-pulse" />
              </div>
              <h4 className="font-extrabold text-base text-rose-200">
                Are you 100% sure you want to wipe all store data?
              </h4>
              <p className="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">
                This action is <strong className="underline font-black text-white">IRREVERSIBLE</strong>. All transaction ledgers, product catalog, customer loyalty points, and cash registers will be erased immediately.
              </p>
            </div>

            {/* Typing barrier */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 block">
                Type <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">CONFIRM DATA WIPE</span> to unlock erasure button:
              </label>
              <input
                type="text"
                autoFocus
                placeholder="CONFIRM DATA WIPE"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-300 text-sm font-mono font-bold tracking-wider uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Actions with Countdown Safeguard */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isWiping}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back / Abort Wipe
              </button>
              
              <button
                type="button"
                onClick={handleExecuteWipe}
                disabled={countdown > 0 || confirmInput.trim().toUpperCase() !== "CONFIRM DATA WIPE" || isWiping}
                className={`flex-1 h-11 rounded-xl text-white text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                  countdown > 0 || confirmInput.trim().toUpperCase() !== "CONFIRM DATA WIPE" || isWiping
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-600/30"
                }`}
              >
                {isWiping ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Wiping Store Database...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <Clock className="h-4 w-4" /> Safety Lock ({countdown}s)
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" /> Permanently Wipe Store
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
