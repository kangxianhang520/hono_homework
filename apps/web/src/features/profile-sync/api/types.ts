/** 与 apps/server/src/github/{schemas,types}.ts 同构的响应类型（手写，未引入服务端依赖）。 */

export const ERROR_CODES = [
	"TOKEN_MISSING",
	"TOKEN_INVALID",
	"SCOPE_MISSING",
	"RATE_LIMITED",
	"UPSTREAM_UNAVAILABLE",
	"INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** GitHub `GET /user`，其余原始字段保留在索引签名中。 */
export type GitHubUser = {
	login: string;
	id: number;
	avatar_url: string;
	name: string | null;
	company: string | null;
	blog: string | null;
	location: string | null;
	email: string | null;
	bio: string | null;
	twitter_username: string | null;
	public_repos: number;
	followers: number;
	following: number;
	created_at: string;
	plan?: { name: string };
	[key: string]: unknown;
};

export type GitHubEmail = {
	email: string;
	primary: boolean;
	verified: boolean;
	visibility: string | null;
};

/** `reset` 为秒级时间戳。 */
export type RateLimit = {
	limit: number;
	remaining: number;
	used: number;
	reset: number;
};

/** `GET /api/github/sync` 响应。 */
export type GitHubSyncResponse = {
	user: GitHubUser;
	emails: GitHubEmail[];
	rateLimit: RateLimit;
	scopes: string[];
	/** ISO 8601 */
	fetchedAt: string;
};

/** 统一错误响应体。`retryAfter` 为秒级时间戳。 */
export type ApiErrorBody = {
	error: {
		code: ErrorCode;
		message: string;
		retryAfter?: number;
	};
};
