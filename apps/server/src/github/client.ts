import type { z } from "zod";
import { GitHubError } from "./types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const REQUEST_TIMEOUT_MS = 10_000;

/** 代理路径白名单，避免任意路径透传（SSRF/越权）。 */
const ALLOWED_PATHS = new Set(["/user", "/user/emails", "/rate_limit"]);

/** `/user/emails` 需要 `user:email` scope。 */
const REQUIRED_SCOPE: Record<string, string> = {
	"/user/emails": "user:email",
};

export interface GitHubFetchResult<T> {
	data: T;
	/** 解析自 `x-oauth-scopes`，fine-grained PAT 无该头时为空数组。 */
	scopes: string[];
}

function parseScopes(header: string | null): string[] {
	if (!header) return [];
	return header
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

function parseResetSeconds(header: string | null): number | undefined {
	if (header === null) return undefined;
	const n = Number(header);
	return Number.isFinite(n) ? n : undefined;
}

/** 将非 2xx 响应映射为 GitHubError；不包含上游 body 与 token。 */
export function toGitHubError(res: Response, path: string): GitHubError {
	const { status } = res;
	if (status === 401) {
		return new GitHubError(401, "TOKEN_INVALID", "GitHub Token 无效或已过期");
	}
	if (
		(status === 403 || status === 429) &&
		res.headers.get("x-ratelimit-remaining") === "0"
	) {
		return new GitHubError(
			429,
			"RATE_LIMITED",
			"GitHub API 请求次数已达上限",
			parseResetSeconds(res.headers.get("x-ratelimit-reset")),
		);
	}
	if (status === 429) {
		return new GitHubError(429, "RATE_LIMITED", "GitHub API 请求过于频繁");
	}
	if (status === 403 || (status === 404 && path === "/user/emails")) {
		const scope = REQUIRED_SCOPE[path];
		return new GitHubError(
			403,
			"SCOPE_MISSING",
			scope ? `Token 缺少所需权限: ${scope}` : "Token 权限不足",
		);
	}
	return new GitHubError(
		502,
		"UPSTREAM_UNAVAILABLE",
		`GitHub 服务返回异常状态 ${status}`,
	);
}

/**
 * 请求 GitHub API 并用 zod 校验响应。
 * token 仅用于本次请求头，不会写入日志或错误信息。
 */
export async function githubFetch<S extends z.ZodTypeAny>(
	path: string,
	token: string,
	schema: S,
): Promise<GitHubFetchResult<z.infer<S>>> {
	if (!ALLOWED_PATHS.has(path)) {
		throw new GitHubError(500, "INTERNAL_ERROR", "不允许的 GitHub API 路径");
	}

	let res: Response;
	try {
		res = await fetch(`${GITHUB_API_BASE}${path}`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
				"X-GitHub-Api-Version": GITHUB_API_VERSION,
				"User-Agent": "my-better-t-app",
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
	} catch {
		throw new GitHubError(
			502,
			"UPSTREAM_UNAVAILABLE",
			"无法连接 GitHub 或请求超时",
		);
	}

	if (!res.ok) {
		throw toGitHubError(res, path);
	}

	let json: unknown;
	try {
		json = await res.json();
	} catch {
		throw new GitHubError(
			502,
			"UPSTREAM_UNAVAILABLE",
			"GitHub 响应不是有效 JSON",
		);
	}

	const parsed = schema.safeParse(json);
	if (!parsed.success) {
		throw new GitHubError(
			502,
			"UPSTREAM_UNAVAILABLE",
			"GitHub 响应格式不符合预期",
		);
	}

	return {
		data: parsed.data,
		scopes: parseScopes(res.headers.get("x-oauth-scopes")),
	};
}
