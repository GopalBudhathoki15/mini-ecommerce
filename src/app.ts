import express from "express";
import authRouter from "./routes/auth.router.js";
import { errorHandle } from "./middlewares/error.middleware.js";
const app = express();

app.use(express.json());

app.use("/auth", authRouter);

app.use(errorHandle);

export default app;
