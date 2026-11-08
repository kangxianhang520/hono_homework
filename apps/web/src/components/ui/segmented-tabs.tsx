import { cn } from "@/lib/cn";

export type SegmentedOption<T extends string> = {
	value: T;
	label: string;
};

type SegmentedTabsProps<T extends string> = {
	options: SegmentedOption<T>[];
	value: T;
	onChange: (value: T) => void;
	ariaLabel: string;
};

/** Segmented filter control. */
export function SegmentedTabs<T extends string>({
	options,
	value,
	onChange,
	ariaLabel,
}: SegmentedTabsProps<T>) {
	return (
		<div
			role="tablist"
			aria-label={ariaLabel}
			className="bg-surface-container-lowest flex w-fit flex-wrap items-center gap-1.5 rounded-sm p-1"
		>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={active}
						onClick={() => onChange(option.value)}
						className={cn(
							"text-label-md rounded-xs px-3 py-1 font-mono font-medium transition-colors",
							active
								? "bg-surface-container-high text-on-surface"
								: "text-on-surface-variant hover:text-on-surface",
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
