import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { ENV } from "./env.server";
import { github } from "./routes/github";

/** Hono 应用实例；`serve()` 留在 index.ts，测试直接用 `app.request()`。 */
export const app = new Hono();

app.use(logger());
// cors 必须先于 github 子路由注册，OPTIONS 预检才不会被 requireToken 拦截。
app.use(
	"/*",
	cors({
		origin: ENV.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Authorization", "Content-Type"],
	}),
);

app.route("/", github);

app.get("/", (c) => {
	return c.text("OK");
});
