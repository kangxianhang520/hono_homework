import {
	type FormEvent,
	type ReactNode,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { Button, IconButton } from "@/components/ui/button";
import { ListPlus, Save, X } from "@/components/ui/design-icons";
import {
	FIELD_TYPE_OPTIONS,
	type FieldValueType,
	type ProfileField,
} from "../data";
import { defaultValueFor, validateValue } from "../lib/field-values";
import { FieldValueInput } from "./field-value-input";

type AddFieldFormProps = {
	open: boolean;
	onCancel: () => void;
	onSubmit: (field: ProfileField) => void;
	hasKey: (key: string) => boolean;
};

const EMPTY_FORM = {
	key: "",
	label: "",
	type: "string" as FieldValueType,
	value: defaultValueFor("string"),
	writeBack: false,
};
const KEY_PATTERN = /^[a-zA-Z_]\w*$/;

function FormItem({
	label,
	htmlFor,
	children,
}: {
	label: string;
	htmlFor: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1 md:col-span-3">
			<label
				htmlFor={htmlFor}
				className="text-label-sm text-on-surface-variant font-mono font-medium"
			>
				{label}
			</label>
			{children}
		</div>
	);
}

/** Inline drawer to create a new custom field. */
export function AddFieldForm({
	open,
	onCancel,
	onSubmit,
	hasKey,
}: AddFieldFormProps) {
	const id = useId();
	const keyInputRef = useRef<HTMLInputElement>(null);
	const [form, setForm] = useState(EMPTY_FORM);
	const [error, setError] = useState<string | null>(null);

	// Focus the first input whenever the drawer opens
	useEffect(() => {
		if (open) keyInputRef.current?.focus();
	}, [open]);

	if (!open) return null;

	const update = <K extends keyof typeof EMPTY_FORM>(
		name: K,
		value: (typeof EMPTY_FORM)[K],
	) => {
		setForm((prev) => ({ ...prev, [name]: value }));
		setError(null);
	};

	const close = () => {
		setForm(EMPTY_FORM);
		setError(null);
		onCancel();
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const key = form.key.trim();
		const label = form.label.trim();
		if (!key || !label) {
			setError("字段键名与显示名称为必填项");
			return;
		}
		if (!KEY_PATTERN.test(key)) {
			setError("键名仅支持字母、数字与下划线，且不能以数字开头");
			return;
		}
		if (hasKey(key)) {
			setError(`字段键 "${key}" 已存在`);
			return;
		}
		const value = form.type === "string" ? form.value.trim() : form.value;
		const valueError = validateValue(form.type, value);
		if (valueError) {
			setError(valueError);
			return;
		}
		onSubmit({
			key,
			label,
			value,
			type: form.type,
			source: "custom",
			...(form.writeBack ? { writeBack: true } : {}),
		});
		setForm(EMPTY_FORM);
	};

	const inputClass = "field-input px-3 py-2 text-body-sm";

	return (
		<div className="animate-fade-in bg-surface-container-high p-space-lg rounded-lg shadow-md">
			<div className="mb-space-md pb-space-sm flex items-center justify-between">
				<div className="flex items-center gap-2">
					<ListPlus className="text-secondary size-5" />
					<h3 className="text-headline-sm text-on-surface font-semibold">
						创建新的账号扩展属性
					</h3>
				</div>
				<IconButton label="取消" onClick={close} className="p-1">
					<X className="size-[18px]" />
				</IconButton>
			</div>

			<form
				onSubmit={handleSubmit}
				className="gap-space-md grid grid-cols-1 md:grid-cols-12"
			>
				<FormItem label="字段英文键名 (Key) *" htmlFor={`${id}-key`}>
					<input
						ref={keyInputRef}
						id={`${id}-key`}
						required
						value={form.key}
						onChange={(e) => update("key", e.target.value)}
						placeholder="e.g. internal_badge_id"
						className="field-input text-code-inline px-3 py-2 font-mono"
					/>
				</FormItem>
				<FormItem label="字段显示名称 (Label) *" htmlFor={`${id}-label`}>
					<input
						id={`${id}-label`}
						required
						value={form.label}
						onChange={(e) => update("label", e.target.value)}
						placeholder="e.g. 内部认证工号"
						className={inputClass}
					/>
				</FormItem>
				<FormItem label="字段数据类型" htmlFor={`${id}-type`}>
					<select
						id={`${id}-type`}
						value={form.type}
						onChange={(e) => {
							const type = e.target.value as FieldValueType;
							setForm((prev) => ({
								...prev,
								type,
								value: defaultValueFor(type),
							}));
							setError(null);
						}}
						className={inputClass}
					>
						{FIELD_TYPE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</FormItem>
				<FormItem label="数据来源 (Source)" htmlFor={`${id}-source`}>
					<select
						id={`${id}-source`}
						value={form.writeBack ? "writeBack" : "custom"}
						onChange={(e) =>
							update("writeBack", e.target.value === "writeBack")
						}
						className={inputClass}
					>
						<option value="custom">custom（仅本地）</option>
						<option value="writeBack">custom + writeBack（同步回写）</option>
					</select>
				</FormItem>
				<FormItem label="初始默认值 (Value)" htmlFor={`${id}-value`}>
					<FieldValueInput
						key={form.type}
						type={form.type}
						value={form.value}
						label="初始默认值"
						onCommit={(v) => update("value", v)}
						onDraftChange={(v) => update("value", v)}
						className="w-full"
					/>
				</FormItem>

				{error && (
					<p
						role="alert"
						className="animate-fade-in text-body-sm text-error md:col-span-12"
					>
						{error}
					</p>
				)}

				<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between md:col-span-12">
					<p className="text-body-sm text-on-surface-variant">
						writeBack 仅记录标记，本期不会调用 GitHub PATCH 接口
					</p>
					<div className="flex items-center gap-2">
						<Button variant="subtle" onClick={close}>
							取消
						</Button>
						<Button type="submit" variant="primary" className="gap-1 shadow">
							<Save className="size-4" />
							确认添加字段
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
}
