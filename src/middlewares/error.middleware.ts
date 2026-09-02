import type { NextFunction, Request, Response } from "express";
import { isPostgresError } from "../utils/error.utils.js";

export const errorHandle = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (isPostgresError(error)) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "user already exist." });
    }
  }
  if (error instanceof Error) {
    console.log(error.message);
  }
  return res.status(500).json({ message: "Internal server error." });
};
