import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  sku: z.string().min(1, "SKU is required").max(50),
  barcode: z.string().max(50).optional(),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  purchasePrice: z.number().min(0, "Purchase price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  gstRate: z.enum(["0", "5", "12", "18", "28"]),
  discountPercent: z.number().min(0).max(100).default(0),
  stockQuantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(10),
  unit: z.string().default("piece"),
  isWeighable: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
