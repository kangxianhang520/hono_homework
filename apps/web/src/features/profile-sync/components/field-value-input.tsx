import { useId, useRef, useState } from "react";
import { IconButton } from "@/components/ui/button";
import { Eye, EyeOff, KeyRound } from "@/components/ui/design-icons";
import { cn } from "@/lib/cn";

import type { FieldValueType } from "../data";
import { validateValue } from "../lib/field-values";

type FieldValueInputProps = {
	type: FieldValueType;
	value: string;
	/** 仅在校验通过且值有变化时调用 */
	onCommit: (value: string) => void;
	readOnly?: boolean;
	/** 无障碍名称，如「用户名 的值」 */
	label: string;
	className?: string;
	/** 草稿变化时回调（供表单在提交时拿到未提交的草稿） */
	onDraftChange?: (draft: string) => void;
};

const INPUT_BASE =
	"field-input bg-surface-container-low w-full max-w-xs px-2.5 py-1";

/**
 * 按类型渲染编辑控件。内部持有 draft：校验失败时保留 draft、显示行内错误，
 * 不调用 onCommit，外部原值保持不变。
 */
export function FieldValueInput({
	type,
	value,
	onCommit,
	readOnly,
	label,
	className,
	onDraftChange,
}: FieldValueInputProps) {
	const errorId = useId();
	const [draft, setDraft] = useState(value);
	const [error, setError] = useState<string | null>(null);
	const [revealed, setRevealed] = useState(false);
	const [focused, setFocused] = useState(false);
	// Esc 取消后紧接着 blur 时,onBlur 闭包里仍是旧 draft,需跳过这次提交
	const skipCommitRef = useRef(false);

	// 外部值变化（重新同步等）且无未提交的非法草稿时，跟随外部值
	const [prevValue, setPrevValue] = useState(value);
	if (prevValue !== value) {
		setPrevValue(value);
		if (error === null) setDraft(value);
	}

	const commit = (next: string) => {
		const msg = validateValue(type, next);
		setError(msg);
		if (msg) return;
		if (next !== value) onCommit(next);
	};

	const revert = () => {
		setDraft(value);
		onDraftChange?.(value);
		setError(null);
	};

	if (readOnly) {
		return (
			<span className="text-code-inline text-on-surface font-mono font-semibold">
				{value}
			</span>
		);
	}

	const errorMsg = error && (
		<p id={errorId} role="alert" className="text-error text-label-sm mt-1">
			{error}
		</p>
	);
	const a11y = {
		"aria-label": label,
		"aria-invalid": error ? true : undefined,
		"aria-describedby": error ? errorId : undefined,
	} as const;

	if (type === "boolean") {
		const on = value === "true";
		return (
			<div className={className}>
				<button
					type="button"
					role="switch"
					aria-checked={on}
					aria-label={label}
					onClick={() => onCommit(on ? "false" : "true")}
					className={cn(
						"focus-visible:ring-primary relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-1",
						on ? "bg-primary" : "bg-outline-variant",
					)}
				>
					<span
						className={cn(
							"bg-surface-container-lowest inline-block size-4 rounded-full shadow-sm transition-transform",
							on ? "translate-x-4.5" : "translate-x-0.5",
						)}
					/>
				</button>
				<span className="text-label-sm text-on-surface-variant ml-2 font-mono">
					{on ? "true" : "false"}
				</span>
			</div>
		);
	}

	const handlers = {
		onChange: (
			e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
		) => {
			setDraft(e.target.value);
			onDraftChange?.(e.target.value);
			if (error) setError(null);
		},
		onBlur: () => {
			setFocused(false);
			if (skipCommitRef.current) {
				skipCommitRef.current = false;
				return;
			}
			commit(draft);
		},
		onFocus: () => setFocused(true),
	};

	if (type === "json") {
		return (
			<div className={className}>
				<textarea
					{...a11y}
					{...handlers}
					rows={focused ? 6 : 2}
					spellCheck={false}
					value={draft}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							revert();
							skipCommitRef.current = true;
							e.currentTarget.blur();
						}
					}}
					className={cn(
						INPUT_BASE,
						"text-code-inline max-w-lg resize-y font-mono",
						error && "ring-error ring-1",
					)}
				/>
				{errorMsg}
			</div>
		);
	}

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") commit(draft);
		else if (e.key === "Escape") revert();
	};

	const isSecret = type === "secret";
	const input = (
		<input
			{...a11y}
			{...handlers}
			onKeyDown={onKeyDown}
			type={
				isSecret
					? revealed
						? "text"
						: "password"
					: type === "number"
						? "text"
						: type
			}
			inputMode={type === "number" ? "decimal" : undefined}
			autoComplete={isSecret ? "off" : undefined}
			value={draft}
			className={cn(
				INPUT_BASE,
				isSecret || type === "number"
					? "text-code-inline font-mono"
					: "text-body-sm",
				error && "ring-error ring-1",
			)}
		/>
	);

	if (!isSecret) {
		return (
			<div className={className}>
				{input}
				{errorMsg}
			</div>
		);
	}
	return (
		<div className={className}>
			<div className="flex items-center gap-2">
				<KeyRound className="text-tertiary size-4 shrink-0" />
				{input}
				<IconButton
					label={revealed ? "隐藏明文" : "显示明文"}
					onClick={() => setRevealed((v) => !v)}
				>
					{revealed ? (
						<EyeOff className="size-4" />
					) : (
						<Eye className="size-4" />
					)}
				</IconButton>
			</div>
			{errorMsg}
		</div>
	);
}
