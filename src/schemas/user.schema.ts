import { error } from "node:console";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, "Name must be at least 5 character long.")
    .max(50, "Name must not exceed 50 characters."),
  email: z.email("Please provide a valid email address."),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters long.")
    .max(72, "Password must not exceed 72 characters."),
});

export const loginSchema = createUserSchema.pick({
  email: true,
  password: true,
});

export type LoginUserInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
