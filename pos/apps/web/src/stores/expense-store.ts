import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
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

const INITIAL_EXPENSES: Expense[] = [];

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
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
