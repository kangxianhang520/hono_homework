import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Eye } from "@/components/ui/design-icons";

import type { ProfileField } from "../data";

type HiddenFieldsBarProps = {
	fields: ProfileField[];
	onRestore: (key: string | "all") => void;
};

/** Shows blocked core fields with per-field and bulk restore. Hidden when none. */
export function HiddenFieldsBar({ fields, onRestore }: HiddenFieldsBarProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const id = useId();
	const count = fields.length;

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (e: MouseEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			setOpen(false);
			triggerRef.current?.focus();
		};
		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	// 全部恢复或逐个恢复到清空后收起下拉
	useEffect(() => {
		if (count === 0) setOpen(false);
	}, [count]);

	if (count === 0) return null;

	return (
		<div
			ref={rootRef}
			className="bg-surface-container-high/60 text-body-sm text-on-surface-variant animate-fade-in relative flex flex-wrap items-center gap-3 rounded-sm px-4 py-2"
		>
			<Eye className="text-outline size-[18px]" />
			<span>已屏蔽 {count} 个核心字段</span>
			<Button
				ref={triggerRef}
				size="sm"
				aria-expanded={open}
				aria-controls={id}
				onClick={() => setOpen((v) => !v)}
			>
				恢复
				<ChevronDown className="size-4" />
			</Button>
			<Button size="sm" onClick={() => onRestore("all")}>
				全部恢复
			</Button>
			{open && (
				<ul
					id={id}
					aria-label="已屏蔽的核心字段"
					className="animate-fade-in bg-surface-container-highest text-on-surface absolute top-full left-4 z-20 mt-1 min-w-56 rounded-sm py-1 shadow-xl"
				>
					{fields.map((f) => (
						<li key={f.key}>
							<button
								type="button"
								onClick={() => onRestore(f.key)}
								className="hover:bg-surface-container-high/60 flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left"
							>
								<span className="font-mono">{f.key}</span>
								<span className="text-primary text-label-sm">恢复</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
