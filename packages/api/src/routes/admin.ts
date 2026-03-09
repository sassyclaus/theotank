import { Hono } from "hono";
import adminTeams from "./admin/teams";
import adminTheologians from "./admin/theologians";
import adminUsers from "./admin/users";
import adminJobs from "./admin/jobs";
import adminInference from "./admin/inference";
import adminContent from "./admin/content";
import adminCollections from "./admin/collections";
import adminWaitlist from "./admin/waitlist";
import type { AppEnv } from "../lib/types";

const admin = new Hono<AppEnv>();

admin.get("/verify", (c) => c.json({ ok: true }));
admin.route("/teams", adminTeams);
admin.route("/theologians", adminTheologians);
admin.route("/users", adminUsers);
admin.route("/jobs", adminJobs);
admin.route("/inference", adminInference);
admin.route("/content", adminContent);
admin.route("/collections", adminCollections);
admin.route("/waitlist", adminWaitlist);

export default admin;
