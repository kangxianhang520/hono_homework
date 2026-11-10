import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { Copy, EyeOff, Lock, Trash2 } from "@/components/ui/design-icons";
import { Popconfirm } from "@/components/ui/popconfirm";
import { cn } from "@/lib/cn";

import {
	categoryOf,
	FIELD_SOURCE_META,
	FIELD_TYPE_LABEL,
	type ProfileField,
} from "../data";
import { FieldValueInput } from "./field-value-input";

type FieldRowProps = {
	field: ProfileField;
	removing: boolean;
	onChange: (key: string, value: string) => void;
	onCopy: (field: ProfileField) => void;
	onCopyKey: (key: string) => void;
	onDelete: (key: string) => void;
	onHide: (key: string) => void;
};

function ValueCell({
	field,
	onChange,
}: Pick<FieldRowProps, "field" | "onChange">) {
	const input = (
		<FieldValueInput
			type={field.type}
			value={field.value}
			readOnly={field.readOnly}
			label={`${field.label} 的值`}
			onCommit={(value) => onChange(field.key, value)}
		/>
	);
	if (!field.readOnly) return input;
	return (
		<div className="flex items-center gap-2">
			{input}
			<span className="bg-surface-container-high text-outline rounded-xs px-1.5 font-mono text-[10px] uppercase">
				系统核心只读
			</span>
		</div>
	);
}

/** A single editable row in the fields table. */
export const FieldRow = memo(function FieldRow({
	field,
	removing,
	onChange,
	onCopy,
	onCopyKey,
	onDelete,
	onHide,
}: FieldRowProps) {
	const source = FIELD_SOURCE_META[field.source];
	const isCore = categoryOf(field) === "core";

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
				<IconButton
					label={`复制字段键 ${field.key}`}
					className="ml-1 align-middle"
					onClick={() => onCopyKey(field.key)}
				>
					<Copy className="size-4" />
				</IconButton>
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
					<IconButton label="复制值" onClick={() => onCopy(field)}>
						<Copy className="size-4" />
					</IconButton>
					{field.source === "custom" ? (
						<Popconfirm onConfirm={() => onDelete(field.key)}>
							{({ toggle, ...aria }) => (
								<IconButton
									label="删除字段"
									tone="danger"
									disabled={removing}
									onClick={toggle}
									aria-expanded={aria["aria-expanded"]}
									aria-controls={aria["aria-controls"]}
								>
									<Trash2 className="size-4" />
								</IconButton>
							)}
						</Popconfirm>
					) : field.readOnly ? (
						<span
							title="系统核心字段不可屏蔽"
							className="text-outline-variant cursor-not-allowed p-1.5"
						>
							<Lock className="size-4" />
						</span>
					) : (
						<IconButton label="屏蔽字段" onClick={() => onHide(field.key)}>
							<EyeOff className="size-4" />
						</IconButton>
					)}
				</div>
			</td>
		</tr>
	);
});
