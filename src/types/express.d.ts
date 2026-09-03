import type { AuthPayLoad } from "./auth.types.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayLoad;
    }
  }
}
