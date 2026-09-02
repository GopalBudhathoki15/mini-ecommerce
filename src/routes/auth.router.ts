import { Router } from "express";
import {
  validateLoginUser,
  validateRegisterUser,
} from "../middlewares/validate.user.js";
import { loginUser, registerUser } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", validateRegisterUser, registerUser);
router.post("/login", validateLoginUser, loginUser);

export default router;
