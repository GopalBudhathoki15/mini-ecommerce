import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorizeAdmin } from "../middlewares/authorization.js";
import {
  validateCreateProduct,
  validateUpdateProduct,
} from "../middlewares/validate.product.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  validateCreateProduct,
  createProduct,
  deleteProduct,
);
router.patch(
  "/:id",
  authenticate,
  authorizeAdmin,
  validateUpdateProduct,
  updateProduct,
);

router.delete("/:id", authenticate, authorizeAdmin, deleteProduct);

export default router;
