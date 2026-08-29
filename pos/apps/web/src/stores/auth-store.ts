import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import { User, UserRole } from "@retailflow/shared-types";

interface AuthState {
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: Omit<User, "id" | "createdAt" | "updatedAt">) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  verifyPin: (pin: string) => User | null;
  verifyPassword: (username: string, pass: string) => User | null;
}

const DEFAULT_USERS: User[] = [
  {
    id: "user-admin",
    username: "admin",
    email: "admin@retailflow.com",
    passwordHash: "1234", // Using PIN as default password check in this local offline POS
    pin: "1234",
    firstName: "Admin",
    lastName: "Owner",
    role: UserRole.OWNER,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user-cashier",
    username: "cashier1",
    email: "cashier1@retailflow.com",
    passwordHash: "5678",
    pin: "5678",
    firstName: "Cashier",
    lastName: "One",
    role: UserRole.CASHIER,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user-manager",
    username: "manager",
    email: "manager@retailflow.com",
    passwordHash: "9999",
    pin: "9999",
    firstName: "Manager",
    lastName: "User",
    role: UserRole.MANAGER,
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

      setCurrentUser: (user) => set({ currentUser: user }),

      addUser: (userData) => {
        const id = `user-${Date.now()}`;
        const now = new Date().toISOString();
        const newUser: User = {
          ...userData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ users: [...state.users, newUser] }));
        return newUser;
      },

      updateUser: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          users: state.users.map((u) =>
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
          users: state.users.filter((u) => u.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser,
        }));
      },

      verifyPin: (pin) => {
        const { users } = get();
        return users.find((u) => u.pin === pin && u.isActive) || null;
      },

      verifyPassword: (username, pass) => {
        const { users } = get();
        const user = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase() && u.isActive
        );
        if (!user) return null;
        // In local/demo mode, verify either direct match or pin match
        if (user.passwordHash === pass || user.pin === pass) {
          return user;
        }
        return null;
      },
    }),
    {
      name: "retailflow-auth-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
