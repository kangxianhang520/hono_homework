import { Avatar } from "@/components/ui/avatar";
import { StatusDot } from "@/components/ui/badge";
import { BookOpen, ChevronDown } from "@/components/ui/design-icons";

const VIEWER_AVATAR = "/assets/profile-sync/viewer.jpg";

function Divider() {
	return <span aria-hidden className="bg-surface-variant block h-4 w-px" />;
}

/** Fixed glassmorphic top bar. */
export function AppHeader() {
	return (
		<header className="bg-surface-container-lowest/85 px-margin md:px-margin-desktop fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
			<div className="gap-space-lg flex min-w-0 items-center">
				<img
					src="/assets/profile-sync/logo-placeholder.svg"
					alt="GitHub Sync Hub Logo"
					className="h-8 w-auto shrink-0 object-contain"
				/>
				<span className="text-headline-sm text-on-surface truncate font-semibold tracking-tight">
					GitHub Profile Sync &amp; Fields Hub
				</span>
				<span className="mx-space-xs hidden sm:block">
					<Divider />
				</span>
				<span className="gap-space-xs bg-surface-container-high px-space-sm py-space-xs hidden items-center rounded-sm sm:inline-flex">
					<StatusDot pulse className="size-2" />
					<span className="text-label-sm text-tertiary font-mono tracking-wider uppercase">
						API v3 Connected
					</span>
				</span>
			</div>

			<div className="gap-space-lg flex shrink-0 items-center">
				<a
					href="https://docs.github.com/rest/users/users"
					target="_blank"
					rel="noreferrer"
					className="gap-space-xs text-body-md text-on-surface-variant hover:text-on-surface hidden items-center transition-colors sm:flex"
				>
					<BookOpen className="size-[18px]" />
					Quick Docs
				</a>
				<span className="hidden sm:block">
					<Divider />
				</span>
				<button
					type="button"
					className="gap-space-sm bg-surface-container-low py-space-xs pr-space-sm pl-space-xs hover:bg-surface-container-high flex items-center rounded-lg transition-colors"
				>
					<Avatar
						src={VIEWER_AVATAR}
						name="octocat dev"
						className="text-label-sm size-8"
					/>
					<span className="text-label-md text-on-surface hidden font-mono md:inline">
						octocat_dev
					</span>
					<ChevronDown className="text-on-surface-variant size-4" />
				</button>
			</div>
		</header>
	);
}
