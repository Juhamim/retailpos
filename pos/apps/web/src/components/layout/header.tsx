"use client";

import { useState } from "react";
import { Search, Cloud, CloudOff, Sun, Moon, Lock, QrCode, Wifi } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useShiftStore } from "@/stores/shift-store";
import { LocalNetworkModal } from "@/components/network/local-network-modal";
import Link from "next/link";

export default function Header() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const isOnline = useAppStore((s) => s.isOnline);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const currentUser = useAppStore((s) => s.currentUser);
  const setIsLocked = useAppStore((state) => state.setIsLocked);
  
  const activeShift = useShiftStore((s) => s.activeShift);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);

  const resolvedTheme = theme === "system" ? "light" : theme;
  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
    : "AD";

  return (
    <>
      <header className="h-16 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 shrink-0 sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-90 transition-opacity cursor-pointer">
            RetailFlow
          </span>
        </div>

        <div className="flex-grow max-w-md mx-6">
          {/* Active Shift Indicator */}
          <Link href="/shifts">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border shadow-sm ${
              activeShift 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15" 
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15"
            }`}>
              <div className={`w-2 h-2 rounded-full relative ${activeShift ? "bg-emerald-500" : "bg-amber-500"}`}>
                {activeShift && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />}
              </div>
              <span>{activeShift ? `Register Open (Float: ₹${activeShift.openingFloat})` : "Register Closed (Start Shift)"}</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          {/* LAN / Mobile QR Code Button */}
          <button
            onClick={() => setNetworkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-bold transition-all duration-200 shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            title="Scan QR Code to Connect Mobile / Tablet Register on Local Wi-Fi"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Connect Mobile / LAN</span>
          </button>

          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun size={18} className="animate-spin-slow" /> : <Moon size={18} />}
          </button>

          {/* Lock Screen Button */}
          {currentUser && (
            <button
              onClick={() => setIsLocked(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
              title="Lock Register Screen (Ctrl+L)"
            >
              <Lock size={18} />
            </button>
          )}

          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
            isOnline && syncStatus === "synced"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          }`}>
            {isOnline && syncStatus === "synced" ? (
              <>
                <Cloud size={14} className="text-emerald-500" />
                <span>Synced</span>
              </>
            ) : (
              <>
                <CloudOff size={14} className="text-amber-500" />
                <span>{isOnline ? syncStatus : "Offline"}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800 ml-1">
            <div 
              className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:scale-[1.05] active:scale-[0.95] transition-transform cursor-pointer" 
              title={currentUser ? `${currentUser.firstName} (${currentUser.role})` : "Admin"}
            >
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Local Network Pairing Modal */}
      <LocalNetworkModal
        isOpen={networkModalOpen}
        onClose={() => setNetworkModalOpen(false)}
      />
    </>
  );
}
