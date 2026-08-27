import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(200),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  gstNumber: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
