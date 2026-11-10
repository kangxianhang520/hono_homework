import type { GitHubUser } from "./api/types";

export type FieldCategory = "core" | "custom" | "sensitive";
export type FieldFilter = FieldCategory | "all";
export type FieldValueType =
	| "string"
	| "number"
	| "boolean"
	| "json"
	| "date"
	| "secret";
export type FieldSource = "github" | "custom";

export type ProfileField = {
	key: string;
	label: string;
	type: FieldValueType;
	source: FieldSource;
	/** 统一以字符串存储，按类型解析/校验 */
	value: string;
	/** Read-only system fields (login) cannot be edited, hidden or deleted */
	readOnly?: boolean;
	/** 标记同步回写 GitHub（本期仅存储，不调用 PATCH /user） */
	writeBack?: boolean;
};

/** 分类由 type + source 派生，不存储，避免不一致。 */
export const categoryOf = (
	field: Pick<ProfileField, "type" | "source">,
): FieldCategory =>
	field.type === "secret"
		? "sensitive"
		: field.source === "github"
			? "core"
			: "custom";

export const FIELD_TYPE_LABEL: Record<FieldValueType, string> = {
	string: "String",
	number: "Number",
	boolean: "Boolean",
	json: "JSON",
	date: "Date",
	secret: "Secret",
};

export const FIELD_TYPE_OPTIONS: { value: FieldValueType; label: string }[] = [
	{ value: "string", label: "String" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "json", label: "JSON" },
	{ value: "date", label: "Date" },
	{ value: "secret", label: "Secret" },
];

export const FIELD_SOURCE_META: Record<
	FieldSource,
	{ label: string; dot: string }
> = {
	github: { label: "GitHub API", dot: "bg-secondary" },
	custom: { label: "自定义扩展", dot: "bg-primary" },
};

export const FILTER_LABELS: Record<FieldFilter, string> = {
	all: "全部",
	core: "GitHub 核心字段",
	custom: "扩展自定义字段",
	sensitive: "敏感凭证",
};

/** 7 个核心字段（均为 string 类型，key 取自 GitHubUser）。 */
export const CORE_FIELD_DEFS = [
	{ key: "login", label: "用户名", readOnly: true },
	{ key: "email", label: "电子邮箱" },
	{ key: "bio", label: "个人简介" },
	{ key: "blog", label: "博客/网站" },
	{ key: "company", label: "所在公司" },
	{ key: "location", label: "所在地区" },
	{ key: "twitter_username", label: "社交 Twitter" },
] as const satisfies readonly {
	key: keyof GitHubUser & string;
	label: string;
	readOnly?: boolean;
}[];

export type CoreFieldKey = (typeof CORE_FIELD_DEFS)[number]["key"];
