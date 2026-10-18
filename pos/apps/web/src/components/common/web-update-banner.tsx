"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, X, Download } from "lucide-react";
import { autoUpdater, UpdateInfo, UpdatePhase } from "@/lib/auto-updater";
import { AutoUpdateModal } from "@/components/common/auto-update-modal";

export function WebUpdateBanner() {
  const [phase, setPhase] = useState<UpdatePhase>("idle");
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Start background check loop
    autoUpdater.startPeriodicChecks();

    const unsub = autoUpdater.subscribe((p, inf) => {
      setPhase(p);
      setInfo(inf);
    });

    return () => {
      unsub();
      autoUpdater.stopPeriodicChecks();
    };
  }, []);

  if (dismissed || phase !== "available" || !info) {
    return (
      <AutoUpdateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    );
  }

  const isDesktop = autoUpdater.isDesktop();

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 max-w-sm w-full p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white border border-indigo-500/40 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shrink-0 shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold flex items-center gap-1.5">
                <span>Update Available</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-extrabold">
                  v{info.availableVersion || "1.1.0"}
                </span>
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                {isDesktop
                  ? "A new signed Windows EXE build is ready to install."
                  : "New cloud features and sync enhancements are ready."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dismiss notice"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => setModalOpen(true)}
            className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 transition-colors"
          >
            View Details
          </button>

          <button
            onClick={() => {
              if (isDesktop) {
                setModalOpen(true);
              } else {
                autoUpdater.applyWebUpdate();
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isDesktop ? <Download size={12} /> : <RefreshCw size={12} />}
            <span>{isDesktop ? "Update Now" : "Refresh & Apply"}</span>
          </button>
        </div>
      </div>

      <AutoUpdateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
