import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CirclePlus, Search } from "@/components/ui/design-icons";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { useToast } from "@/components/ui/toast";
import { useClipboard } from "@/hooks/use-clipboard";

import {
	FILTER_LABELS,
	type FieldFilter,
	INITIAL_FIELDS,
	type ProfileField,
} from "../data";
import { useProfileFields } from "../hooks/use-profile-fields";
import { AddFieldForm } from "./add-field-form";
import { FieldsTable } from "./fields-table";

const FILTER_ORDER: FieldFilter[] = ["all", "core", "custom", "sensitive"];

/** Section 3 — searchable / filterable / editable field management. */
export function FieldsPanel() {
	const { showToast } = useToast();
	const copy = useClipboard();
	const [adding, setAdding] = useState(false);
	const {
		fields,
		visibleFields,
		removing,
		counts,
		filter,
		query,
		hasKey,
		addField,
		updateValue,
		removeField,
		setFilter,
		setQuery,
	} = useProfileFields(INITIAL_FIELDS, "custom");

	const filterOptions = useMemo(
		() =>
			FILTER_ORDER.map((value) => ({
				value,
				label: `${FILTER_LABELS[value]} (${counts[value]})`,
			})),
		[counts],
	);

	const handleAdd = (field: ProfileField) => {
		addField(field);
		setAdding(false);
		showToast(`已成功添加扩展字段: ${field.key}`, "success");
	};

	const handleDelete = useCallback(
		(key: string) =>
			removeField(key, () => showToast(`已移除字段: ${key}`, "info")),
		[removeField, showToast],
	);

	const handleCopy = useCallback(
		(value: string) => copy(value, `已复制: ${value}`),
		[copy],
	);

	return (
		<Card className="gap-space-lg flex flex-col">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-headline-md text-on-surface font-semibold">
							已同步账户字段与扩展属性管理
						</h2>
						<span className="bg-surface-container-high text-label-sm text-primary shrink-0 rounded-full px-2 py-0.5 font-mono font-semibold">
							{fields.length} 个字段
						</span>
					</div>
					<p className="text-body-sm text-on-surface-variant">
						支持增、删、改本地扩展元数据，并根据需要配置是否回写至 GitHub
						Profile 状态
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div className="relative">
						<Search className="text-outline pointer-events-none absolute top-1/2 left-2.5 size-[18px] -translate-y-1/2" />
						<input
							type="search"
							aria-label="筛选字段"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="快速筛选字段名称或键值..."
							className="field-input text-body-sm w-56 py-1.5 pr-3 pl-9 md:w-64"
						/>
					</div>
					<Button variant="accent" size="sm" onClick={() => setAdding(true)}>
						<CirclePlus className="size-[18px]" />
						添加新字段
					</Button>
				</div>
			</div>

			<SegmentedTabs
				ariaLabel="字段分类"
				options={filterOptions}
				value={filter}
				onChange={setFilter}
			/>

			<AddFieldForm
				open={adding}
				onCancel={() => setAdding(false)}
				onSubmit={handleAdd}
				hasKey={hasKey}
			/>

			<FieldsTable
				fields={visibleFields}
				removing={removing}
				onChange={updateValue}
				onCopy={handleCopy}
				onDelete={handleDelete}
			/>
		</Card>
	);
}
