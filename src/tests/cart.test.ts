import { it, expect, describe, afterEach, should } from "vitest";
import request from "supertest";
import app from "../app.js";
import { pool } from "../db/db.js";
import { createCustomerAndLogin } from "./helpers/auth.heloper.js";
import { afterEachCleanUp, createProductGetId } from "./helpers/cart.helper.js";

describe("POST /cart/items", () => {
  afterEach(async () => {
    await afterEachCleanUp();
  });

  it("should reject the addtion of unavailabe product to the cart", async () => {
    const token = await createCustomerAndLogin();
    const result = await request(app)
      .post("/cart/items")
      .send({
        productId: 200,
        quantity: 10,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe("Product unavailable.");
  });

  it("should reject adding quantity when total cart quantity exceeds available stock", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();

    const result1 = await request(app)
      .post("/cart/items")
      .send({
        productId: productId,
        quantity: 10,
      })
      .set("Authorization", `Bearer ${token}`);

    const result2 = await request(app)
      .post("/cart/items")
      .send({
        productId: productId,
        quantity: 10,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(result1.status).toBe(200);
    expect(result1.body.cartItem.quantity).toBe(10);

    expect(result2.status).toBe(400);
    expect(result2.body.message).toBe(
      "quantity can not be greater than available stock.",
    );
  });

  it("should allow authenticated customer to add product to the cart", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();
    const result = await request(app)
      .post("/cart/items")
      .send({
        productId: productId,
        quantity: 10,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(200);
    expect(result.body.cartItem.product_id).toBe(productId);
    expect(result.body.cartItem.quantity).toBe(10);
  });

  it("should increase the quantity of product already exist in the cart", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();
    const result1 = await request(app)
      .post("/cart/items")
      .send({
        productId: productId,
        quantity: 5,
      })
      .set("Authorization", `Bearer ${token}`);

    const result2 = await request(app)
      .post("/cart/items")
      .send({
        productId: productId,
        quantity: 5,
      })
      .set("Authorization", `Bearer ${token}`);
    expect(result1.status).toBe(200);
    expect(result1.body.cartItem.quantity).toBe(5);

    expect(result2.status).toBe(200);
    expect(result2.body.cartItem.quantity).toBe(10);
  });

  it("should reject quantity less or equal to 0", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();
    const result = await request(app)
      .post("/cart/items")
      .send({
        productId: productId,
        quantity: 0,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe("Validation Error");
  });
});

describe("GET /cart", () => {
  afterEach(async () => {
    await afterEachCleanUp();
  });
  it("should reject unauthenticated user from getting cart", async () => {
    const result = await request(app).get("/cart");

    expect(result.status).toBe(401);
    expect(result.body.message).toBe("Unauthorized");
  });

  it("should return empty cart for authenticated customer with no cart items", async () => {
    const token = await createCustomerAndLogin();

    const result = await request(app)
      .get("/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(200);
    expect(result.body.cart).toEqual({
      id: null,
      items: [],
      total: 0,
    });
  });

  it("should allow authenticated user to get their cart deatils", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();
    await request(app)
      .post("/cart/items")
      .send({
        productId: productId,
        quantity: 2,
      })
      .set("Authorization", `Bearer ${token}`);

    const result = await request(app)
      .get("/cart")
      .set("Authorization", `Bearer ${token}`);
    expect(result.status).toBe(200);
    expect(result.body.cart.items).toHaveLength(1);
    expect(result.body.cart.items[0].productId).toBe(productId);
    expect(result.body.cart.items[0].quantity).toBe(2);
    expect(result.body.cart.total).toBe(500000);
  });
});

describe("PATCH /cart/items/:productId", () => {
  afterEach(async () => {
    await afterEachCleanUp();
  });

  it("should reject unauthenticated user from updating cart item quantity", async () => {
    const productId = await createProductGetId();

    const result = await request(app).patch(`/cart/items/${productId}`).send({
      quantity: 3,
    });

    expect(result.status).toBe(401);
    expect(result.body.message).toBe("Unauthorized");
  });

  it("should allow authenticated customer to update cart item quantity", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();

    await request(app)
      .post("/cart/items")
      .send({
        productId,
        quantity: 5,
      })
      .set("Authorization", `Bearer ${token}`);

    const result = await request(app)
      .patch(`/cart/items/${productId}`)
      .send({
        quantity: 3,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(200);
    expect(result.body.cartItem.product_id).toBe(productId);
    expect(result.body.cartItem.quantity).toBe(3);
  });

  it("should reject updating cart item quantity greater than available stock", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();

    await request(app)
      .post("/cart/items")
      .send({
        productId,
        quantity: 5,
      })
      .set("Authorization", `Bearer ${token}`);

    const result = await request(app)
      .patch(`/cart/items/${productId}`)
      .send({
        quantity: 20,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe(
      "quantity can not be greater than available stock.",
    );
  });

  it("should reject updating cart item quantity to 0", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();

    await request(app)
      .post("/cart/items")
      .send({
        productId,
        quantity: 5,
      })
      .set("Authorization", `Bearer ${token}`);

    const result = await request(app)
      .patch(`/cart/items/${productId}`)
      .send({
        quantity: 0,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe("Validation Error");
  });

  it("should return 404 when updating a product that is not in the cart", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();

    const result = await request(app)
      .patch(`/cart/items/${productId}`)
      .send({
        quantity: 3,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(404);
    expect(result.body.message).toBe("Cart item not found.");
  });
});

describe("DELETE /cart/items/:productId", () => {
  afterEach(async () => {
    await pool.query(
      "delete from cart_items where cart_id=(select id from carts where user_id=(select id from users where email=$1)) and product_id = (select id from products where title = $2)",
      ["test@example.com", "Iphone 13 pro max"],
    );
    await pool.query(
      "delete from carts where user_id= (select id from users where email=$1)",
      ["test@example.com"],
    );
    await pool.query("delete from products where title=$1", [
      "Iphone 13 pro max",
    ]);
    await pool.query("delete from users where email=$1", ["test@example.com"]);
  });

  it("should reject unauthenticated user from deleting cart item", async () => {
    const productId = await createProductGetId();

    const result = await request(app).delete(`/cart/items/${productId}`);

    expect(result.status).toBe(401);
    expect(result.body.message).toBe("Unauthorized");
  });

  it("should allow authenticated customer to remove product from cart", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();

    const addResult = await request(app)
      .post("/cart/items")
      .send({
        productId,
        quantity: 5,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(addResult.status).toBe(200);

    const result = await request(app)
      .delete(`/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe("Cart item removed successfully.");
    expect(result.body.cartItem.product_id).toBe(productId);
  });

  it("should return 404 when deleting a product that is not in the cart", async () => {
    const token = await createCustomerAndLogin();
    const productId = await createProductGetId();

    const result = await request(app)
      .delete(`/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(404);
    expect(result.body.message).toBe("Cart item not found.");
  });
});
