"use client";

import { Search, Cloud, CloudOff, Sun, Moon } from "lucide-react";
import { useAppStore } from "@/stores/app-store";

export default function Header() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const isOnline = useAppStore((s) => s.isOnline);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const currentUser = useAppStore((s) => s.currentUser);

  const resolvedTheme = theme === "system" ? "light" : theme;
  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
    : "AD";

  return (
    <header className="h-14 flex items-center justify-between border-b bg-white px-4 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tracking-tight text-slate-900">
          RetailFlow
        </span>
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border bg-slate-50 py-1.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
          {isOnline && syncStatus === "synced" ? (
            <>
              <Cloud size={14} className="text-emerald-500" />
              <span className="text-emerald-600">Synced</span>
            </>
          ) : (
            <>
              <CloudOff size={14} className="text-amber-500" />
              <span className="text-amber-600">
                {isOnline ? syncStatus : "Offline"}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l ml-1">
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
