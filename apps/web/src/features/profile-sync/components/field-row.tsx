import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { Copy, KeyRound, Lock, Trash2 } from "@/components/ui/design-icons";
import { cn } from "@/lib/cn";

import {
	FIELD_SOURCE_META,
	FIELD_TYPE_LABEL,
	type ProfileField,
} from "../data";

type FieldRowProps = {
	field: ProfileField;
	removing: boolean;
	onChange: (key: string, value: string) => void;
	onCopy: (value: string) => void;
	onDelete: (key: string) => void;
};

const VALUE_WIDTH: Partial<Record<ProfileField["type"], string>> = {
	textarea: "max-w-lg",
	email: "max-w-sm",
	url: "max-w-sm",
};

function ValueCell({
	field,
	onChange,
}: Pick<FieldRowProps, "field" | "onChange">) {
	if (field.readOnly) {
		return (
			<div className="flex items-center gap-2">
				<span className="text-code-inline text-on-surface font-mono font-semibold">
					{field.value}
				</span>
				<span className="bg-surface-container-high text-outline rounded-xs px-1.5 font-mono text-[10px] uppercase">
					系统核心只读
				</span>
			</div>
		);
	}

	const isSecret = field.type === "secret";
	const input = (
		<input
			type="text"
			aria-label={`${field.label} 的值`}
			value={field.value}
			onChange={(e) => onChange(field.key, e.target.value)}
			className={cn(
				"field-input bg-surface-container-low w-full px-2.5 py-1",
				VALUE_WIDTH[field.type] ?? "max-w-xs",
				isSecret ? "text-code-inline font-mono" : "text-body-sm",
			)}
		/>
	);

	if (!isSecret) return input;
	return (
		<div className="flex items-center gap-2">
			<KeyRound className="text-tertiary size-4 shrink-0" />
			{input}
		</div>
	);
}

/** A single editable row in the fields table. */
export const FieldRow = memo(function FieldRow({
	field,
	removing,
	onChange,
	onCopy,
	onDelete,
}: FieldRowProps) {
	const source = FIELD_SOURCE_META[field.source];
	const isCore = field.category === "core";

	return (
		<tr
			className={cn(
				"border-surface-container-highest/20 group animate-fade-in hover:bg-surface-container-high/40 border-t transition-all duration-250 ease-out",
				removing && "translate-x-2.5 opacity-0",
			)}
		>
			<td className="px-4 py-3">
				<span
					className={cn(
						"code-chip px-2 font-medium",
						isCore ? "text-secondary" : "text-primary",
					)}
				>
					{field.key}
				</span>
			</td>
			<td className="text-on-surface px-4 py-3 font-medium">{field.label}</td>
			<td className="px-4 py-3">
				<ValueCell field={field} onChange={onChange} />
			</td>
			<td className="px-3 py-3">
				<Badge
					shape="pill"
					tone={field.type === "secret" ? "success" : "neutral"}
				>
					{FIELD_TYPE_LABEL[field.type]}
				</Badge>
			</td>
			<td className="px-3 py-3">
				<span className="text-label-sm text-on-surface-variant inline-flex items-center gap-1 font-mono">
					<span className={cn("status-dot", source.dot)} />
					{source.label}
				</span>
			</td>
			<td className="px-4 py-3 text-right">
				<div className="flex items-center justify-end gap-1">
					<IconButton label="复制值" onClick={() => onCopy(field.value)}>
						<Copy className="size-4" />
					</IconButton>
					{field.readOnly ? (
						<span
							title="系统核心字段不可删除"
							className="text-outline-variant cursor-not-allowed p-1.5"
						>
							<Lock className="size-4" />
						</span>
					) : (
						<IconButton
							label="删除字段"
							tone="danger"
							disabled={removing}
							onClick={() => onDelete(field.key)}
						>
							<Trash2 className="size-4" />
						</IconButton>
					)}
				</div>
			</td>
		</tr>
	);
});
