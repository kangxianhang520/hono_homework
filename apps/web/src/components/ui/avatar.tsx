import { useState } from "react";

import { cn } from "@/lib/cn";

type AvatarProps = {
	src: string;
	name: string;
	className?: string;
};

/** Circular avatar that falls back to initials if the image fails to load. */
export function Avatar({ src, name, className }: AvatarProps) {
	const [failed, setFailed] = useState(false);

	if (failed) {
		const initials = name
			.split(/[\s_-]+/)
			.map((part) => part[0])
			.join("")
			.slice(0, 2)
			.toUpperCase();
		return (
			<span
				role="img"
				aria-label={name}
				className={cn(
					"bg-primary-container text-on-primary-container inline-flex items-center justify-center rounded-full font-semibold",
					className,
				)}
			>
				{initials}
			</span>
		);
	}

	return (
		<img
			src={src}
			alt={name}
			onError={() => setFailed(true)}
			className={cn("rounded-full object-cover", className)}
		/>
	);
}
