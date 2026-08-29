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

const INITIAL_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Rajesh Kumar", phone: "9876543210", email: "rajesh@email.com", address: "12 MG Road, Bangalore", loyaltyPoints: 1250, creditBalance: 0, totalOrders: 45, totalSpent: 12500, lastPurchaseAt: "2026-08-27", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "c2", name: "Priya Sharma", phone: "9876543211", email: "priya@email.com", address: "45 Indiranagar, Bangalore", loyaltyPoints: 890, creditBalance: 200, totalOrders: 32, totalSpent: 8900, lastPurchaseAt: "2026-08-26", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "c3", name: "Amit Patel", phone: "9876543212", email: "amit@email.com", address: "78 Koramangala, Bangalore", loyaltyPoints: 1560, creditBalance: 0, totalOrders: 28, totalSpent: 15600, lastPurchaseAt: "2026-08-25", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "c4", name: "Sunita Devi", phone: "9876543213", email: "", address: "19 Jayanagar, Bangalore", loyaltyPoints: 450, creditBalance: 0, totalOrders: 18, totalSpent: 4500, lastPurchaseAt: "2026-08-24", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "c5", name: "Mohammed Ali", phone: "9876543214", email: "mohammed@email.com", address: "88 Commercial St, Bangalore", loyaltyPoints: 2200, creditBalance: 0, totalOrders: 52, totalSpent: 22000, lastPurchaseAt: "2026-08-27", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "c6", name: "Anjali Singh", phone: "9876543215", email: "anjali@email.com", address: "33 Whitefield, Bangalore", loyaltyPoints: 380, creditBalance: 0, totalOrders: 15, totalSpent: 3800, lastPurchaseAt: "2026-08-20", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "c7", name: "Vikram Reddy", phone: "9876543216", email: "vikram@email.com", address: "55 HSR Layout, Bangalore", loyaltyPoints: 1820, creditBalance: 500, totalOrders: 41, totalSpent: 18200, lastPurchaseAt: "2026-08-27", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "c8", name: "Deepa Nair", phone: "9876543217", email: "", address: "22 Malleshwaram, Bangalore", loyaltyPoints: 670, creditBalance: 0, totalOrders: 22, totalSpent: 6700, lastPurchaseAt: "2026-08-22", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: INITIAL_CUSTOMERS,
      creditLedger: [
        { id: "ledger-init-1", customerId: "c2", type: "charge", amount: 200, note: "Initial balance", createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
        { id: "ledger-init-2", customerId: "c7", type: "charge", amount: 500, note: "Initial balance", createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
      ],
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
