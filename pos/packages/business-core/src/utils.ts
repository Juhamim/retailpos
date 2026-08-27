export function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 21; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateInvoiceNumber(date: Date, sequence: number): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${dateStr}-${String(sequence).padStart(4, "0")}`;
}

export function calculateTax(amount: number, gstRate: string): number {
  const rate = parseFloat(gstRate) / 100;
  return Math.round(amount * rate * 100) / 100;
}

export function calculateDiscount(amount: number, discountPercent: number): number {
  return Math.round(amount * (discountPercent / 100) * 100) / 100;
}

export function formatCurrency(amount: number, symbol = "₹"): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export function getCurrentISO(): string {
  return new Date().toISOString();
}

export function getTodayStart(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export function getTodayEnd(): string {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now.toISOString();
}
