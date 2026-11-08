import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const toneClasses = {
	success: "bg-tertiary/10 text-tertiary",
	neutral: "bg-surface-container-high text-on-surface-variant",
	primary: "bg-primary-container text-on-primary-container font-semibold",
	accent: "bg-surface-container-high text-primary font-semibold",
} as const;

const shapeClasses = {
	tag: "rounded-md px-2.5 py-1",
	compact: "rounded-xs px-2 py-0.5",
	pill: "rounded-full px-2 py-0.5",
} as const;

export type BadgeTone = keyof typeof toneClasses;

type BadgeProps = ComponentProps<"span"> & {
	tone?: BadgeTone;
	shape?: keyof typeof shapeClasses;
};

/** Monospace status tag / badge (label-sm). */
export function Badge({
	tone = "neutral",
	shape = "tag",
	className,
	...props
}: BadgeProps) {
	return (
		<span
			className={cn(
				"text-label-sm inline-flex items-center gap-1.5 font-mono whitespace-nowrap",
				toneClasses[tone],
				shapeClasses[shape],
				className,
			)}
			{...props}
		/>
	);
}

type StatusDotProps = {
	className?: string;
	pulse?: boolean;
};

/** Small circular status beacon. Defaults to tertiary; override with a bg-* class. */
export function StatusDot({ className, pulse }: StatusDotProps) {
	return (
		<span
			aria-hidden
			className={cn(
				"status-dot bg-tertiary",
				pulse && "animate-pulse",
				className,
			)}
		/>
	);
}
