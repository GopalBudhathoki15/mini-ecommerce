import express from "express";
import authRouter from "./routes/auth.router.js";
import productRouter from "./routes/product.router.js";
import { errorHandle } from "./middlewares/error.middleware.js";
const app = express();

app.use(express.json());

app.use("/auth", authRouter);
app.use("/products", productRouter);

app.use(errorHandle);

export default app;
