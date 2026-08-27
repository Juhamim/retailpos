import { getDatabase, type DatabaseAdapter } from "@retailflow/database";
import { generateId, generateInvoiceNumber, getCurrentISO, calculateTax } from "./utils";
import type { SaleRow, SaleItemRow, PaymentRow, HeldSaleRow } from "@retailflow/database";
import type { Cart, CartItem, PaymentMethod } from "@retailflow/shared-types";

export class SaleService {
  private db: DatabaseAdapter;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
  }

  completeSale(cart: Cart, userId: string, paymentMethods: { method: PaymentMethod; amount: number; reference?: string }[]) {
    const now = getCurrentISO();
    const saleId = generateId();
    const saleDate = new Date();
    const sequence = this.getTodaySaleCount() + 1;
    const invoiceNumber = generateInvoiceNumber(saleDate, sequence);

    let subtotal = 0;
    let taxAmount = 0;

    for (const item of cart.items) {
      const itemTotal = item.unitPrice * item.quantity;
      const discount = itemTotal * (item.discountPercent / 100);
      const afterDiscount = itemTotal - discount;
      subtotal += afterDiscount;
      taxAmount += calculateTax(afterDiscount, item.taxRate.toString());
    }

    const totalAmount = subtotal + taxAmount - cart.discountAmount;

    // Create sale
    const sale: SaleRow = {
      id: saleId,
      invoice_number: invoiceNumber,
      customer_id: cart.customerId,
      user_id: userId,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: cart.discountAmount,
      total_amount: totalAmount,
      status: "completed",
      notes: cart.note,
      created_at: now,
      updated_at: now,
    };
    this.db.insert("sales", sale as unknown as Record<string, unknown>);

    // Create sale items
    for (const item of cart.items) {
      const itemTotal = item.unitPrice * item.quantity;
      const discount = itemTotal * (item.discountPercent / 100);
      const afterDiscount = itemTotal - discount;
      const itemTax = calculateTax(afterDiscount, item.taxRate.toString());

      const saleItem: SaleItemRow = {
        id: generateId(),
        sale_id: saleId,
        product_id: item.productId,
        product_name: item.productName,
        product_sku: item.productSku,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discountPercent,
        tax_rate: item.taxRate,
        tax_amount: itemTax,
        total_amount: afterDiscount + itemTax,
        created_at: now,
      };
      this.db.insert("sale_items", saleItem as unknown as Record<string, unknown>);
    }

    // Create payments
    for (const pm of paymentMethods) {
      const payment: PaymentRow = {
        id: generateId(),
        sale_id: saleId,
        method: pm.method,
        amount: pm.amount,
        reference: pm.reference,
        created_at: now,
      };
      this.db.insert("payments", payment as unknown as Record<string, unknown>);
    }

    return { saleId, invoiceNumber, totalAmount };
  }

  getSaleById(id: string) {
    const sale = this.db.getTable<SaleRow>("sales").find((r) => r.id === id);
    if (!sale) return null;

    const items = this.db.getTable<SaleItemRow>("sale_items").filter((r) => r.sale_id === id);
    const paymentRecords = this.db.getTable<PaymentRow>("payments").filter((r) => r.sale_id === id);

    return { ...sale, items, payments: paymentRecords };
  }

  getRecentSales(limit = 20) {
    return this.db
      .getTable<SaleRow>("sales")
      .filter((r) => r.status === "completed")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  getTodaySales() {
    const today = new Date().toISOString().slice(0, 10);
    return this.db
      .getTable<SaleRow>("sales")
      .filter((r) => r.status === "completed" && r.created_at.startsWith(today));
  }

  getTodaySaleCount() {
    return this.getTodaySales().length;
  }

  getTodayRevenue() {
    return this.getTodaySales().reduce((sum, s) => sum + s.total_amount, 0);
  }

  cancelSale(id: string) {
    this.db.update("sales", { status: "canceled", updated_at: getCurrentISO() } as Record<string, unknown>, { id });
  }

  holdSale(cart: Cart, userId: string, note?: string) {
    const id = generateId();
    const now = getCurrentISO();
    const held: HeldSaleRow = {
      id,
      sale_data: JSON.stringify(cart),
      note,
      user_id: userId,
      created_at: now,
    };
    this.db.insert("held_sales", held as unknown as Record<string, unknown>);
    return id;
  }

  getHeldSales() {
    return this.db
      .getTable<HeldSaleRow>("held_sales")
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  resumeHeldSale(id: string) {
    const held = this.db.getTable<HeldSaleRow>("held_sales").find((r) => r.id === id);
    if (!held) return null;
    this.db.delete("held_sales", { id });
    return JSON.parse(held.sale_data) as Cart;
  }

  deleteHeldSale(id: string) {
    this.db.delete("held_sales", { id });
  }

  count() {
    return this.db.getTable<SaleRow>("sales").filter((r) => r.status === "completed").length;
  }
}
