import { z } from "zod";

/** GitHub `GET /user`：校验关键字段，`passthrough` 保留其余原始字段供前端展示原始 JSON。 */
export const GitHubUserSchema = z
	.object({
		login: z.string(),
		id: z.number(),
		avatar_url: z.string().url(),
		name: z.string().nullable(),
		company: z.string().nullable(),
		blog: z.string().nullable(),
		location: z.string().nullable(),
		email: z.string().nullable(),
		bio: z.string().nullable(),
		twitter_username: z.string().nullable(),
		public_repos: z.number(),
		followers: z.number(),
		following: z.number(),
		created_at: z.string(),
		plan: z.object({ name: z.string() }).optional(),
	})
	.passthrough();

/** GitHub `GET /user/emails` 的单条记录。 */
export const GitHubEmailSchema = z.object({
	email: z.string(),
	primary: z.boolean(),
	verified: z.boolean(),
	visibility: z.string().nullable(),
});

export const GitHubEmailsSchema = z.array(GitHubEmailSchema);

/** 单个资源的限流额度；`reset` 为秒级时间戳。 */
export const RateLimitSchema = z.object({
	limit: z.number(),
	remaining: z.number(),
	used: z.number(),
	reset: z.number(),
});

/** GitHub `GET /rate_limit`，仅校验 core 资源。 */
export const GitHubRateLimitSchema = z
	.object({
		resources: z.object({ core: RateLimitSchema.passthrough() }).passthrough(),
	})
	.passthrough();

/** 统一错误码，新增需同步更新 design.md 接口契约。 */
export const ERROR_CODES = [
	"TOKEN_MISSING",
	"TOKEN_INVALID",
	"SCOPE_MISSING",
	"RATE_LIMITED",
	"UPSTREAM_UNAVAILABLE",
	"INTERNAL_ERROR",
] as const;

export const ErrorCodeSchema = z.enum(ERROR_CODES);
