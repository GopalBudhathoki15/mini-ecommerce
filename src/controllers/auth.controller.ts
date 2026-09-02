import type { Request, Response, NextFunction } from "express";
import { pool } from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type {
  CreateUserInput,
  LoginUserInput,
} from "../schemas/user.schema.js";

export const registerUser = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "insert into users (name, email, password) values($1, $2, $3) returning name, email",
      [name, email, hashedPassword],
    );

    return res
      .status(201)
      .json({ message: "user registered successfully.", user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("select * from users where email=$1", [
      email,
    ]);

    if (!result.rows[0]) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];
    const isMatchedPassword = await bcrypt.compare(password, user.password);

    if (!isMatchedPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      token: token,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
