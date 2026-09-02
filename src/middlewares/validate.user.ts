import { createUserSchema, loginSchema } from "../schemas/user.schema.js";
import type { Request, Response, NextFunction } from "express";

export const validateRegisterUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    return res
      .status(400)
      .json({ message: "Validaton error", error: result.error.issues });
  }
  req.body = result.data;
  next();
};

export const validateLoginUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res
      .status(400)
      .json({ message: "Validation error", error: result.error.issues });
  }
  req.body = result.data;
  next();
};
