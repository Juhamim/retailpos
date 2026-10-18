"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Download, RefreshCw, CheckCircle, AlertCircle, X, ArrowRight, ShieldCheck, Laptop, Globe } from "lucide-react";
import { autoUpdater, UpdateInfo, UpdatePhase } from "@/lib/auto-updater";

interface AutoUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualCheck?: boolean;
}

export function AutoUpdateModal({ isOpen, onClose, manualCheck = false }: AutoUpdateModalProps) {
  const [phase, setPhase] = useState<UpdatePhase>("idle");
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const unsub = autoUpdater.subscribe((p, inf, err) => {
      setPhase(p);
      setInfo(inf);
      setError(err || null);
    });

    if (isOpen && manualCheck) {
      autoUpdater.checkForUpdate(true);
    }

    return () => unsub();
  }, [isOpen, manualCheck]);

  if (!isOpen) return null;

  const isDesktop = autoUpdater.isDesktop();

  const handleInstall = async () => {
    if (isDesktop) {
      setInstalling(true);
      try {
        await autoUpdater.installDesktopUpdate();
      } catch (e: any) {
        setError(e?.message || "Failed to install update.");
      } finally {
        setInstalling(false);
      }
    } else {
      autoUpdater.applyWebUpdate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header with vibrant gradient */}
        <div className="relative p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">RetailFlow Auto-Updater</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1">
                  {isDesktop ? <Laptop size={12} /> : <Globe size={12} />}
                  {isDesktop ? "Windows EXE" : "Cloud Web"}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {isDesktop
                  ? "Central continuous delivery with cryptographic Ed25519 verification"
                  : "Zero-downtime continuous deployment & PWA update cache"}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {phase === "checking" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Checking for centralized updates...
              </p>
              <p className="text-xs text-slate-500">
                Querying release repository and cryptographic signatures
              </p>
            </div>
          )}

          {phase === "up-to-date" && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  You're on the latest version!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Installed: <strong className="font-mono text-indigo-600 dark:text-indigo-400">v{autoUpdater.getVersion()}</strong> • All systems up to date.
                </p>
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Update Check Notice</p>
                <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-400">
                  {error || "Unable to reach update server. POS will continue operating offline normally."}
                </p>
              </div>
            </div>
          )}

          {(phase === "available" || phase === "downloading" || phase === "ready-to-restart") && info && (
            <div className="space-y-4">
              {/* Version Comparison Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Current</span>
                  <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                    v{info.currentVersion}
                  </p>
                </div>

                <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                  <ArrowRight size={16} />
                </div>

                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    New Update
                  </span>
                  <p className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    v{info.availableVersion || "1.1.0"}
                  </p>
                </div>
              </div>

              {/* Security & Release Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Release Notes & Enhancements</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 max-h-36 overflow-y-auto">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {info.releaseNotes || "Performance enhancements, Cloudflare D1 central sync, and dynamic UPI QR billing."}
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Continuous centralized auto-updates for EXE and Web</li>
                    <li>Customer self-service Cloudflare onboarding wizard</li>
                    <li>Real-time Cloudflare D1 multi-terminal database replication</li>
                    <li>Automatic offline-first conflict resolution</li>
                  </ul>
                </div>
              </div>

              {/* Progress bar when downloading */}
              {(phase === "downloading" || installing) && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-indigo-600">Downloading verified package...</span>
                    <span>{autoUpdater.downloadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.max(autoUpdater.downloadProgress, 15)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            {phase === "available" ? "Remind Me Later" : "Close"}
          </button>

          {phase === "up-to-date" || phase === "error" ? (
            <button
              type="button"
              onClick={() => autoUpdater.checkForUpdate(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <RefreshCw size={14} /> Check Again
            </button>
          ) : (
            (phase === "available" || phase === "ready-to-restart") && (
              <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {installing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Applying Update...
                  </>
                ) : isDesktop ? (
                  <>
                    <Download size={14} />
                    Download & Restart POS
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Refresh & Update Web App
                  </>
                )}
              </button>
            )
          )}
        </div>

      </div>
    </div>
  );
}
