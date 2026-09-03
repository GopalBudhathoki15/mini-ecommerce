import { Router } from "express";
import {
  validateLoginUser,
  validateRegisterUser,
} from "../middlewares/validate.user.js";
import { loginUser, registerUser } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

router.post("/register", validateRegisterUser, registerUser);
router.post("/login", validateLoginUser, loginUser);
router.get("/protected", authenticate, (req, res) => {
  return res.status(200).json({ message: "Protected route", user: req.user });
});

export default router;
