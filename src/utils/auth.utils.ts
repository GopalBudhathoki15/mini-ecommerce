import type { AuthPayLoad } from "../types/auth.types.js";

export function isAuthPayLoad(payLoad: unknown): payLoad is AuthPayLoad {
  return (
    typeof payLoad === "object" &&
    payLoad !== null &&
    "userId" in payLoad &&
    "role" in payLoad &&
    typeof payLoad.userId === "number" &&
    (payLoad.role === "customer" || payLoad.role === "admin")
  );
}
