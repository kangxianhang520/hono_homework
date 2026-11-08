import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const variantClasses = {
	/** Solid primary (light indigo) */
	primary:
		"bg-primary text-on-primary font-semibold hover:bg-primary/90 shadow-sm",
	/** Saturated indigo container */
	accent:
		"bg-primary-container text-on-primary-container font-semibold hover:bg-primary-container/90 shadow-sm",
	/** Elevated tonal surface */
	tonal:
		"bg-surface-container-high text-on-surface-variant hover:bg-surface-variant hover:text-on-surface",
	/** Low-emphasis tonal */
	subtle: "bg-surface-container text-on-surface-variant hover:text-on-surface",
} as const;

const sizeClasses = {
	sm: "px-3.5 py-1.5 text-label-md font-mono",
	md: "px-4 py-2 text-label-md font-mono",
	lg: "px-4 py-2.5 text-headline-sm",
	icon: "p-2.5",
} as const;

export type ButtonProps = ComponentProps<"button"> & {
	variant?: keyof typeof variantClasses;
	size?: keyof typeof sizeClasses;
};

export function Button({
	variant = "tonal",
	size = "md",
	type = "button",
	className,
	...props
}: ButtonProps) {
	return (
		<button
			type={type}
			className={cn(
				"inline-flex items-center justify-center gap-1.5 rounded-sm transition-all",
				"focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none",
				"disabled:cursor-not-allowed disabled:opacity-70",
				variantClasses[variant],
				sizeClasses[size],
				className,
			)}
			{...props}
		/>
	);
}

type IconButtonProps = ComponentProps<"button"> & {
	/** Accessible label, also used as tooltip */
	label: string;
	tone?: "default" | "danger";
};

/** Ghost icon-only button (copy, delete, visibility toggle). */
export function IconButton({
	label,
	tone = "default",
	type = "button",
	className,
	...props
}: IconButtonProps) {
	return (
		<button
			type={type}
			title={label}
			aria-label={label}
			className={cn(
				"icon-btn",
				tone === "danger" &&
					"text-error/80 hover:bg-error-container/20 hover:text-error",
				className,
			)}
			{...props}
		/>
	);
}
