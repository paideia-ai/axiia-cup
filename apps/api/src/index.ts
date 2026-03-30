import { app } from "./app";
import { cors } from "hono/cors";

import { authRouter } from "./routes/auth";
import { appMetaSchema, modelOptions, scenarios } from "@axiia/shared";

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/", (context) =>
  context.json({
    name: "Axiia Cup API",
    status: "ok",
  }),
);

app.get("/health", (context) =>
  context.json({
    ok: true,
    timestamp: new Date().toISOString(),
  }),
);

app.get("/api/meta", (context) => {
  const payload = appMetaSchema.parse({
    name: "Axiia Cup",
    stage: "mvp",
    models: modelOptions,
    scenarios,
  });

  return context.json(payload);
});

app.get("/api/scenarios", (context) => context.json({ items: scenarios }));
app.get("/api/models", (context) => context.json({ items: modelOptions }));
app.route("/", authRouter);

const port = Number(process.env.PORT ?? 3001);

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`[api] listening on http://localhost:${port}`);
