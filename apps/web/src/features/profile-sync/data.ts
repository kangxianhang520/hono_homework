export type FieldCategory = "core" | "custom" | "sensitive";
export type FieldFilter = FieldCategory | "all";
export type FieldValueType =
	| "string"
	| "email"
	| "url"
	| "number"
	| "secret"
	| "textarea";

export type ProfileField = {
	key: string;
	label: string;
	value: string;
	type: FieldValueType;
	category: FieldCategory;
	source: "github" | "manual" | "custom";
	/** Read-only system fields cannot be edited or deleted */
	readOnly?: boolean;
};

export const FIELD_TYPE_LABEL: Record<FieldValueType, string> = {
	string: "String",
	email: "Email",
	url: "URL",
	number: "Number",
	secret: "Secret",
	textarea: "Textarea",
};

export const FIELD_TYPE_OPTIONS: { value: FieldValueType; label: string }[] = [
	{ value: "string", label: "文本 (String)" },
	{ value: "url", label: "网页链接 (URL)" },
	{ value: "number", label: "数值 (Number)" },
	{ value: "secret", label: "敏感凭证 (Secret)" },
	{ value: "textarea", label: "多行富文本" },
];

export const FIELD_SOURCE_META: Record<
	ProfileField["source"],
	{ label: string; dot: string }
> = {
	github: { label: "GitHub API", dot: "bg-secondary" },
	manual: { label: "手动录入", dot: "bg-primary" },
	custom: { label: "自定义扩展", dot: "bg-primary" },
};

export const FILTER_LABELS: Record<FieldFilter, string> = {
	all: "全部",
	core: "GitHub 核心字段",
	custom: "扩展自定义字段",
	sensitive: "敏感凭证",
};

export const MOCK_TOKEN = "ghp_984Kjsdf90234Nmsdpf23490sdklf2349001";

export const PROFILE = {
	login: "alexchen-dev",
	id: 29849203,
	node_id: "MDQ6VXNlcjI5ODQ5MjAz",
	avatar_url: "/assets/profile-sync/profile.jpg",
	name: "Alex Chen",
	company: "@TechNova Lab",
	blog: "https://alexchen.dev",
	location: "San Francisco, CA / 杭州",
	email: "alex.chen@example.com",
	hireable: true,
	bio: "Full Stack Engineer & OSS Contributor. Building high-performance developer tools, reactive runtime primitives, and cloud-native observability systems.",
	twitter_username: "alex_dev_tweets",
	public_repos: 42,
	public_gists: 8,
	followers: 1280,
	following: 184,
	created_at: "2017-03-12T08:14:22Z",
	updated_at: "2025-02-18T10:30:15Z",
} as const;

export type GitHubProfile = typeof PROFILE;

export const INITIAL_FIELDS: ProfileField[] = [
	{
		key: "login",
		label: "用户名",
		value: PROFILE.login,
		type: "string",
		category: "core",
		source: "github",
		readOnly: true,
	},
	{
		key: "email",
		label: "电子邮箱",
		value: PROFILE.email,
		type: "email",
		category: "core",
		source: "github",
	},
	{
		key: "bio",
		label: "个人简介",
		value:
			"Full Stack Engineer & OSS Contributor. Building high-performance developer tools.",
		type: "textarea",
		category: "core",
		source: "github",
	},
	{
		key: "blog",
		label: "博客/网站",
		value: PROFILE.blog,
		type: "url",
		category: "core",
		source: "github",
	},
	{
		key: "company",
		label: "所在公司",
		value: PROFILE.company,
		type: "string",
		category: "core",
		source: "github",
	},
	{
		key: "location",
		label: "所在地区",
		value: PROFILE.location,
		type: "string",
		category: "core",
		source: "github",
	},
	{
		key: "twitter_username",
		label: "社交 Twitter",
		value: PROFILE.twitter_username,
		type: "string",
		category: "core",
		source: "github",
	},
	{
		key: "gpg_key_id",
		label: "GPG 密钥指纹",
		value: "4A7D9B2E10F83C55",
		type: "secret",
		category: "sensitive",
		source: "manual",
	},
	{
		key: "internal_team",
		label: "团队归属备注",
		value: "Platform Architecture Core",
		type: "string",
		category: "custom",
		source: "custom",
	},
];
