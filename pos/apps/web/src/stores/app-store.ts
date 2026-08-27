import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@retailflow/shared-types";
import { SyncStatus } from "@retailflow/shared-types";

type Theme = "light" | "dark" | "system";

interface AppState {
  theme: Theme;
  sidebarCollapsed: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  pendingChanges: number;
  isOnline: boolean;
  currentUser: User | null;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (at: string) => void;
  setPendingChanges: (count: number) => void;
  setIsOnline: (online: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarCollapsed: false,
      syncStatus: SyncStatus.SYNCED,
      lastSyncedAt: null,
      pendingChanges: 0,
      isOnline: true,
      currentUser: null,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setLastSyncedAt: (at) => set({ lastSyncedAt: at }),
      setPendingChanges: (count) => set({ pendingChanges: count }),
      setIsOnline: (isOnline) => set({ isOnline }),
      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
    }),
    {
      name: "rf-app-store",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
