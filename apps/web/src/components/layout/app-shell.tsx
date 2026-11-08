import type { ReactNode } from "react";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

/** Dashboard frame: fixed header + fixed sidebar + scrollable main stage. */
export function AppShell({ children }: { children: ReactNode }) {
	return (
		<div className="bg-background text-body-md text-on-surface min-h-svh antialiased">
			<AppHeader />
			<AppSidebar />
			<div className="min-h-svh lg:pl-64">
				<main className="px-margin md:px-margin-desktop w-full pt-16">
					<div className="gap-space-xl pt-space-xl flex w-full flex-col pb-16">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
