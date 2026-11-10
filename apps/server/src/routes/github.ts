import type { ErrorHandler, MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { githubFetch } from "../github/client";
import {
	GitHubEmailsSchema,
	GitHubRateLimitSchema,
	GitHubUserSchema,
} from "../github/schemas";
import type { ApiErrorBody, GitHubSyncResponse } from "../github/types";
import { GitHubError } from "../github/types";

export type GitHubEnv = {
	Variables: {
		token: string;
	};
};

/** GitHub PAT 允许的字符集与长度（classic ghp_ / fine-grained github_pat_）。 */
const TOKEN_PATTERN = /^[A-Za-z0-9_]{20,255}$/;
const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

/**
 * 解析 `Authorization: Bearer <token>` 并校验格式，通过后写入 `c.set("token")`。
 * 缺失或格式非法统一抛 400 TOKEN_MISSING，且不回显 token。
 */
export const requireToken: MiddlewareHandler<GitHubEnv> = async (c, next) => {
	const header = c.req.header("Authorization");
	const token = header ? BEARER_PATTERN.exec(header.trim())?.[1] : undefined;
	if (!token || !TOKEN_PATTERN.test(token)) {
		throw new GitHubError(
			400,
			"TOKEN_MISSING",
			"Missing or malformed Authorization header, expected 'Bearer <token>'",
		);
	}
	c.set("token", token);
	await next();
};

/** 统一错误响应：GitHubError 映射为对应状态码，其他一律 500，不泄露堆栈或凭证。 */
export const onError: ErrorHandler = (err, c) => {
	if (err instanceof GitHubError) {
		return c.json(err.toBody(), err.status);
	}
	console.error(`[github] unhandled error: ${err.name}`);
	const body: ApiErrorBody = {
		error: { code: "INTERNAL_ERROR", message: "Internal server error" },
	};
	return c.json(body, 500);
};

export const github = new Hono<GitHubEnv>().basePath("/api/github");

github.use("*", requireToken);
github.onError(onError);

/** 并行拉取 user / emails / rate_limit 并聚合；任一失败整体按对应错误码返回（emails 403/404 → SCOPE_MISSING）。 */
github.get("/sync", async (c) => {
	const token = c.get("token");
	const [user, emails, rate] = await Promise.all([
		githubFetch("/user", token, GitHubUserSchema),
		githubFetch("/user/emails", token, GitHubEmailsSchema),
		githubFetch("/rate_limit", token, GitHubRateLimitSchema),
	]);
	const body: GitHubSyncResponse = {
		user: user.data,
		emails: emails.data,
		rateLimit: rate.data.resources.core,
		scopes: user.scopes,
		fetchedAt: new Date().toISOString(),
	};
	return c.json(body);
});

/** 仅返回 core 资源的限流信息；`reset` 为秒级时间戳。 */
github.get("/rate-limit", async (c) => {
	const rate = await githubFetch(
		"/rate_limit",
		c.get("token"),
		GitHubRateLimitSchema,
	);
	return c.json(rate.data.resources.core);
});
