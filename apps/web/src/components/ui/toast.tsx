import { CircleCheck, Info } from "lucide-react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { cn } from "@/lib/cn";

type ToastType = "success" | "info";

type ToastItem = {
	id: number;
	message: string;
	type: ToastType;
	leaving: boolean;
};

type ToastContextValue = {
	showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 3500;
const EXIT_MS = 300;

/** Bottom-right toast stack matching the design (enter: slide up, exit: fade). */
export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const nextId = useRef(0);
	const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

	const schedule = useCallback((fn: () => void, ms: number) => {
		const timer = setTimeout(() => {
			timers.current.delete(timer);
			fn();
		}, ms);
		timers.current.add(timer);
	}, []);

	// Clear pending timers on unmount
	useEffect(() => {
		const pending = timers.current;
		return () => {
			for (const timer of pending) clearTimeout(timer);
		};
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = "success") => {
			const id = nextId.current++;
			setToasts((list) => [...list, { id, message, type, leaving: false }]);
			schedule(() => {
				setToasts((list) =>
					list.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
				);
				schedule(
					() => setToasts((list) => list.filter((t) => t.id !== id)),
					EXIT_MS,
				);
			}, VISIBLE_MS);
		},
		[schedule],
	);

	const value = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div
				aria-live="polite"
				className="pointer-events-none fixed right-8 bottom-6 z-50 flex flex-col gap-2"
			>
				{toasts.map((toast) => {
					const Icon = toast.type === "success" ? CircleCheck : Info;
					return (
						<div
							key={toast.id}
							role="status"
							className={cn(
								"animate-toast-in text-body-sm pointer-events-auto flex items-center gap-2 rounded-sm px-4 py-3 shadow-xl transition-all duration-300",
								toast.type === "success"
									? "bg-tertiary-container text-on-tertiary-container"
									: "bg-surface-container-high text-on-surface",
								toast.leaving && "translate-y-2 opacity-0",
							)}
						>
							<Icon className="size-[18px]" />
							<span>{toast.message}</span>
						</div>
					);
				})}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
	return ctx;
}
