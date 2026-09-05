import { describe, expect, it, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { pool } from "../db/db.js";
import {
  createAdminAndLogin,
  createCustomerAndLogin,
} from "./helpers/auth.heloper.js";

describe("GET /products", () => {
  afterEach(async () => {
    await pool.query("delete from products where title in ($1,$2, $3)", [
      "Test Product",
      "Deleted Product",
      "Active Product",
    ]);
  });
  it("should return all products", async () => {
    await pool.query(
      `INSERT INTO products (title, price, stock, category)
   VALUES ($1, $2, $3, $4)`,
      ["Test Product", 1000, 10, "Test Category"],
    );
    const result = await request(app).get("/products");
    const products = result.body.products;

    expect(result.status).toBe(200);
    expect(
      products.some(
        (product: { title: string }) => product.title === "Test Product",
      ),
    ).toBe(true);
  });

  it("should return only active products", async () => {
    await pool.query(
      `INSERT INTO products (title, price, stock, category)
   VALUES ($1, $2, $3, $4)`,
      ["Active Product", 1000, 10, "Test Category"],
    );
    await pool.query(
      `INSERT INTO products (title, price, stock, category, deleted_at)
   VALUES ($1, $2, $3, $4, NOW())`,
      ["Deleted Product", 1000, 10, "Test Category"],
    );
    const result = await request(app).get("/products");
    expect(result.status).toBe(200);
    expect(
      result.body.products.some(
        (product: { title: string; deleted_at: string | null }) =>
          product.title === "Active Product" && product.deleted_at === null,
      ),
    ).toBe(true);
  });

  it("should return an empty array when no active products exist", async () => {
    const result = await request(app).get("/products");

    expect(result.status).toBe(200);
    expect(result.body.products).toEqual([]);
  });
});

describe("GET /products/:id", () => {
  afterEach(async () => {
    await pool.query("delete from products where title=$1", ["Test Product"]);
  });
  it("should return a product by id", async () => {
    const response = await pool.query(
      `INSERT INTO products (title, price, stock, category)
   VALUES ($1, $2, $3, $4) RETURNING *`,
      ["Test Product", 1000, 10, "Test Category"],
    );
    const product = response.rows[0];
    const productId = product.id;
    const result = await request(app).get(`/products/${productId}`);
    expect(result.status).toBe(200);
    expect(result.body.product.id).toBe(productId);
    expect(result.body.product.title).toBe("Test Product");
  });

  it("should return 404 when product does not exist", async () => {
    await pool.query(
      `INSERT INTO products (title, price, stock, category)
   VALUES ($1, $2, $3, $4)`,
      ["Test Product", 1000, 10, "Test Category"],
    );

    const result = await request(app).get("/products/999999");

    expect(result.status).toBe(404);
  });

  it("should return 404 when no active product exist", async () => {
    const response = await pool.query(
      `INSERT INTO products (title, price, stock, category, deleted_at)
   VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      ["Test Product", 1000, 10, "Test Category"],
    );
    const product = response.rows[0];
    const productId = product.id;
    const result = await request(app).get(`/products/${productId}`);

    expect(result.status).toBe(404);
  });

  it("should return 400 for an invalid product id", async () => {
    const result = await request(app).get("/products/abc");

    expect(result.status).toBe(400);
  });
});

describe("POST /products", () => {
  afterEach(async () => {
    await pool.query("delete from users where email=$1", ["test@example.com"]);
    await pool.query("delete from users where email=$1", ["admin@example.com"]);

    await pool.query("delete from products where title=$1", ["MacBook Pro M4"]);
  });
  it("should reject the unauthenticated user", async () => {
    const result = await request(app).post("/products").send({});
    expect(result.status).toBe(401);
  });

  it("should reject non-admin user", async () => {
    const token = await createCustomerAndLogin();

    const result = await request(app)
      .post("/products")
      .send({})
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(403);
  });

  it("should allow admin to create a product", async () => {
    const token = await createAdminAndLogin();
    const result = await request(app)
      .post("/products")
      .send({
        title: "MacBook Pro M4",
        description: "14-inch MacBook Pro with M4 chip",
        price: 249999,
        stock: 10,
        category: "Laptop",
      })
      .set("Authorization", `Bearer ${token}`);
    expect(result.status).toBe(201);
    expect(result.body.product.title).toBe("MacBook Pro M4");
  });

  it("should reject product with invalid price", async () => {
    const token = await createAdminAndLogin();

    // POST /products with price <= 0
    const result = await request(app)
      .post("/products")
      .send({
        title: "Iphone 13 pro max",
        description: "Iphone 13 pro max with 256gb storage.",
        price: 0,
        stock: 10,
        category: "Phone",
      })
      .set("Authorization", `Bearer ${token}`);
    expect(result.status).toBe(400);
  });
});

describe("PATCH /products/:id", () => {
  afterEach(async () => {
    await pool.query("delete from users where email=$1", ["test@example.com"]);
    await pool.query("delete from users where email=$1", ["admin@example.com"]);

    await pool.query("delete from products where category=$1", ["Laptop"]);
  });
  it("should reject unauthenticated user", async () => {
    const result = await request(app).patch("/products/1").send({
      title: "Updated Product",
    });

    expect(result.status).toBe(401);
  });
  it("should reject non-admin user", async () => {
    const token = await createCustomerAndLogin();

    const result = await request(app)
      .patch("/products/1")
      .send({})
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(403);
  });

  it("should reject the invalid productId", async () => {
    const token = await createAdminAndLogin();

    const result = await request(app)
      .patch(`/products/abc`)
      .send({
        price: 300000,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe("Invalid product Id");
  });
  it("should allow admin to update a product", async () => {
    const token = await createAdminAndLogin();

    const product = await pool.query(
      `INSERT INTO products (title, price, stock, category) VALUES($1, $2, $3, $4) RETURNING *`,
      ["MacBook Pro M4", 249999, 10, "Laptop"],
    );

    const productId = product.rows[0].id;

    const result = await request(app)
      .patch(`/products/${productId}`)
      .send({
        price: 300000,
      })
      .set("Authorization", `Bearer ${token}`);

    // expect 200
    expect(result.status).toBe(200);
    // expect returned product.price to be updated
    expect(Number(result.body.product.price)).toBe(300000);
  });
});

describe("DELETE /products/:id", () => {
  afterEach(async () => {
    await pool.query("delete from users where email=$1", ["test@example.com"]);
    await pool.query("delete from users where email=$1", ["admin@example.com"]);
    await pool.query("delete from products where category=$1", ["Phone"]);
  });
  it("should reject the unauthenticated user", async () => {
    const result = await request(app).delete("/products/1");
    expect(result.status).toBe(401);
  });
  it("should reject the non-admin user", async () => {
    const token = await createCustomerAndLogin();

    const result = await request(app)
      .delete("/products/1")
      .set("Authorization", `Bearer ${token}`);
    expect(result.status).toBe(403);
  });

  it("should reject invalid productId", async () => {
    const token = await createAdminAndLogin();
    const result = await request(app)
      .delete("/products/abc")
      .set("Authorization", `Bearer ${token}`);
    expect(result.status).toBe(404);
    expect(result.body.message).toBe("Invalid Product Id.");
  });

  it("should allow admin to delete the product", async () => {
    const token = await createAdminAndLogin();
    const response = await request(app)
      .post("/products/")
      .send({
        title: "Iphone 13 pro max",
        description: "Iphone 13 pro max 256bg storage",
        price: 120000,
        category: "Phone",
        stock: 12,
      })
      .set("Authorization", `Bearer ${token}`);
    const productId = response.body.product.id;
    const result = await request(app)
      .delete(`/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(result.status).toBe(200);
    expect(result.body.product.deleted_at).toBeDefined();
    expect(result.body.product.deleted_at).not.toBe(null);

    const getResult = await request(app).get(`/products/${productId}`);
    expect(getResult.status).toBe(404);
  });
});
