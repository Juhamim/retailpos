import { z } from "zod";

export const shopSettingsSchema = z.object({
  shopName: z.string().min(1).max(200),
  logo: z.string().optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().max(20).optional(),
  currency: z.string().default("INR"),
  currencySymbol: z.string().default("₹"),
});

export const taxSettingsSchema = z.object({
  defaultGstRate: z.enum(["0", "5", "12", "18", "28"]).default("18"),
  inclusiveTax: z.boolean().default(false),
});

export const posSettingsSchema = z.object({
  defaultCustomerId: z.string().optional(),
  invoiceFormat: z.enum(["thermal_58mm", "thermal_80mm", "a4"]).default("thermal_80mm"),
  printerName: z.string().optional(),
  autoAddBarcode: z.boolean().default(true),
  holdSaleOnBackspace: z.boolean().default(false),
  showProductImages: z.boolean().default(true),
});

export const backupSettingsSchema = z.object({
  autoBackup: z.boolean().default(true),
  backupIntervalMinutes: z.number().int().min(15).default(60),
  retentionDays: z.number().int().min(1).default(30),
});

export const appSettingsSchema = z.object({
  shop: shopSettingsSchema,
  tax: taxSettingsSchema,
  pos: posSettingsSchema,
  backup: backupSettingsSchema,
  theme: z.enum(["light", "dark", "system"]).default("system"),
});

export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;
export type TaxSettingsInput = z.infer<typeof taxSettingsSchema>;
export type POSSettingsInput = z.infer<typeof posSettingsSchema>;
export type BackupSettingsInput = z.infer<typeof backupSettingsSchema>;
export type AppSettingsInput = z.infer<typeof appSettingsSchema>;
