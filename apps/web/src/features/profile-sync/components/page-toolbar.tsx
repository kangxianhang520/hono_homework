import { StatusDot } from "@/components/ui/badge";
import { Network } from "@/components/ui/design-icons";

type PageToolbarProps = {
	user: string;
	page: string;
};

/** Breadcrumb + sync status strip at the top of the page. */
export function PageToolbar({ user, page }: PageToolbarProps) {
	return (
		<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
			<nav
				aria-label="Breadcrumb"
				className="gap-space-sm text-label-md text-on-surface-variant flex flex-wrap items-center font-mono"
			>
				<span className="text-primary flex cursor-pointer items-center gap-1 hover:underline">
					<Network className="size-4" />
					Workspaces
				</span>
				<span aria-hidden>/</span>
				<span>{user}</span>
				<span aria-hidden>/</span>
				<span aria-current="page" className="text-on-surface font-semibold">
					{page}
				</span>
			</nav>

			<div className="gap-space-md flex items-center">
				<div className="bg-surface-container-high px-space-md flex items-center gap-2 rounded-full py-1 shadow-sm">
					<StatusDot className="size-2" />
					<span className="text-label-sm text-on-surface font-mono">
						REST v3 Profile Sync: 活跃
					</span>
				</div>
				<span className="text-code-inline text-outline font-mono">
					最后同步: 2 分钟前
				</span>
			</div>
		</div>
	);
}
