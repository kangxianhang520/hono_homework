import type { GitHubUser } from "../api/types";
import {
	CORE_FIELD_DEFS,
	type FieldValueType,
	type ProfileField,
} from "../data";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(raw: string): boolean {
	if (!DATE_RE.test(raw)) return false;
	const [y, m, d] = raw.split("-").map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	return (
		date.getUTCFullYear() === y &&
		date.getUTCMonth() === m - 1 &&
		date.getUTCDate() === d
	);
}

/** 按类型校验字符串值，合法返回 null，否则返回错误文案。 */
export function validateValue(
	type: FieldValueType,
	raw: string,
): string | null {
	switch (type) {
		case "number":
			return raw.trim() !== "" && Number.isFinite(Number(raw))
				? null
				: "请输入有效的数字";
		case "boolean":
			return raw === "true" || raw === "false"
				? null
				: "布尔值只能是 true 或 false";
		case "json":
			try {
				JSON.parse(raw);
				return null;
			} catch {
				return "不是合法的 JSON";
			}
		case "date":
			return isValidDate(raw) ? null : "请输入有效日期（YYYY-MM-DD）";
		case "string":
		case "secret":
			return null;
	}
}

/** 各类型的初始默认值（均可通过 validateValue，string/secret 为空串）。 */
export function defaultValueFor(type: FieldValueType): string {
	switch (type) {
		case "number":
			return "0";
		case "boolean":
			return "false";
		case "json":
			return "{}";
		case "date":
			return new Date().toISOString().slice(0, 10);
		case "string":
		case "secret":
			return "";
	}
}

/** 由 GitHub 用户数据生成 7 个核心字段；null/非字符串归一为空串。 */
export function buildCoreFields(user: GitHubUser): ProfileField[] {
	return CORE_FIELD_DEFS.map((def) => {
		const raw = user[def.key];
		const field: ProfileField = {
			key: def.key,
			label: def.label,
			type: "string",
			source: "github",
			value: typeof raw === "string" ? raw : "",
		};
		if ("readOnly" in def && def.readOnly) field.readOnly = true;
		return field;
	});
}
