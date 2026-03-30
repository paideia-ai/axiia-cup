import type { MiddlewareHandler } from "hono";

export const requireAdmin: MiddlewareHandler = async (context, next) => {
  if (context.get("isAdmin") !== true) {
    return context.json({ error: "Admin access required" }, 403);
  }

  await next();
};
