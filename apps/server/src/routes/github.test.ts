import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiErrorBody, GitHubSyncResponse } from "../github/types";

vi.mock("../env.server", () => ({
	ENV: { CORS_ORIGIN: "http://localhost:5173" },
}));

const { app } = await import("../app");

const TOKEN = `ghp_${"a".repeat(36)}`;
const ORIGIN = "http://localhost:5173";

const user = {
	login: "octocat",
	id: 1,
	avatar_url: "https://avatars.githubusercontent.com/u/1",
	name: "The Octocat",
	company: null,
	blog: null,
	location: null,
	email: null,
	bio: null,
	twitter_username: null,
	public_repos: 8,
	followers: 100,
	following: 0,
	created_at: "2011-01-25T18:44:36Z",
};
const emails = [
	{
		email: "octocat@github.com",
		primary: true,
		verified: true,
		visibility: "public",
	},
];
const core = { limit: 5000, remaining: 4999, used: 1, reset: 1_900_000_000 };

type Route = (
	path: string,
) => Response | undefined | Promise<Response | undefined>;

function json(body: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(body), {
		...init,
		headers: { "content-type": "application/json", ...init.headers },
	});
}

/** 默认全部成功；`override` 可按路径替换某个上游响应。 */
function mockGitHub(override?: Route) {
	const fetchMock = vi.fn(async (input: string | URL | Request) => {
		const path = new URL(String(input)).pathname;
		const custom = override ? await override(path) : undefined;
		if (custom) return custom;
		if (path === "/user") {
			return json(user, {
				headers: { "x-oauth-scopes": "read:user, user:email" },
			});
		}
		if (path === "/user/emails") return json(emails);
		if (path === "/rate_limit") return json({ resources: { core } });
		return json({ message: "Not Found" }, { status: 404 });
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

function get(path: string, headers: Record<string, string> = {}) {
	return app.request(path, {
		headers: { Authorization: `Bearer ${TOKEN}`, ...headers },
	});
}

beforeEach(() => {
	vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("GET /api/github/*", () => {
	it("成功：/sync 聚合 user/emails/rateLimit/scopes，并以 Bearer 调用 GitHub", async () => {
		const fetchMock = mockGitHub();

		const res = await get("/api/github/sync");

		expect(res.status).toBe(200);
		const body = (await res.json()) as GitHubSyncResponse;
		expect(body.user.login).toBe("octocat");
		expect(body.emails).toEqual(emails);
		expect(body.rateLimit).toEqual(core);
		expect(body.scopes).toEqual(["read:user", "user:email"]);
		expect(Number.isNaN(Date.parse(body.fetchedAt))).toBe(false);

		expect(fetchMock).toHaveBeenCalledTimes(3);
		const [, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(new Headers(init.headers).get("Authorization")).toBe(
			`Bearer ${TOKEN}`,
		);

		const rate = await get("/api/github/rate-limit");
		expect(rate.status).toBe(200);
		expect(await rate.json()).toEqual(core);
	});

	it("401：上游 401 映射为 401 TOKEN_INVALID，且不回显 token", async () => {
		mockGitHub(() => json({ message: "Bad credentials" }, { status: 401 }));

		const res = await get("/api/github/sync");

		expect(res.status).toBe(401);
		const text = await res.text();
		expect(text).not.toContain(TOKEN);
		expect((JSON.parse(text) as ApiErrorBody).error.code).toBe("TOKEN_INVALID");
	});

	it("限流：403 + x-ratelimit-remaining: 0 映射为 429 RATE_LIMITED 并带 retryAfter", async () => {
		mockGitHub(() =>
			json(
				{ message: "API rate limit exceeded" },
				{
					status: 403,
					headers: {
						"x-ratelimit-remaining": "0",
						"x-ratelimit-reset": "1900000000",
					},
				},
			),
		);

		const res = await get("/api/github/rate-limit");

		expect(res.status).toBe(429);
		const body = (await res.json()) as ApiErrorBody;
		expect(body.error.code).toBe("RATE_LIMITED");
		expect(body.error.retryAfter).toBe(1_900_000_000);
	});

	it.each([403, 404])(
		"缺 scope：/user/emails 返回 %i 映射为 403 SCOPE_MISSING",
		async (status) => {
			mockGitHub((path) =>
				path === "/user/emails"
					? json({ message: "Resource not accessible" }, { status })
					: undefined,
			);

			const res = await get("/api/github/sync");

			expect(res.status).toBe(403);
			const body = (await res.json()) as ApiErrorBody;
			expect(body.error.code).toBe("SCOPE_MISSING");
			expect(body.error.message).toContain("user:email");
		},
	);

	it("超时：fetch 因 AbortSignal 超时中止时返回 502 UPSTREAM_UNAVAILABLE", async () => {
		const fetchMock = vi.fn(
			(_input: string | URL | Request, init?: RequestInit) => {
				expect(init?.signal).toBeInstanceOf(AbortSignal);
				return Promise.reject(
					new DOMException("The operation timed out.", "TimeoutError"),
				);
			},
		);
		vi.stubGlobal("fetch", fetchMock);

		const res = await get("/api/github/rate-limit");

		expect(res.status).toBe(502);
		const body = (await res.json()) as ApiErrorBody;
		expect(body.error.code).toBe("UPSTREAM_UNAVAILABLE");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it.each([
		["缺少 Authorization 头", {}],
		["非 Bearer 格式", { Authorization: `token ${TOKEN}` }],
		["token 格式非法", { Authorization: "Bearer bad-token!" }],
	])(
		"缺失 token（%s）：返回 400 TOKEN_MISSING 且不请求 GitHub",
		async (_, headers) => {
			const fetchMock = mockGitHub();

			const res = await app.request("/api/github/sync", { headers });

			expect(res.status).toBe(400);
			const body = (await res.json()) as ApiErrorBody;
			expect(body.error.code).toBe("TOKEN_MISSING");
			expect(fetchMock).not.toHaveBeenCalled();
		},
	);

	it("CORS 预检：OPTIONS 不带 Authorization 也返回 204 并放行 Authorization 头", async () => {
		const fetchMock = mockGitHub();

		const res = await app.request("/api/github/sync", {
			method: "OPTIONS",
			headers: {
				Origin: ORIGIN,
				"Access-Control-Request-Method": "GET",
				"Access-Control-Request-Headers": "authorization",
			},
		});

		expect(res.status).toBe(204);
		expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
		expect(res.headers.get("access-control-allow-headers")).toContain(
			"Authorization",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
