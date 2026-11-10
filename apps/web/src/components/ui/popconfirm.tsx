import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type PopconfirmProps = {
	/** Trigger element renderer; call `toggle` from its onClick. */
	children: (props: {
		toggle: () => void;
		open: boolean;
		"aria-expanded": boolean;
		"aria-controls": string;
	}) => ReactNode;
	title?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
};

/**
 * Lightweight inline confirmation anchored next to its trigger.
 * Esc / outside click closes it; focus lands on "cancel" when opened.
 */
export function Popconfirm({
	children,
	title = "确认删除？",
	confirmText = "删除",
	cancelText = "取消",
	onConfirm,
}: PopconfirmProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLSpanElement>(null);
	const cancelRef = useRef<HTMLButtonElement>(null);
	const id = useId();

	useEffect(() => {
		if (!open) return;
		cancelRef.current?.focus();
		const onPointerDown = (e: MouseEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			setOpen(false);
			rootRef.current?.querySelector<HTMLElement>("button")?.focus();
		};
		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	return (
		<span ref={rootRef} className="relative inline-flex">
			{children({
				toggle: () => setOpen((v) => !v),
				open,
				"aria-expanded": open,
				"aria-controls": id,
			})}
			{open && (
				<div
					id={id}
					role="alertdialog"
					aria-label={title}
					className="animate-fade-in bg-surface-container-highest text-on-surface absolute top-full right-0 z-20 mt-1 flex items-center gap-2 rounded-sm px-3 py-2 whitespace-nowrap shadow-xl"
				>
					<span className="text-body-sm">{title}</span>
					<Button ref={cancelRef} size="sm" onClick={() => setOpen(false)}>
						{cancelText}
					</Button>
					<Button
						size="sm"
						variant="primary"
						onClick={() => {
							setOpen(false);
							onConfirm();
						}}
					>
						{confirmText}
					</Button>
				</div>
			)}
		</span>
	);
}
