import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),

  description: z.string().trim().optional(),

  price: z.number().positive("Price must be greater than 0."),

  stock: z
    .number()
    .int("Stock must be an integer.")
    .nonnegative("Stock cannot be negative."),

  category: z.string().trim().min(1, "Category is required."),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").optional(),

    description: z.string().trim().optional(),

    price: z.number().positive("Price must be greater than 0.").optional(),

    stock: z
      .number()
      .int("Stock must be an integer.")
      .nonnegative("Stock cannot be negative.")
      .optional(),

    category: z.string().trim().min(1, "Category is required.").optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided.",
  );

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
