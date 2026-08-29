"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { CommandPalette } from "@/components/command-palette";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { useRouter } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const setIsOnline = useAppStore((s) => s.setIsOnline);
  const currentUser = useAppStore((s) => s.currentUser);
  const router = useRouter();

  // Redirect to login if user session is not active
  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
    }
  }, [currentUser, router]);

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
    </div>
  );
}
