import QRCode from "qrcode";

export interface UpiPaymentDetails {
  upiId?: string;        // e.g. "9876543210@paytm" or "retailmart@okaxis"
  payeeVpa?: string;     // alias for upiId
  payeeName: string;     // e.g. "RetailFlow Mart"
  amount?: number;       // e.g. 245.50 (optional, if omitted or 0 generates open amount QR)
  invoiceNumber?: string;// e.g. "INV-20260830-1042"
  transactionNote?: string; // e.g. "POS Live Test Payment"
  currency?: string;     // Default "INR"
}

export interface UpiQrOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

/**
 * Builds the authentic NPCI Indian UPI payment URL
 * Format: upi://pay?pa=...&pn=...&am=...&tn=...&cu=INR
 */
export function generateUpiPaymentUrl(details: UpiPaymentDetails): string {
  const vpa = (details.upiId || details.payeeVpa || "").trim();
  if (!vpa) return "";

  const pa = encodeURIComponent(vpa);
  const pn = encodeURIComponent((details.payeeName || "RetailFlow Merchant").trim());
  const cu = details.currency || "INR";

  let url = `upi://pay?pa=${pa}&pn=${pn}&cu=${cu}`;

  if (details.amount !== undefined && details.amount > 0) {
    url += `&am=${details.amount.toFixed(2)}`;
  }

  if (details.transactionNote) {
    url += `&tn=${encodeURIComponent(details.transactionNote.trim())}`;
  } else if (details.invoiceNumber) {
    const cleanInvoice = details.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "");
    url += `&tn=${encodeURIComponent(`Bill_${cleanInvoice}`)}`;
  }

  return url;
}

/**
 * Generates an SVG or PNG Data URL QR code for the given UPI payment details
 */
export async function generateUpiQrDataUrl(
  details: UpiPaymentDetails,
  options: UpiQrOptions = {}
): Promise<string> {
  const upiUrl = generateUpiPaymentUrl(details);
  if (!upiUrl) return "";

  try {
    return await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: options.errorCorrectionLevel || "M",
      margin: options.margin !== undefined ? options.margin : 1,
      width: options.width || 260,
      color: {
        dark: options.darkColor || "#0f172a",
        light: options.lightColor || "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate UPI QR:", err);
    return "";
  }
}

/**
 * Generates high-contrast monochrome dynamic QR for Thermal 80mm printers
 */
export async function generateThermalUpiQr(details: UpiPaymentDetails): Promise<string> {
  return generateUpiQrDataUrl(details, {
    width: 180,
    margin: 0,
    darkColor: "#000000",
    lightColor: "#ffffff",
    errorCorrectionLevel: "M",
  });
}

/**
 * Generates high-res dynamic QR for A4 PDF Tax Invoices
 */
export async function generatePdfUpiQr(details: UpiPaymentDetails): Promise<string> {
  return generateUpiQrDataUrl(details, {
    width: 320,
    margin: 1,
    darkColor: "#0f172a",
    lightColor: "#ffffff",
    errorCorrectionLevel: "H",
  });
}
