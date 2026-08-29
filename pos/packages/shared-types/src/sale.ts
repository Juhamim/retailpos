import { SaleStatus } from "./enums";
import { PaymentRecord } from "./payment";

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  userId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: SaleStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  productSku: string;
  hsnCode?: string;
  mrp?: number;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
  customerName?: string;
  cashierName: string;
  payments: PaymentRecord[];
}

export interface HeldSale {
  id: string;
  saleData: string;
  note?: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productSku: string;
  barcode?: string;
  hsnCode?: string;
  mrp?: number;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Cart {
  items: CartItem[];
  customerId?: string;
  customerName?: string;
  discountAmount: number;
  taxAmount: number;
  subtotal: number;
  totalAmount: number;
  note?: string;
}
