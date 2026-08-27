import { PaymentMethod } from "./enums";

export interface PaymentRecord {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  createdAt: string;
}

export interface SplitPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface PaymentSummary {
  total: number;
  paid: number;
  remaining: number;
  change: number;
  splitPayments: SplitPayment[];
}
