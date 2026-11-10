import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** Pulsing placeholder block; size it via `className`. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			aria-hidden
			className={cn(
				"bg-surface-container-high animate-pulse rounded-sm",
				className,
			)}
			{...props}
		/>
	);
}
