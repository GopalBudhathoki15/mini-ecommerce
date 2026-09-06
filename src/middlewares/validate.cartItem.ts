import { addToCartItemSchema } from "../schemas/cartItem.schema.js";
import type { Request, Response, NextFunction } from "express";
import { updateCartItemSchema } from "../schemas/cartItem.schema.js";

export const validateAddToCartItem = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = addToCartItemSchema.safeParse(req.body);

  if (!result.success) {
    return res
      .status(400)
      .json({ message: "Validation Error", error: result.error.issues });
  }
  req.body = result.data;
  next();
};

export const validateUpdateCartItem = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = updateCartItemSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Validation Error",
      error: result.error.issues,
    });
  }

  req.body = result.data;
  next();
};
