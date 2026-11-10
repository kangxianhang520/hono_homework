import { Button } from "@/components/ui/button";
import { TriangleAlert } from "@/components/ui/design-icons";

import type { ApiError } from "../api/github";
import type { ErrorCode } from "../api/types";

type ErrorAction = "retry" | "guide" | null;

const ERROR_COPY: Record<
	ErrorCode,
	{ title: string; description: string; action: ErrorAction }
> = {
	TOKEN_MISSING: {
		title: "尚未填写 Token",
		description: "请先输入 GitHub Personal Access Token 再进行同步。",
		action: null,
	},
	TOKEN_INVALID: {
		title: "Token 无效或已过期",
		description: "GitHub 拒绝了该令牌，请检查是否复制完整，或重新生成。",
		action: "guide",
	},
	SCOPE_MISSING: {
		title: "Token 权限不足",
		description: "该令牌缺少 read:user 或 user:email 权限，请补全后重试。",
		action: "guide",
	},
	RATE_LIMITED: {
		title: "已触发 GitHub API 限流",
		description: "请求次数已用尽，请等待限额重置后再试。",
		action: null,
	},
	UPSTREAM_UNAVAILABLE: {
		title: "无法连接 GitHub",
		description: "GitHub API 暂时不可用或请求超时，请稍后重试。",
		action: "retry",
	},
	INTERNAL_ERROR: {
		title: "同步服务出现异常",
		description: "服务端发生未知错误，请稍后重试。",
		action: "retry",
	},
};

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hour12: false,
});

type SyncErrorAlertProps = {
	error: ApiError;
	retrying?: boolean;
	onRetry: () => void;
	onOpenGuide: () => void;
};

/** 同步失败提示：文案按错误码固定映射（不透传服务端 message，避免泄露内部信息）。 */
export function SyncErrorAlert({
	error,
	retrying = false,
	onRetry,
	onOpenGuide,
}: SyncErrorAlertProps) {
	const copy = ERROR_COPY[error.code] ?? ERROR_COPY.INTERNAL_ERROR;
	const resetAt =
		error.code === "RATE_LIMITED" && error.retryAfter
			? timeFormatter.format(new Date(error.retryAfter * 1000))
			: null;

	return (
		<div
			role="alert"
			className="bg-error-container/20 text-on-surface p-space-md gap-space-md relative flex items-start rounded-lg"
		>
			<TriangleAlert className="text-error mt-0.5 size-[22px] shrink-0" />
			<div className="flex-1 space-y-1">
				<p className="text-label-md text-error font-semibold">{copy.title}</p>
				<p className="text-body-sm text-on-surface-variant">
					{copy.description}
					{resetAt && (
						<>
							{" "}
							预计 <time className="font-mono">{resetAt}</time> 重置。
						</>
					)}
				</p>
			</div>
			{copy.action === "retry" && (
				<Button size="sm" onClick={onRetry} disabled={retrying}>
					重试
				</Button>
			)}
			{copy.action === "guide" && (
				<Button size="sm" onClick={onOpenGuide}>
					查看创建指南
				</Button>
			)}
		</div>
	);
}
