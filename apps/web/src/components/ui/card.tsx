import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type CardProps = ComponentProps<"section"> & {
	/** Tonal surface level of the panel */
	surface?: "container" | "low";
	/** `responsive` tightens padding on small screens */
	padding?: "fixed" | "responsive";
};

/** Layer-1 panel: tonal surface, 8px radius, soft shadow. */
export function Card({
	surface = "container",
	padding = "responsive",
	className,
	...props
}: CardProps) {
	return (
		<section
			className={cn(
				"relative overflow-hidden rounded-lg shadow-md",
				padding === "fixed" ? "p-space-xl" : "p-space-lg md:p-space-xl",
				surface === "container"
					? "bg-surface-container"
					: "bg-surface-container-low",
				className,
			)}
			{...props}
		/>
	);
}
