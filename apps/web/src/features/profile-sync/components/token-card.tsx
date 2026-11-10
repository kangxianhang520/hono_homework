import { useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Brush,
	CircleCheck,
	CircleQuestionMark,
	Copy,
	Download,
	Eye,
	EyeOff,
	KeyRound,
	Lock,
	RefreshCw,
} from "@/components/ui/design-icons";
import { useToast } from "@/components/ui/toast";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/cn";
import { downloadJson, profileExportFilename } from "@/lib/download";

import { useGitHubSync } from "../sync-context";
import { ConnectionBadge } from "./connection-badge";
import { RateLimitBadge } from "./rate-limit-badge";
import { SyncErrorAlert } from "./sync-error-alert";
import { TokenGuide } from "./token-guide";

const REQUIRED_SCOPES = ["read:user", "user:email"] as const;

function ScopeChip({
	children,
	missing = false,
}: {
	children: string;
	missing?: boolean;
}) {
	return (
		<code
			className={cn(
				"code-chip bg-surface-container-lowest px-1",
				missing ? "text-error font-semibold" : "text-secondary",
			)}
			title={missing ? "Token 缺少该权限" : undefined}
		>
			{children}
		</code>
	);
}

/** Section 1 — PAT input, visibility toggle, fetch / refresh actions. */
export function TokenCard() {
	const { showToast } = useToast();
	const copy = useClipboard();
	const { token, setToken, status, snapshot, sync, error, retry, clear } =
		useGitHubSync();
	const [revealed, setRevealed] = useState(false);
	const [guideOpen, setGuideOpen] = useState(false);
	const fetching = status === "loading";
	// fine-grained PAT 无 x-oauth-scopes 头，scopes 为空不代表缺权限，此时不做对比
	const grantedScopes = snapshot?.scopes ?? [];
	const canCompare = grantedScopes.length > 0;
	// classic PAT 的父级 `user` scope 同时包含 read:user 与 user:email
	const isMissing = (scope: string) =>
		canCompare &&
		!grantedScopes.includes(scope) &&
		!(
			grantedScopes.includes("user") &&
			(scope === "read:user" || scope === "user:email")
		);

	const handleFetch = async () => {
		await sync();
	};

	const handleClear = () => {
		clear();
		setRevealed(false);
		showToast("已清理 PAT 缓存与会话状态", "info");
	};

	const handleExport = () => {
		if (!snapshot) return;
		// snapshot 为服务端响应，不含 PAT
		downloadJson(snapshot, profileExportFilename(snapshot.user.login));
		showToast("已导出原始 JSON", "success");
	};

	return (
		<Card padding="fixed" className="gap-space-lg flex flex-col">
			{/* Decorative glow */}
			<div className="bg-primary/5 pointer-events-none absolute -top-20 -right-20 size-80 rounded-full blur-3xl" />

			{/* Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div className="gap-space-md flex items-center">
					<div className="bg-primary-container/20 text-primary flex size-9 shrink-0 items-center justify-center rounded-sm">
						<KeyRound className="size-[22px]" />
					</div>
					<div>
						<h2 className="text-headline-sm text-on-surface font-semibold tracking-tight">
							GitHub 个人访问令牌 (Personal Access Token) 授权与同步
						</h2>
						<p className="text-body-sm text-on-surface-variant">
							配置只读或读写 PAT，从官方 API
							抓取公开与私有账号元数据并进行扩展归档
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<ConnectionBadge status={status} hasSnapshot={snapshot !== null} />
					<RateLimitBadge />
				</div>
			</div>

			{/* Form row */}
			<div className="gap-space-lg relative grid grid-cols-1 items-end lg:grid-cols-12">
				<div className="flex flex-col gap-1.5 lg:col-span-8">
					<div className="flex items-center justify-between gap-2">
						<label
							htmlFor="pat-input"
							className="text-label-md text-on-surface flex items-center gap-1.5 font-mono font-medium"
						>
							Personal Access Token (classic / fine-grained)
							<span className="text-tertiary text-xs">*</span>
						</label>
						<button
							type="button"
							aria-expanded={guideOpen}
							aria-controls="token-guide"
							onClick={() => setGuideOpen((open) => !open)}
							className="text-label-sm text-primary hover:text-primary-fixed flex items-center gap-1 font-mono transition-colors"
						>
							<CircleQuestionMark className="size-3.5" />
							如何创建正确权限的 Token?
						</button>
					</div>

					<div className="relative flex items-center">
						<Lock className="text-outline pointer-events-none absolute left-3 size-[18px]" />
						<input
							id="pat-input"
							type={revealed ? "text" : "password"}
							value={token}
							onChange={(e) => setToken(e.target.value)}
							placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
							autoComplete="off"
							spellCheck={false}
							className="field-input text-code-inline w-full py-2.5 pr-24 pl-10 font-mono shadow-inner focus:ring-2"
						/>
						<div className="absolute right-2.5 flex items-center gap-1">
							<IconButton
								label={revealed ? "隐藏令牌" : "显示令牌"}
								onClick={() => setRevealed((v) => !v)}
								className="p-1"
							>
								{revealed ? (
									<EyeOff className="size-[18px]" />
								) : (
									<Eye className="size-[18px]" />
								)}
							</IconButton>
							<IconButton
								label="复制"
								onClick={() => copy(token, "PAT 令牌已复制到剪贴板")}
								className="p-1"
							>
								<Copy className="size-[18px]" />
							</IconButton>
						</div>
					</div>

					<p className="text-body-sm text-on-surface-variant flex items-center gap-2">
						<CircleCheck className="text-tertiary size-3.5" />
						<span>
							需要具备{" "}
							<ScopeChip missing={isMissing(REQUIRED_SCOPES[0])}>
								{REQUIRED_SCOPES[0]}
							</ScopeChip>{" "}
							与{" "}
							<ScopeChip missing={isMissing(REQUIRED_SCOPES[1])}>
								{REQUIRED_SCOPES[1]}
							</ScopeChip>{" "}
							权限范围
							{canCompare && (
								<span className="ml-1">
									（已授予：
									<code className="code-chip px-0.5">
										{grantedScopes.join(", ")}
									</code>
									）
								</span>
							)}
						</span>
					</p>
				</div>

				<div className="flex items-center gap-2 lg:col-span-4">
					<Button
						variant="primary"
						size="lg"
						onClick={handleFetch}
						disabled={fetching || token.trim() === ""}
						aria-busy={fetching}
						className="group flex-1 gap-2"
					>
						<RefreshCw
							className={cn(
								"size-[18px] transition-transform duration-500",
								fetching ? "animate-spin" : "group-hover:rotate-180",
							)}
						/>
						{fetching ? "正在与 GitHub API 同步..." : "立即拉取 / 刷新账户"}
					</Button>
					<Button
						size="icon"
						title="清除本地缓存"
						aria-label="清除本地缓存"
						onClick={handleClear}
					>
						<Brush className="size-5" />
					</Button>
					<Button
						size="icon"
						title="导出原始 JSON"
						aria-label="导出原始 JSON"
						onClick={handleExport}
						disabled={!snapshot}
					>
						<Download className="size-5" />
					</Button>
				</div>
			</div>

			{status === "error" && error && (
				<SyncErrorAlert
					error={error}
					retrying={fetching}
					onRetry={() => void retry()}
					onOpenGuide={() => setGuideOpen(true)}
				/>
			)}

			<TokenGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
		</Card>
	);
}
