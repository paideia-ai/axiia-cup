import type { MiddlewareHandler } from "hono";

import { verifyToken } from "../lib/auth";

declare module "hono" {
  interface ContextVariableMap {
    isAdmin: boolean;
    userId: number;
  }
}

export const requireAuth: MiddlewareHandler = async (context, next) => {
  const authorization = context.req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return context.json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = authorization.slice("Bearer ".length).trim();
  const payload = await verifyToken(token);

  if (!payload) {
    return context.json({ error: "Invalid or expired token" }, 401);
  }

  context.set("userId", payload.userId);
  context.set("isAdmin", payload.isAdmin);

  await next();
};
