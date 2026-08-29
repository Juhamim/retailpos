import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import type { Customer } from "@retailflow/shared-types";

export interface CreditLedgerEntry {
  id: string;
  customerId: string;
  type: "charge" | "payment"; // charge = bought on credit, payment = paid back
  amount: number;
  method?: string;
  note?: string;
  createdAt: string;
}

interface CustomerState {
  customers: Customer[];
  creditLedger: CreditLedgerEntry[];
  searchQuery: string;

  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Omit<Customer, "id" | "totalSpent" | "totalOrders" | "loyaltyPoints" | "createdAt" | "updatedAt" | "creditBalance"> & { creditBalance?: number }) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  addCustomerOrder: (customerId: string, orderAmount: number) => void;
  setSearchQuery: (query: string) => void;
  getFilteredCustomers: () => Customer[];
  recordCreditTransaction: (customerId: string, type: "charge" | "payment", amount: number, method?: string, note?: string) => void;
  deductLoyaltyPoints: (customerId: string, points: number) => void;
}

const INITIAL_CUSTOMERS: Customer[] = [];

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: INITIAL_CUSTOMERS,
      creditLedger: [],
      searchQuery: "",

      setCustomers: (customers) => set({ customers }),

      addCustomer: (customerData) => {
        const id = `cust-${Date.now()}`;
        const now = new Date().toISOString();
        const newCustomer: Customer = {
          ...customerData,
          id,
          loyaltyPoints: 0,
          creditBalance: customerData.creditBalance ?? 0,
          totalSpent: 0,
          totalOrders: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ customers: [newCustomer, ...state.customers] }));
        return newCustomer;
      },

      updateCustomer: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: now } : c
          ),
        }));
      },

      removeCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },

      addCustomerOrder: (customerId, orderAmount) => {
        const now = new Date().toISOString();
        const pointsEarned = Math.floor(orderAmount / 100); // ₹100 spent = 1 point earned (Kerala commercial suite)
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  totalOrders: c.totalOrders + 1,
                  totalSpent: c.totalSpent + orderAmount,
                  loyaltyPoints: c.loyaltyPoints + pointsEarned,
                  lastPurchaseAt: now,
                  updatedAt: now,
                }
              : c
          ),
        }));
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      getFilteredCustomers: () => {
        const { customers, searchQuery } = get();
        if (!searchQuery) return customers;
        const q = searchQuery.toLowerCase();
        return customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q))
        );
      },

      recordCreditTransaction: (customerId, type, amount, method, note) => {
        const now = new Date().toISOString();
        const newEntry: CreditLedgerEntry = {
          id: `ledger-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          customerId,
          type,
          amount,
          method,
          note,
          createdAt: now,
        };

        set((state) => {
          const updatedCustomers = state.customers.map((c) => {
            if (c.id === customerId) {
              const diff = type === "charge" ? amount : -amount;
              return {
                ...c,
                creditBalance: Math.max(0, c.creditBalance + diff),
                updatedAt: now,
              };
            }
            return c;
          });

          return {
            customers: updatedCustomers,
            creditLedger: [newEntry, ...state.creditLedger],
          };
        });
      },

      deductLoyaltyPoints: (customerId, points) => {
        const now = new Date().toISOString();
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  loyaltyPoints: Math.max(0, c.loyaltyPoints - points),
                  updatedAt: now,
                }
              : c
          ),
        }));
      },
    }),
    {
      name: "retailflow-customers-storage",
      storage: createJSONStorage(() => tauriStorage),
      partialize: (state) => ({
        customers: state.customers,
        creditLedger: state.creditLedger,
      }),
    }
  )
);
