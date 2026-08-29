import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
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
  isLocked: boolean;
  commandPaletteOpen: boolean;
  hasHydrated: boolean;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (at: string) => void;
  setPendingChanges: (count: number) => void;
  setIsOnline: (online: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setIsLocked: (locked: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
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
      isLocked: false,
      commandPaletteOpen: false,
      hasHydrated: false,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setLastSyncedAt: (at) => set({ lastSyncedAt: at }),
      setPendingChanges: (count) => set({ pendingChanges: count }),
      setIsOnline: (isOnline) => set({ isOnline }),
      setCurrentUser: (user) => set({ currentUser: user }),
      setIsLocked: (isLocked) => set({ isLocked }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => set({ currentUser: null, isLocked: false, commandPaletteOpen: false }),
    }),
    {
      name: "rf-app-store",
      storage: createJSONStorage(() => tauriStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        currentUser: state.currentUser,
        isLocked: state.isLocked,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

