import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Expense } from "@retailflow/shared-types";
import { ExpenseCategory, PaymentMethod } from "@retailflow/shared-types";

interface ExpenseState {
  expenses: Expense[];
  categoryFilter: string;

  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  setCategoryFilter: (category: string) => void;
  getFilteredExpenses: () => Expense[];
  getTotalExpenses: () => number;
}

const INITIAL_EXPENSES: Expense[] = [
  { id: "exp-1", amount: 25000, category: ExpenseCategory.RENT, description: "Monthly shop rent - August 2026", date: "2026-08-01", paymentMethod: PaymentMethod.BANK_TRANSFER, userId: "user-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "exp-2", amount: 3500, category: ExpenseCategory.ELECTRICITY, description: "Electricity bill - August", date: "2026-08-05", paymentMethod: PaymentMethod.UPI, userId: "user-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "exp-3", amount: 45000, category: ExpenseCategory.SALARY, description: "Staff salary - August", date: "2026-08-01", paymentMethod: PaymentMethod.BANK_TRANSFER, userId: "user-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "exp-4", amount: 2000, category: ExpenseCategory.TRANSPORTATION, description: "Delivery van fuel", date: "2026-08-10", paymentMethod: PaymentMethod.CASH, userId: "user-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "exp-5", amount: 1500, category: ExpenseCategory.MAINTENANCE, description: "AC maintenance service", date: "2026-08-12", paymentMethod: PaymentMethod.CASH, userId: "user-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "exp-6", amount: 8000, category: ExpenseCategory.MARKETING, description: "Local newspaper ad - weekly", date: "2026-08-15", paymentMethod: PaymentMethod.UPI, userId: "user-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "exp-7", amount: 5000, category: ExpenseCategory.INVENTORY, description: "Shelf repair and new fixtures", date: "2026-08-18", paymentMethod: PaymentMethod.CASH, userId: "user-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "exp-8", amount: 1200, category: ExpenseCategory.OTHER, description: "Internet and phone bill", date: "2026-08-20", paymentMethod: PaymentMethod.UPI, userId: "user-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: INITIAL_EXPENSES,
      categoryFilter: "All",

      setExpenses: (expenses) => set({ expenses }),

      addExpense: (expenseData) => {
        const id = `exp-${Date.now()}`;
        const now = new Date().toISOString();
        const newExpense: Expense = {
          ...expenseData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ expenses: [newExpense, ...state.expenses] }));
        return newExpense;
      },

      updateExpense: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: now } : e
          ),
        }));
      },

      removeExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }));
      },

      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),

      getFilteredExpenses: () => {
        const { expenses, categoryFilter } = get();
        if (categoryFilter === "All") return expenses;
        return expenses.filter(
          (e) => e.category.toLowerCase() === categoryFilter.toLowerCase()
        );
      },

      getTotalExpenses: () => {
        return get().expenses.reduce((sum, e) => sum + e.amount, 0);
      },
    }),
    {
      name: "retailflow-expenses-storage",
    }
  )
);
