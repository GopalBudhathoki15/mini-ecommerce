import type { Request, Response, NextFunction } from "express";
import { pool } from "../db/db.js";
import { isValidId } from "../utils/product.utils.js";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "../schemas/product.schema.js";

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await pool.query(
      "select * from products where deleted_at is null",
    );

    res.status(200).json({ products: response.rows });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productId = Number(req.params.id);
    if (!isValidId(productId)) {
      return res.status(400).json({ message: "Invalid product id." });
    }
    const response = await pool.query(
      "select * from products where id=$1 and deleted_at is null",
      [productId],
    );
    if (!response.rows[0]) {
      return res.status(404).json({ message: "product not found." });
    }

    return res.status(200).json({ product: response.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = req.body as CreateProductInput;
    const response = await pool.query(
      `INSERT INTO products (title, price, stock, category) VALUES($1, $2, $3, $4) RETURNING *`,
      [product.title, product.price, product.stock, product.category],
    );
    return res.status(201).json({ product: response.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productId = Number(req.params.id);
    if (!isValidId(productId)) {
      return res.status(400).json({ message: "Invalid product Id" });
    }
    const updates = req.body as UpdateProductInput;

    const fields = Object.keys(updates) as (keyof UpdateProductInput)[];
    const setClasue: string[] = [];
    const values: unknown[] = [];

    fields.forEach((field, index) => {
      setClasue.push(`${field}=$${index + 1}`);
      values.push(updates[field]);
    });

    values.push(productId);

    const response = await pool.query(
      `update products set ${setClasue.join(",")} where id=$${values.length} and deleted_at is null returning *`,
      values,
    );
    if (!response.rows[0]) {
      return res.status(404).json({ message: "product not found" });
    }
    return res.status(200).json({ product: response.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productId = Number(req.params.id);
    if (!isValidId(productId)) {
      return res.status(404).json({ message: "Invalid Product Id." });
    }
    const response = await pool.query(
      "update products set deleted_at=now() where id=$1 returning *",
      [productId],
    );
    return res.status(200).json({
      message: "successfully deleted product",
      product: response.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
