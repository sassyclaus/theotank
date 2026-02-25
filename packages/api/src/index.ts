import { Hono } from "hono";
import { cors } from "hono/cors";
import { clerkAuth } from "./middleware/auth";
import { adminAuth } from "./middleware/admin-auth";
import theologians from "./routes/theologians";
import teams from "./routes/teams";
import results from "./routes/results";
import reviewFilesRoute from "./routes/review-files";
import admin from "./routes/admin";

const app = new Hono();

// CORS — allow Vite dev server
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// Health check (unauthenticated)
app.get("/health", (c) => c.json({ ok: true }));

// Authenticated API routes
app.use("/api/*", clerkAuth);
app.use("/api/admin/*", adminAuth);
app.route("/api/admin", admin);
app.route("/api/theologians", theologians);
app.route("/api/teams", teams);
app.route("/api/results", results);
app.route("/api/review-files", reviewFilesRoute);

const port = Number(process.env.PORT) || 3001;
console.log(`API server listening on :${port}`);

export default {
  port,
  fetch: app.fetch,
};
