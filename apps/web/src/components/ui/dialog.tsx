import { type ReactNode, useEffect, useRef } from "react";

import { X } from "@/components/ui/design-icons";
import { cn } from "@/lib/cn";

type DialogProps = {
	open: boolean;
	onClose: () => void;
	title: string;
	className?: string;
	children: ReactNode;
};

/**
 * Native <dialog> wrapper. showModal() gives Esc, focus trapping,
 * focus restoration and ::backdrop for free.
 */
export function Dialog({
	open,
	onClose,
	title,
	className,
	children,
}: DialogProps) {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (open && !el.open) el.showModal();
		else if (!open && el.open) el.close();
	}, [open]);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: 键盘关闭由原生 dialog 的 Esc 处理,click 仅用于 backdrop
		<dialog
			ref={ref}
			aria-label={title}
			onClose={onClose}
			onClick={(e) => {
				// 点击 backdrop 时 target 即 dialog 本身
				if (e.target === ref.current) onClose();
			}}
			className={cn(
				"animate-fade-in bg-surface-container-high text-on-surface m-auto w-[min(92vw,720px)] rounded-lg p-0 shadow-xl backdrop:bg-black/60 backdrop:backdrop-blur-sm",
				className,
			)}
		>
			{open && (
				<div className="p-space-lg flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h2 className="text-headline-sm">{title}</h2>
						<button
							type="button"
							aria-label="关闭"
							onClick={onClose}
							className="text-on-surface-variant hover:text-on-surface rounded-full p-1 transition-colors"
						>
							<X className="size-5" />
						</button>
					</div>
					{children}
				</div>
			)}
		</dialog>
	);
}
