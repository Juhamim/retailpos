import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(200),
  contactPerson: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  gstNumber: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
