import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import {
  addToCart,
  deleteCartItem,
  getCart,
  updateCartItemQuantity,
} from "../controllers/cart.controller.js";
import {
  validateAddToCartItem,
  validateUpdateCartItem,
} from "../middlewares/validate.cartItem.js";

const router = Router();

router.post("/items", authenticate, validateAddToCartItem, addToCart);
router.get("/", authenticate, getCart);
router.patch(
  "/items/:productId",
  authenticate,
  validateUpdateCartItem,
  updateCartItemQuantity,
);
router.delete("/items/:productId", authenticate, deleteCartItem);
export default router;
