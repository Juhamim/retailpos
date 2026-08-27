import { ExpenseCategory, PaymentMethod } from "./enums";

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseWithUser extends Expense {
  userName: string;
}
