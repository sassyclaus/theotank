import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "./lib/logger";
import { requestLogger } from "./middleware/request-logger";
import { clerkAuth } from "./middleware/auth";
import { adminAuth } from "./middleware/admin-auth";
import theologians from "./routes/theologians";
import teams from "./routes/teams";
import results from "./routes/results";
import usage from "./routes/usage";
import reviewFilesRoute from "./routes/review-files";
import admin from "./routes/admin";
import publicRoutes from "./routes/public";
import waitlistRoutes from "./routes/public/waitlist";
import type { AppEnv } from "./lib/types";

const app = new Hono<AppEnv>();

// Structured request/response logging
app.use("*", requestLogger);

// CORS — configurable origins for production; defaults to Vite dev server
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:4321"];

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// Global error handler
app.onError((err, c) => {
  const log = c.get("log") || logger;
  log.error({ err, method: c.req.method, path: c.req.path }, "Unhandled error");
  return c.json({ error: "Internal server error" }, 500);
});

// Health check (unauthenticated)
app.get("/health", (c) => c.json({ ok: true }));

// Public routes (unauthenticated)
app.route("/public", publicRoutes);
app.route("/public/waitlist", waitlistRoutes);

// Authenticated API routes
app.use("/api/*", clerkAuth);
app.use("/api/admin/*", adminAuth);
app.route("/api/admin", admin);
app.route("/api/theologians", theologians);
app.route("/api/teams", teams);
app.route("/api/results", results);
app.route("/api/usage", usage);
app.route("/api/review-files", reviewFilesRoute);

const port = Number(process.env.PORT) || 3001;
logger.info({ port }, "API server listening");

export default {
  port,
  fetch: app.fetch,
};
