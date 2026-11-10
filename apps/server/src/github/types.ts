import type { z } from "zod";
import type {
	ERROR_CODES,
	GitHubEmailSchema,
	GitHubRateLimitSchema,
	GitHubUserSchema,
	RateLimitSchema,
} from "./schemas";

export type GitHubUser = z.infer<typeof GitHubUserSchema>;
export type GitHubEmail = z.infer<typeof GitHubEmailSchema>;
export type GitHubRateLimitResponse = z.infer<typeof GitHubRateLimitSchema>;
export type RateLimit = z.infer<typeof RateLimitSchema>;
export type ErrorCode = (typeof ERROR_CODES)[number];

/** `GET /api/github/sync` 响应。 */
export interface GitHubSyncResponse {
	user: GitHubUser;
	emails: GitHubEmail[];
	rateLimit: RateLimit;
	scopes: string[];
	/** ISO 8601 */
	fetchedAt: string;
}

/** 统一错误响应体。`retryAfter` 为秒级时间戳（x-ratelimit-reset）。 */
export interface ApiErrorBody {
	error: {
		code: ErrorCode;
		message: string;
		retryAfter?: number;
	};
}

/** 领域错误：在路由/客户端中直接 throw，由 `app.onError` 映射为 HTTP 响应。 */
export class GitHubError extends Error {
	readonly status: 400 | 401 | 403 | 429 | 500 | 502;
	readonly code: ErrorCode;
	readonly retryAfter?: number;

	constructor(
		status: GitHubError["status"],
		code: ErrorCode,
		message: string,
		retryAfter?: number,
	) {
		super(message);
		this.name = "GitHubError";
		this.status = status;
		this.code = code;
		this.retryAfter = retryAfter;
	}

	toBody(): ApiErrorBody {
		return {
			error: {
				code: this.code,
				message: this.message,
				...(this.retryAfter !== undefined && { retryAfter: this.retryAfter }),
			},
		};
	}
}
