import { FileSearch } from "@/components/ui/design-icons";

import { cn } from "@/lib/cn";

import type { ProfileField } from "../data";
import { FieldRow } from "./field-row";

type FieldsTableProps = {
	fields: ProfileField[];
	removing: string[];
	onChange: (key: string, value: string) => void;
	onCopy: (field: ProfileField) => void;
	onCopyKey: (key: string) => void;
	onDelete: (key: string) => void;
	onHide: (key: string) => void;
};

const COLUMNS = [
	{ label: "字段键 (Key)", className: "w-48 px-4" },
	{ label: "显示名称", className: "w-40 px-4" },
	{ label: "当前值 (可即时调整)", className: "px-4" },
	{ label: "类型", className: "w-28 px-3" },
	{ label: "来源", className: "w-32 px-3" },
	{ label: "操作", className: "w-28 px-4 text-right" },
];

function EmptyState() {
	return (
		<div className="animate-fade-in flex flex-col items-center justify-center py-8 text-center">
			<FileSearch className="text-outline mb-2 size-9" />
			<p className="text-headline-sm text-on-surface">未匹配到任何字段</p>
			<p className="text-body-sm text-on-surface-variant">
				请清除搜索框关键词或切换分类筛选
			</p>
		</div>
	);
}

export function FieldsTable({
	fields,
	removing,
	onChange,
	onCopy,
	onCopyKey,
	onDelete,
	onHide,
}: FieldsTableProps) {
	return (
		<>
			<div className="no-scrollbar bg-surface-container-lowest overflow-x-auto rounded-sm shadow-sm">
				<table className="text-body-md w-full min-w-[880px] border-collapse text-left">
					<thead>
						<tr className="bg-surface-container-high/60 text-label-sm text-on-surface-variant font-mono uppercase">
							{COLUMNS.map((col) => (
								<th
									key={col.label}
									scope="col"
									className={cn("py-3 font-bold", col.className)}
								>
									{col.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-surface-container-highest/20 divide-y">
						{fields.map((field) => (
							<FieldRow
								key={field.key}
								field={field}
								removing={removing.includes(field.key)}
								onChange={onChange}
								onCopy={onCopy}
								onCopyKey={onCopyKey}
								onDelete={onDelete}
								onHide={onHide}
							/>
						))}
					</tbody>
				</table>
			</div>
			{fields.length === 0 && <EmptyState />}
		</>
	);
}
