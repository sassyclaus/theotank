import { Hono } from "hono";
import adminTeams from "./admin/teams";
import adminTheologians from "./admin/theologians";
import type { AppEnv } from "../lib/types";

const admin = new Hono<AppEnv>();

admin.get("/verify", (c) => c.json({ ok: true }));
admin.route("/teams", adminTeams);
admin.route("/theologians", adminTheologians);

export default admin;
