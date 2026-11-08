import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type CollapseProps = {
	open: boolean;
	id?: string;
	className?: string;
	children: ReactNode;
};

/**
 * Height-animated disclosure using the grid-rows 0fr → 1fr technique,
 * so content of any height expands / collapses smoothly.
 */
export function Collapse({ open, id, className, children }: CollapseProps) {
	return (
		<div
			id={id}
			aria-hidden={!open}
			inert={!open}
			className={cn(
				"grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
				open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
				className,
			)}
		>
			<div className="min-h-0 overflow-hidden">{children}</div>
		</div>
	);
}
