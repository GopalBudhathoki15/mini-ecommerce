import type { Request, Response, NextFunction } from "express";
import { pool } from "../db/db.js";
import type { CartItem } from "../types/cart.types.js";
import type { Product } from "../types/product.types.js";

export const addToCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, quantity }: CartItem = req.body;
    const productsResponse = await pool.query(
      "select * from products where id=$1 and deleted_at is null",
      [productId],
    );

    if (!productsResponse.rows[0]) {
      return res.status(400).json({ message: "Product unavailable." });
    }

    const cartsResponse = await pool.query(
      "select * from carts where user_id =$1",
      [req.user?.userId],
    );
    let cartId;
    if (!cartsResponse.rows[0]) {
      const cart = await pool.query(
        "insert into carts (user_id) values($1) returning id",
        [req.user?.userId],
      );
      cartId = cart.rows[0].id;
    } else {
      cartId = cartsResponse.rows[0].id;
    }
    const cartItemsResponse = await pool.query(
      "select * from cart_items where cart_id=$1 and product_id=$2",
      [cartId, productId],
    );
    let cartItem;
    const product: Product = productsResponse.rows[0];
    if (!cartItemsResponse.rows[0]) {
      if (product.stock < quantity) {
        return res.status(400).json({
          message: "quantity can not be greater than available stock.",
        });
      }
      const response = await pool.query(
        "insert into cart_items (cart_id, product_id,quantity) values($1, $2, $3) returning *",
        [cartId, productId, quantity],
      );
      cartItem = response.rows[0];
    } else {
      const existingQuantity = cartItemsResponse.rows[0].quantity;
      if (product.stock < quantity + existingQuantity) {
        return res.status(400).json({
          message: "quantity can not be greater than available stock.",
        });
      }
      const response = await pool.query(
        "update cart_items set quantity=$1 where cart_id=$2 and product_id=$3 returning *",
        [existingQuantity + quantity, cartId, productId],
      );
      cartItem = response.rows[0];
    }

    return res.status(200).json({ cartItem: cartItem });
  } catch (error) {
    next(error);
  }
};

export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cartsResponse = await pool.query(
      "select * from carts where user_id=$1",
      [req.user?.userId],
    );
    if (!cartsResponse.rows[0]) {
      return res.status(200).json({
        cart: {
          id: null,
          items: [],
          total: 0,
        },
      });
    }

    const cartId = cartsResponse.rows[0].id;

    const cartItemsResponse = await pool.query(
      'select products.id as "productId" , products.title, products.price, cart_items.quantity from cart_items join products on cart_items.product_id=products.id where cart_id=$1',
      [cartId],
    );

    if (!cartItemsResponse.rows[0]) {
      return res
        .status(200)
        .json({ cart: { id: null, items: cartItemsResponse.rows, total: 0 } });
    }

    const cartItems = cartItemsResponse.rows;

    const total = cartItems.reduce((total, item) => {
      return total + Number(item.price) * item.quantity;
    }, 0);

    return res
      .status(200)
      .json({ cart: { id: cartId, items: cartItems, total } });
  } catch (error) {
    next(error);
  }
};

export const updateCartItemQuantity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productId = Number(req.params.productId);
    const { quantity } = req.body;

    const productResponse = await pool.query(
      `select id, stock
       from products
       where id = $1 and deleted_at is null`,
      [productId],
    );

    if (!productResponse.rows[0]) {
      return res.status(400).json({
        message: "Product unavailable.",
      });
    }

    const product = productResponse.rows[0];

    if (quantity > product.stock) {
      return res.status(400).json({
        message: "quantity can not be greater than available stock.",
      });
    }

    const cartResponse = await pool.query(
      `select id
       from carts
       where user_id = $1`,
      [req.user?.userId],
    );

    if (!cartResponse.rows[0]) {
      return res.status(404).json({
        message: "Cart item not found.",
      });
    }

    const cartId = cartResponse.rows[0].id;

    const response = await pool.query(
      `update cart_items
       set quantity = $1
       where cart_id = $2 and product_id = $3
       returning *`,
      [quantity, cartId, productId],
    );

    if (!response.rows[0]) {
      return res.status(404).json({
        message: "Cart item not found.",
      });
    }

    return res.status(200).json({
      cartItem: response.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        message: "Invalid product id.",
      });
    }

    const cartResponse = await pool.query(
      "select id from carts where user_id=$1",
      [req.user?.userId],
    );

    if (!cartResponse.rows[0]) {
      return res.status(404).json({
        message: "Cart item not found.",
      });
    }

    const cartId = cartResponse.rows[0].id;

    const result = await pool.query(
      `delete from cart_items
       where cart_id=$1 and product_id=$2
       returning *`,
      [cartId, productId],
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: "Cart item not found.",
      });
    }

    return res.status(200).json({
      message: "Cart item removed successfully.",
      cartItem: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
