import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { isAuthPayLoad } from "../utils/auth.utils.js";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!authHeader.startsWith("Bearer")) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);

    if (!isAuthPayLoad(payload)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
