import { describe, it, expect, beforeEach, should } from "vitest";
import request from "supertest";
import app from "../app.js";
import { pool } from "../db/db.js";
import { email } from "zod";

describe("Post auth/register", () => {
  beforeEach(async () => {
    await pool.query("delete from users where email=$1", ["test@example.com"]);
  });
  it("should register a user", async () => {
    const result = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "123456789",
    });

    expect(result.status).toBe(201);
    expect(result.body.message).toBe("user registered successfully.");
  });

  it("should return 409 for duplicate email", async () => {
    //creating user
    await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "1234567890",
    });
    //duplicate user test
    const result = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "1234567890",
    });

    expect(result.status).toBe(409);
  });

  //validation error test
  it("should return 400 for request body validation error", async () => {
    const result = await request(app).post("/auth/register").send({
      name: "gop",
    });

    expect(result.status).toBe(400);
    expect(result.body.error[0].message).toBe(
      "Name must be at least 5 character long.",
    );
  });

  //hashed password test
  it("should test that the hashed password is saved in db", async () => {
    await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "12345678",
    });
    const result = await pool.query(
      "select password from users where email= $1",
      ["test@example.com"],
    );

    expect(result.rows[0].password).not.toBe("12345678");
  });
});

describe("Post auth/login", () => {
  beforeEach(async () => {
    await pool.query("delete from users where email=$1", ["test@example.com"]);
  });
  it("should login user successfully", async () => {
    await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "12345678",
    });
    const result = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "12345678",
    });

    expect(result.status).toBe(200);
    expect(result.body.message).toBe("Login successful");
    expect(result.body.user.email).toBe("test@example.com");
    expect(result.body.token).toBeDefined();
  });

  it("should reject invalid email", async () => {
    await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "12345678",
    });

    const result = await request(app).post("/auth/login").send({
      email: "wrong@example.com",
      password: "12345678",
    });

    expect(result.status).toBe(401);
    expect(result.body.message).toBe("Invalid email or password.");
  });

  it("should reject wrong password", async () => {
    await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "12345678",
    });

    const result = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "2345135533",
    });

    expect(result.status).toBe(401);
    expect(result.body.message).toBe("Invalid email or password.");
  });
  it("should reject login with missing email", async () => {
    const result = await request(app).post("/auth/login").send({
      password: "12345678",
    });
    expect(result.body.error[0].message).toBe(
      "Please provide a valid email address.",
    );
    expect(result.status).toBe(400);
  });

  it("should reject login with missing password", async () => {
    const result = await request(app).post("/auth/login").send({
      email: "test@example.com",
    });
    expect(result.status).toBe(400);
  });
});
