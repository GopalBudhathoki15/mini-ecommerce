import request from "supertest";
import app from "../../app.js";
import { pool } from "../../db/db.js";
import bcrypt from "bcrypt";

export const createAdminAndLogin = async (): Promise<string> => {
  const hashedPassword = await bcrypt.hash("12345678", 10);
  await pool.query(
    "insert into users (name,email,password, role) values($1, $2, $3, $4)",
    ["Admin User", "admin@example.com", hashedPassword, "admin"],
  );

  const result = await request(app).post("/auth/login").send({
    email: "admin@example.com",
    password: "12345678",
  });

  if (typeof result.body.token !== "string") {
    throw new Error("Login did not return a token");
  }

  return result.body.token;
};

export const createCustomerAndLogin = async (): Promise<string> => {
  await request(app).post("/auth/register").send({
    name: "Test User",
    email: "test@example.com",
    password: "12345678",
  });

  const result = await request(app).post("/auth/login").send({
    email: "test@example.com",
    password: "12345678",
  });

  if (typeof result.body.token !== "string") {
    throw new Error("Login did not return a token");
  }

  return result.body.token;
};
