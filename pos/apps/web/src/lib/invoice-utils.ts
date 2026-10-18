/**
 * RetailFlow POS - Invoice Utilities
 * Functions for professional GST tax invoicing, statutory calculations, and number-to-words conversion.
 */

import { CartItem } from "@retailflow/shared-types";

/**
 * Converts a numeric amount into standard Indian currency words (INR).
 * Example: 1450.50 -> "INR One Thousand Four Hundred Fifty and Fifty Paise Only"
 */
export function numberToWordsIndian(amount: number): string {
  if (amount == null || isNaN(amount) || amount <= 0) {
    return "INR Zero Only";
  }

  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertLessThanOneThousand(num: number): string {
    let current = "";
    if (num >= 100) {
      current += units[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      current += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }
    if (num > 0) {
      current += units[num] + " ";
    }
    return current.trim();
  }

  const roundedAmount = Math.round(amount * 100) / 100;
  const numStr = roundedAmount.toFixed(2);
  const [rupeesStr, paiseStr] = numStr.split(".");
  let rupees = parseInt(rupeesStr, 10);
  const paise = parseInt(paiseStr, 10);

  let words = "";

  // Crores (1,00,00,000)
  if (rupees >= 10000000) {
    const crores = Math.floor(rupees / 10000000);
    words += convertLessThanOneThousand(crores) + " Crore ";
    rupees %= 10000000;
  }

  // Lakhs (1,00,000)
  if (rupees >= 100000) {
    const lakhs = Math.floor(rupees / 100000);
    words += convertLessThanOneThousand(lakhs) + " Lakh ";
    rupees %= 100000;
  }

  // Thousands (1,000)
  if (rupees >= 1000) {
    const thousands = Math.floor(rupees / 1000);
    words += convertLessThanOneThousand(thousands) + " Thousand ";
    rupees %= 1000;
  }

  // Remaining Hundreds, Tens & Units
  if (rupees > 0) {
    words += convertLessThanOneThousand(rupees) + " ";
  }

  let result = "INR " + words.trim();

  if (paise > 0) {
    result += " and " + convertLessThanOneThousand(paise) + " Paise";
  }

  return result + " Only";
}

export interface HsnTaxSummaryRow {
  hsn: string;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalTax: number;
}

/**
 * Calculates statutory GST tax breakdown grouped by HSN/SAC code.
 */
export function calculateHsnTaxBreakdown(items: CartItem[]): HsnTaxSummaryRow[] {
  const map = new Map<string, HsnTaxSummaryRow>();

  for (const item of items) {
    const hsn = item.hsnCode?.trim() || "General";
    const gross = item.unitPrice * item.quantity;
    const lineDiscount = gross * ((item.discountPercent || 0) / 100);
    const taxable = gross - lineDiscount;
    const tax = item.taxAmount || 0;
    const halfRate = (item.taxRate || 0) / 2;
    const halfTax = tax / 2;

    const existing = map.get(hsn) || {
      hsn,
      taxableValue: 0,
      cgstRate: halfRate,
      cgstAmount: 0,
      sgstRate: halfRate,
      sgstAmount: 0,
      totalTax: 0,
    };

    existing.taxableValue += taxable;
    existing.cgstAmount += halfTax;
    existing.sgstAmount += halfTax;
    existing.totalTax += tax;

    map.set(hsn, existing);
  }

  return Array.from(map.values());
}
