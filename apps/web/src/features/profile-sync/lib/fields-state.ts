import type { GitHubUser } from "../api/types";
import { categoryOf, type FieldFilter, type ProfileField } from "../data";
import { buildCoreFields } from "./field-values";

// 纯状态逻辑（reducer + 派生选择器），不依赖 React / env，便于单元测试。

export type PersistedFields = { custom: ProfileField[]; hiddenKeys: string[] };
export const EMPTY_PERSISTED: PersistedFields = { custom: [], hiddenKeys: [] };

export type FieldsState = {
	/** 由 snapshot 派生，不持久化 */
	core: ProfileField[];
	custom: ProfileField[];
	hiddenKeys: string[];
	/** keys currently playing the exit animation */
	removing: string[];
	filter: FieldFilter;
	query: string;
};

export type Action =
	| { type: "syncCore"; user: GitHubUser }
	| { type: "hydrate"; persisted: PersistedFields }
	| { type: "add"; field: ProfileField }
	| { type: "update"; key: string; value: string }
	| { type: "markRemoving"; key: string }
	| { type: "remove"; key: string }
	| { type: "hide"; key: string }
	| { type: "restore"; key: string | "all" }
	| { type: "setFilter"; filter: FieldFilter }
	| { type: "setQuery"; query: string }
	| { type: "reset" };

/** 自定义 KEY 与核心 KEY 冲突时保留核心字段，自定义 KEY 加 `_custom` 后缀。 */
function resolveConflicts(
	custom: ProfileField[],
	core: ProfileField[],
): ProfileField[] {
	if (core.length === 0) return custom;
	const taken = new Set(core.map((f) => f.key.toLowerCase()));
	for (const f of custom) taken.add(f.key.toLowerCase());
	let changed = false;
	const coreKeys = new Set(core.map((f) => f.key.toLowerCase()));
	const next = custom.map((f) => {
		if (!coreKeys.has(f.key.toLowerCase())) return f;
		let key = `${f.key}_custom`;
		while (taken.has(key.toLowerCase())) key = `${key}_custom`;
		taken.add(key.toLowerCase());
		changed = true;
		return { ...f, key };
	});
	return changed ? next : custom;
}

function sanitizeHidden(hiddenKeys: string[], core: ProfileField[]): string[] {
	if (core.length === 0) return hiddenKeys;
	const hideable = new Set(core.filter((f) => !f.readOnly).map((f) => f.key));
	return hiddenKeys.filter((k) => hideable.has(k));
}

export const initialState = (filter: FieldFilter = "all"): FieldsState => ({
	core: [],
	custom: [],
	hiddenKeys: [],
	removing: [],
	filter,
	query: "",
});

export function reducer(state: FieldsState, action: Action): FieldsState {
	switch (action.type) {
		case "syncCore": {
			const core = buildCoreFields(action.user);
			return {
				...state,
				core,
				custom: resolveConflicts(state.custom, core),
				hiddenKeys: sanitizeHidden(state.hiddenKeys, core),
			};
		}
		case "hydrate": {
			const custom = resolveConflicts(action.persisted.custom, state.core);
			return {
				...state,
				custom,
				hiddenKeys: sanitizeHidden(action.persisted.hiddenKeys, state.core),
			};
		}
		case "add":
			return { ...state, custom: [...state.custom, action.field] };
		case "update": {
			const apply = (f: ProfileField) =>
				f.key === action.key && !f.readOnly ? { ...f, value: action.value } : f;
			return {
				...state,
				core: state.core.map(apply),
				custom: state.custom.map(apply),
			};
		}
		case "markRemoving":
			return { ...state, removing: [...state.removing, action.key] };
		case "remove":
			return {
				...state,
				custom: state.custom.filter((f) => f.key !== action.key),
				removing: state.removing.filter((k) => k !== action.key),
			};
		case "hide": {
			const target = state.core.find((f) => f.key === action.key);
			if (!target || target.readOnly || state.hiddenKeys.includes(action.key))
				return state;
			return { ...state, hiddenKeys: [...state.hiddenKeys, action.key] };
		}
		case "restore":
			return {
				...state,
				hiddenKeys:
					action.key === "all"
						? []
						: state.hiddenKeys.filter((k) => k !== action.key),
			};
		case "setFilter":
			return { ...state, filter: action.filter };
		case "setQuery":
			return { ...state, query: action.query };
		case "reset":
			return { ...initialState(state.filter), query: state.query };
	}
}

/** 参与计数/检索的字段：未屏蔽的核心字段 + 全部自定义字段。 */
export function selectAllFields(
	core: ProfileField[],
	custom: ProfileField[],
	hiddenKeys: string[],
): ProfileField[] {
	return [...core.filter((f) => !hiddenKeys.includes(f.key)), ...custom];
}

export function selectHiddenCoreFields(
	core: ProfileField[],
	hiddenKeys: string[],
): ProfileField[] {
	return core.filter((f) => hiddenKeys.includes(f.key));
}

/** Tab 计数（入参应已排除屏蔽字段）。 */
export function countFields(
	fields: ProfileField[],
): Record<FieldFilter, number> {
	const result: Record<FieldFilter, number> = {
		all: 0,
		core: 0,
		custom: 0,
		sensitive: 0,
	};
	for (const field of fields) {
		result.all++;
		result[categoryOf(field)]++;
	}
	return result;
}

/** 按 Tab + 关键字过滤；关键字匹配 key/label/value，secret 不匹配 value。 */
export function filterFields(
	fields: ProfileField[],
	filter: FieldFilter,
	query: string,
): ProfileField[] {
	const q = query.trim().toLowerCase();
	return fields.filter((field) => {
		const category = categoryOf(field);
		const matchCategory = filter === "all" || category === filter;
		const matchQuery =
			!q ||
			field.key.toLowerCase().includes(q) ||
			field.label.toLowerCase().includes(q) ||
			(category !== "sensitive" && field.value.toLowerCase().includes(q));
		return matchCategory && matchQuery;
	});
}
