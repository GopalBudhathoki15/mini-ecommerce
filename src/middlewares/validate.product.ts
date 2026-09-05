import {
  createProductSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";
import type { Request, Response, NextFunction } from "express";

export const validateCreateProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = createProductSchema.safeParse(req.body);

  if (!result.success) {
    return res
      .status(400)
      .json({ message: "Validaton Error.", error: result.error.issues });
  }
  req.body = result.data;
  next();
};

export const validateUpdateProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = updateProductSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Validaton Error" });
  }
  req.body = result.data;
  next();
};
