import type { GitHubSyncResponse } from "../api/types";

export type ProfileBlog = { href: string; host: string };

export type ProfileViewModel = {
	login: string;
	displayName: string;
	avatarUrl: string;
	bio: string | null;
	company: string | null;
	location: string | null;
	/** YYYY-MM-DD */
	joinedAt: string;
	blog: ProfileBlog | null;
	isPro: boolean;
	hasVerifiedEmail: boolean;
	stats: { repos: number; followers: number; following: number };
};

/** 空串/纯空白视为缺失。 */
function textOrNull(value: string | null | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

/**
 * 规范化 blog：缺协议时补 https://，仅允许 http/https（防 javascript: 等注入），
 * 解析失败返回 null。
 */
export function normalizeBlogUrl(
	raw: string | null | undefined,
): ProfileBlog | null {
	const trimmed = textOrNull(raw);
	if (!trimmed) return null;
	// 已带协议(scheme:)但非 `host:port` 形式 → 保持原样交给白名单；否则补 https://
	const hasScheme =
		/^[a-z][a-z0-9+.-]*:/i.test(trimmed) &&
		!/^[^/\s:]+:\d+(\/|$)/.test(trimmed);
	const candidate = hasScheme
		? trimmed
		: `https://${trimmed.replace(/^\/\//, "")}`;
	try {
		const url = new URL(candidate);
		if (url.protocol !== "http:" && url.protocol !== "https:") return null;
		if (!url.host) return null;
		return { href: url.href, host: url.host };
	} catch {
		return null;
	}
}

function toDateString(iso: string): string {
	const match = /^\d{4}-\d{2}-\d{2}/.exec(iso);
	return match ? match[0] : "";
}

export function toProfileViewModel(s: GitHubSyncResponse): ProfileViewModel {
	const { user } = s;
	return {
		login: user.login,
		displayName: textOrNull(user.name) ?? user.login,
		avatarUrl: user.avatar_url,
		bio: textOrNull(user.bio),
		company: textOrNull(user.company),
		location: textOrNull(user.location),
		joinedAt: toDateString(user.created_at),
		blog: normalizeBlogUrl(user.blog),
		// plan 仅在 Token 有权限时返回，缺失视为非 PRO
		isPro: user.plan?.name?.toLowerCase() === "pro",
		// 必须 primary && verified:次要邮箱已验证不算
		hasVerifiedEmail: (s.emails ?? []).some((e) => e.primary && e.verified),
		stats: {
			repos: user.public_repos ?? 0,
			followers: user.followers ?? 0,
			following: user.following ?? 0,
		},
	};
}
