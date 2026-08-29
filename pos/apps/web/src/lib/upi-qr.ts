import QRCode from "qrcode";

export interface UpiPaymentDetails {
  upiId: string;       // e.g. "9876543210@paytm" or "retailmart@okaxis"
  payeeName: string;   // e.g. "RetailFlow Mart"
  amount: number;      // e.g. 245.50
  invoiceNumber: string; // e.g. "INV-20260830-1042"
  currency?: string;   // Default "INR"
}

/**
 * Builds the standard NPCI Indian UPI payment URL
 * Format: upi://pay?pa=...&pn=...&am=...&tn=...&cu=INR
 */
export function generateUpiPaymentUrl(details: UpiPaymentDetails): string {
  const pa = encodeURIComponent(details.upiId.trim());
  const pn = encodeURIComponent(details.payeeName.trim());
  const am = details.amount.toFixed(2);
  const tn = encodeURIComponent(`Bill_${details.invoiceNumber}`);
  const cu = details.currency || "INR";

  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}&cu=${cu}`;
}

/**
 * Generates an SVG or PNG Data URL QR code for the given UPI payment details
 */
export async function generateUpiQrDataUrl(details: UpiPaymentDetails): Promise<string> {
  const upiUrl = generateUpiPaymentUrl(details);
  try {
    return await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate UPI QR:", err);
    return "";
  }
}
