import { useEffect, useRef, useState } from "react";
import { Badge, StatusDot } from "@/components/ui/badge";
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
	Gauge,
	KeyRound,
	Lock,
	RefreshCw,
} from "@/components/ui/design-icons";
import { useToast } from "@/components/ui/toast";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/cn";

import { MOCK_TOKEN } from "../data";
import { TokenGuide } from "./token-guide";

const FETCH_DURATION_MS = 1100;

function ScopeChip({ children }: { children: string }) {
	return (
		<code className="code-chip bg-surface-container-lowest text-secondary px-1">
			{children}
		</code>
	);
}

/** Section 1 — PAT input, visibility toggle, fetch / refresh actions. */
export function TokenCard() {
	const { showToast } = useToast();
	const copy = useClipboard();
	const [token, setToken] = useState(MOCK_TOKEN);
	const [revealed, setRevealed] = useState(false);
	const [guideOpen, setGuideOpen] = useState(false);
	const [fetching, setFetching] = useState(false);
	const fetchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	// Cancel the simulated request if the card unmounts mid-flight
	useEffect(() => () => clearTimeout(fetchTimer.current), []);

	const handleFetch = () => {
		setFetching(true);
		fetchTimer.current = setTimeout(() => {
			setFetching(false);
			showToast("已成功从 GitHub API 拉取最新账户信息！", "success");
		}, FETCH_DURATION_MS);
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
					<Badge tone="success">
						<StatusDot />
						已验证 / Validated
					</Badge>
					<Badge tone="neutral" className="gap-1">
						<Gauge className="size-3.5" />
						4,982 / 5,000 req/hr
					</Badge>
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
							需要具备 <ScopeChip>read:user</ScopeChip> 与{" "}
							<ScopeChip>user:email</ScopeChip> 权限范围
						</span>
					</p>
				</div>

				<div className="flex items-center gap-2 lg:col-span-4">
					<Button
						variant="primary"
						size="lg"
						onClick={handleFetch}
						disabled={fetching}
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
						onClick={() => showToast("已清理 PAT 缓存与会话状态", "info")}
					>
						<Brush className="size-5" />
					</Button>
					<Button
						size="icon"
						title="导出原始 JSON"
						aria-label="导出原始 JSON"
						onClick={() => showToast("正在导出完整账户同步数据...", "info")}
					>
						<Download className="size-5" />
					</Button>
				</div>
			</div>

			<TokenGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
		</Card>
	);
}
