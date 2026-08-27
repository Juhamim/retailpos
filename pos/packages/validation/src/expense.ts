import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.enum([
    "rent",
    "electricity",
    "salary",
    "transportation",
    "inventory",
    "maintenance",
    "marketing",
    "other",
  ]),
  description: z.string().min(1, "Description is required").max(500),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.enum(["cash", "upi", "card", "bank_transfer"]),
  reference: z.string().max(100).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
