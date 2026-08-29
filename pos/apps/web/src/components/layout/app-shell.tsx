"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { useStoreHydration } from "@/hooks/use-hydration";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { CommandPalette } from "@/components/command-palette";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { StoreSetupWizard } from "@/components/onboarding/store-setup-wizard";
import { useRouter } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const setIsOnline = useAppStore((s) => s.setIsOnline);
  const currentUser = useAppStore((s) => s.currentUser);
  const hasHydrated = useStoreHydration(useAppStore);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const router = useRouter();

  // Check if initial store setup wizard has been run
  useEffect(() => {
    const isCompleted = localStorage.getItem("rf_setup_completed");
    if (!isCompleted) {
      setShowSetupWizard(true);
    }
  }, []);

  // Redirect to login only after store has hydrated and no session is found
  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.replace("/login");
    }
  }, [hasHydrated, currentUser, router]);

  // Initialize global retail POS F1-F10 + lock shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline]);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
            <span className="text-white text-2xl font-extrabold tracking-tight">R</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading RetailFlow POS...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          {children}
        </main>
      </div>

      {/* Global Overlays */}
      <CommandPalette />
      <PinLockScreen />
      {showSetupWizard && (
        <StoreSetupWizard onComplete={() => setShowSetupWizard(false)} />
      )}
    </div>
  );
}
