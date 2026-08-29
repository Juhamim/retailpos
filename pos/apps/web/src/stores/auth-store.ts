import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import { User, UserRole } from "@retailflow/shared-types";

interface AuthState {
  users: User[];
  currentUser: User | null;
  hasHydrated: boolean;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: Omit<User, "id" | "createdAt" | "updatedAt">) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  verifyPin: (pin: string) => User | null;
  verifyPassword: (username: string, pass: string) => User | null;
  updatePin: (newPin: string) => void;
  setHasHydrated: (v: boolean) => void;
}

const DEFAULT_USERS: User[] = [
  {
    id: "user-admin",
    username: "admin",
    email: "admin@retailflow.com",
    passwordHash: "1234",
    pin: "1234",
    firstName: "Store",
    lastName: "Admin",
    role: UserRole.OWNER,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: DEFAULT_USERS,
      currentUser: null,
      hasHydrated: false,

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setCurrentUser: (user) => set({ currentUser: user }),

      updatePin: (newPin) => {
        const now = new Date().toISOString();
        set((state) => ({
          users: (state.users || DEFAULT_USERS).map((u) =>
            u.role === UserRole.OWNER || u.username === "admin"
              ? { ...u, pin: newPin, passwordHash: newPin, updatedAt: now }
              : u
          ),
        }));
      },

      addUser: (userData) => {
        const id = `user-${Date.now()}`;
        const now = new Date().toISOString();
        const newUser: User = {
          ...userData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ users: [...(state.users || DEFAULT_USERS), newUser] }));
        return newUser;
      },

      updateUser: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          users: (state.users || DEFAULT_USERS).map((u) =>
            u.id === id ? { ...u, ...updates, updatedAt: now } : u
          ),
          currentUser:
            state.currentUser?.id === id
              ? { ...state.currentUser, ...updates, updatedAt: now }
              : state.currentUser,
        }));
      },

      deleteUser: (id) => {
        set((state) => ({
          users: (state.users || DEFAULT_USERS).filter((u) => u.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser,
        }));
      },

      verifyPin: (rawPin) => {
        const pin = String(rawPin || "").trim();
        const usersList = get().users && get().users.length > 0 ? get().users : DEFAULT_USERS;
        return usersList.find((u) => u.pin === pin && u.isActive) || null;
      },

      verifyPassword: (rawUsername, rawPass) => {
        const username = String(rawUsername || "").trim().toLowerCase();
        const pass = String(rawPass || "").trim();
        const usersList = get().users && get().users.length > 0 ? get().users : DEFAULT_USERS;
        const user = usersList.find(
          (u) => u.username.toLowerCase() === username && u.isActive
        );
        if (!user) return null;
        // In local/demo mode, verify either direct password match, pin match, or default
        if (user.passwordHash === pass || user.pin === pass || pass === "1234") {
          return user;
        }
        return null;
      },
    }),
    {
      name: "retailflow-auth-storage",
      storage: createJSONStorage(() => tauriStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          // If users list is empty, pre-populate default accounts
          if (!state.users || state.users.length === 0) {
            state.users = DEFAULT_USERS;
          }
        }
      },
    }
  )
);
