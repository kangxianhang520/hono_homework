import { ENV } from "@/env";
import {
	type ApiErrorBody,
	ERROR_CODES,
	type ErrorCode,
	type GitHubSyncResponse,
	type RateLimit,
} from "./types";

/** 前端统一错误：服务端错误体或网络失败均归一为该类型。 */
export class ApiError extends Error {
	readonly code: ErrorCode;
	/** 秒级时间戳（仅 RATE_LIMITED） */
	readonly retryAfter?: number;

	constructor(code: ErrorCode, message: string, retryAfter?: number) {
		super(message);
		this.name = "ApiError";
		this.code = code;
		this.retryAfter = retryAfter;
	}
}

const isErrorCode = (value: unknown): value is ErrorCode =>
	typeof value === "string" &&
	(ERROR_CODES as readonly string[]).includes(value);

/** 从非 2xx 响应解析 `{ error }`；体不合法时按状态码兜底。 */
async function parseError(res: Response): Promise<ApiError> {
	let body: Partial<ApiErrorBody> | null = null;
	try {
		body = (await res.json()) as Partial<ApiErrorBody>;
	} catch (e) {
		if (isAbortError(e)) throw e;
		body = null;
	}
	const err = body?.error;
	if (err && isErrorCode(err.code)) {
		return new ApiError(
			err.code,
			typeof err.message === "string" ? err.message : res.statusText,
			typeof err.retryAfter === "number" ? err.retryAfter : undefined,
		);
	}
	return new ApiError(
		res.status >= 500 ? "UPSTREAM_UNAVAILABLE" : "INTERNAL_ERROR",
		res.statusText || "Request failed",
	);
}

const isAbortError = (e: unknown) =>
	e instanceof DOMException && e.name === "AbortError";

/** PAT 仅放在 Authorization 头，不进 URL。 */
async function request<T>(
	path: string,
	token: string,
	signal?: AbortSignal,
): Promise<T> {
	let res: Response;
	try {
		res = await fetch(`${ENV.VITE_SERVER_URL}${path}`, {
			headers: { Authorization: `Bearer ${token}` },
			signal,
		});
	} catch (e) {
		if (isAbortError(e)) throw e;
		throw new ApiError("UPSTREAM_UNAVAILABLE", "Network request failed");
	}
	if (!res.ok) throw await parseError(res);
	try {
		return (await res.json()) as T;
	} catch (e) {
		if (isAbortError(e)) throw e;
		throw new ApiError("UPSTREAM_UNAVAILABLE", "Invalid response body");
	}
}

export function fetchGitHubSync(
	token: string,
	signal?: AbortSignal,
): Promise<GitHubSyncResponse> {
	return request<GitHubSyncResponse>("/api/github/sync", token, signal);
}

export function fetchRateLimit(
	token: string,
	signal?: AbortSignal,
): Promise<RateLimit> {
	return request<RateLimit>("/api/github/rate-limit", token, signal);
}
