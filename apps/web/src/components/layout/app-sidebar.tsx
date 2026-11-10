import { NavLink } from "react-router";
import {
	History,
	type IconComponent,
	IdCard,
	Key,
	SquareTerminal,
} from "@/components/ui/design-icons";

import { cn } from "@/lib/cn";

type NavItem = {
	to: string;
	label: string;
	icon: IconComponent;
};

export const NAV_ITEMS: NavItem[] = [
	{ to: "/", label: "账户概览与字段管理", icon: IdCard },
	{ to: "/token-auth", label: "Token 授权配置", icon: Key },
	{ to: "/api-debugger", label: "API 调试器", icon: SquareTerminal },
	{ to: "/sync-history", label: "同步历史日志", icon: History },
];

export type RateLimitInfo = { remaining: number; limit: number };

function RateLimitMeter({ rateLimit }: { rateLimit: RateLimitInfo | null }) {
	const percent =
		rateLimit && rateLimit.limit > 0
			? Math.min(
					100,
					Math.max(
						0,
						Math.round((rateLimit.remaining / rateLimit.limit) * 100),
					),
				)
			: 0;
	return (
		<div className="bg-surface-container-low p-space-md rounded-lg">
			<div className="mb-space-xs text-label-sm flex items-center justify-between font-mono">
				<span className="text-on-surface-variant">API Rate Limit</span>
				<span className="text-tertiary">
					{rateLimit
						? `${rateLimit.remaining.toLocaleString()} / ${rateLimit.limit.toLocaleString()}`
						: "— / —"}
				</span>
			</div>
			<div
				role="progressbar"
				aria-label="API Rate Limit"
				aria-valuenow={percent}
				aria-valuemin={0}
				aria-valuemax={100}
				className="bg-surface-container-highest h-1.5 w-full overflow-hidden rounded-full"
			>
				<div
					className="bg-tertiary h-full rounded-full transition-[width] duration-500"
					style={{ width: `${percent}%` }}
				/>
			</div>
		</div>
	);
}

/** Fixed 256px left navigation rail (desktop). */
export function AppSidebar({
	rateLimit = null,
}: {
	rateLimit?: RateLimitInfo | null;
}) {
	return (
		<aside className="bg-surface-container-lowest fixed inset-y-0 left-0 z-40 hidden w-64 flex-col pt-16 lg:flex">
			<div className="p-space-lg">
				<div className="bg-surface-container-low px-space-md py-space-sm flex items-center justify-between rounded-sm">
					<span className="text-label-sm text-on-surface-variant font-mono tracking-wider uppercase">
						Workspace
					</span>
					<span className="text-code-inline text-secondary font-mono font-medium">
						v1.4.2
					</span>
				</div>
			</div>

			<nav className="gap-space-xs px-space-md flex flex-1 flex-col">
				{NAV_ITEMS.map(({ to, label, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						end
						className={({ isActive }) =>
							cn(
								"gap-space-md px-space-md py-space-sm text-body-md flex items-center rounded-sm transition-all",
								isActive
									? "bg-primary-container text-on-primary-container text-body-lg font-semibold"
									: "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
							)
						}
					>
						<Icon className="size-5" />
						{label}
					</NavLink>
				))}
			</nav>

			<div className="p-space-lg mt-auto">
				<RateLimitMeter rateLimit={rateLimit} />
			</div>
		</aside>
	);
}
