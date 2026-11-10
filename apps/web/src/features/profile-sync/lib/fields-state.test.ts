import { describe, expect, it } from "vitest";

import type { GitHubUser } from "../api/types";
import type { ProfileField } from "../data";
import {
	countFields,
	type FieldsState,
	filterFields,
	initialState,
	reducer,
	selectAllFields,
	selectHiddenCoreFields,
} from "./fields-state";

function makeUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
	return {
		login: "octocat",
		id: 1,
		email: "octo@example.com",
		bio: "Hello world",
		blog: "https://github.blog",
		company: "@github",
		location: "San Francisco",
		twitter_username: null,
		...overrides,
	} as unknown as GitHubUser;
}

function custom(
	key: string,
	overrides: Partial<ProfileField> = {},
): ProfileField {
	return {
		key,
		label: key,
		type: "string",
		source: "custom",
		value: "",
		...overrides,
	};
}

const synced = (user = makeUser(), base = initialState()): FieldsState =>
	reducer(base, { type: "syncCore", user });

const fieldValueOf = (state: FieldsState, key: string) =>
	[...state.core, ...state.custom].find((f) => f.key === key)?.value;

/** 与 hook 一致的派生流程 */
function derive(state: FieldsState) {
	const all = selectAllFields(state.core, state.custom, state.hiddenKeys);
	return {
		all,
		counts: countFields(all),
		visible: filterFields(all, state.filter, state.query),
		hidden: selectHiddenCoreFields(state.core, state.hiddenKeys),
	};
}

describe("reducer: syncCore", () => {
	it("用 GitHub 数据生成核心字段", () => {
		const state = synced();
		expect(state.core).toHaveLength(7);
		expect(fieldValueOf(state, "login")).toBe("octocat");
		expect(fieldValueOf(state, "twitter_username")).toBe("");
	});

	it("再次同步整体覆盖核心字段的本地编辑（F-004 覆盖语义）", () => {
		let state = synced();
		state = reducer(state, { type: "update", key: "bio", value: "local edit" });
		expect(fieldValueOf(state, "bio")).toBe("local edit");

		state = reducer(state, {
			type: "syncCore",
			user: makeUser({ bio: "remote bio" }),
		});
		expect(fieldValueOf(state, "bio")).toBe("remote bio");
	});

	it("同步不影响自定义字段及其编辑", () => {
		let state = synced();
		state = reducer(state, {
			type: "add",
			field: custom("nickname", { value: "a" }),
		});
		state = reducer(state, { type: "update", key: "nickname", value: "b" });
		state = reducer(state, { type: "syncCore", user: makeUser({ bio: "x" }) });
		expect(state.custom).toEqual([custom("nickname", { value: "b" })]);
	});

	it("同步保留屏蔽状态，并丢弃不可屏蔽的 key（login/未知 key）", () => {
		let state = reducer(initialState(), {
			type: "hydrate",
			persisted: { custom: [], hiddenKeys: ["bio", "login", "ghost"] },
		});
		// 尚无核心字段时不做清洗
		expect(state.hiddenKeys).toEqual(["bio", "login", "ghost"]);
		state = synced(makeUser(), state);
		expect(state.hiddenKeys).toEqual(["bio"]);
	});

	it("自定义 KEY 与核心 KEY 冲突时保留核心字段，自定义加 _custom 后缀", () => {
		let state = reducer(initialState(), {
			type: "hydrate",
			persisted: {
				custom: [
					custom("Blog", { value: "mine" }),
					custom("blog_custom", { value: "taken" }),
				],
				hiddenKeys: [],
			},
		});
		state = synced(makeUser(), state);
		expect(state.custom.map((f) => f.key)).toEqual([
			"Blog_custom_custom",
			"blog_custom",
		]);
		expect(fieldValueOf(state, "blog")).toBe("https://github.blog");
		expect(fieldValueOf(state, "Blog_custom_custom")).toBe("mine");
	});

	it("update 不能修改只读的 login", () => {
		const state = reducer(synced(), {
			type: "update",
			key: "login",
			value: "hacker",
		});
		expect(fieldValueOf(state, "login")).toBe("octocat");
	});
});

describe("reducer: hide / restore", () => {
	it("屏蔽核心字段后进入 hiddenKeys，重复屏蔽幂等", () => {
		let state = reducer(synced(), { type: "hide", key: "bio" });
		const again = reducer(state, { type: "hide", key: "bio" });
		expect(again).toBe(state);
		state = reducer(state, { type: "hide", key: "company" });
		expect(state.hiddenKeys).toEqual(["bio", "company"]);
		expect(derive(state).hidden.map((f) => f.key)).toEqual(["bio", "company"]);
	});

	it("login、自定义字段、不存在的 key 不可屏蔽（no-op）", () => {
		let state = reducer(synced(), { type: "add", field: custom("note") });
		for (const key of ["login", "note", "nope"]) {
			expect(reducer(state, { type: "hide", key })).toBe(state);
		}
		state = reducer(state, { type: "hide", key: "bio" });
		expect(state.hiddenKeys).toEqual(["bio"]);
	});

	it("逐个恢复与全部恢复", () => {
		let state = synced();
		for (const key of ["bio", "blog", "email"])
			state = reducer(state, { type: "hide", key });

		state = reducer(state, { type: "restore", key: "blog" });
		expect(state.hiddenKeys).toEqual(["bio", "email"]);

		state = reducer(state, { type: "restore", key: "all" });
		expect(state.hiddenKeys).toEqual([]);
		expect(derive(state).hidden).toEqual([]);
	});

	it("屏蔽不丢失字段值，恢复后原值仍在", () => {
		let state = reducer(synced(), { type: "update", key: "bio", value: "v2" });
		state = reducer(state, { type: "hide", key: "bio" });
		state = reducer(state, { type: "restore", key: "bio" });
		expect(fieldValueOf(state, "bio")).toBe("v2");
	});

	it("remove 只删自定义字段，核心字段需走 hide", () => {
		let state = reducer(synced(), { type: "add", field: custom("note") });
		state = reducer(state, { type: "markRemoving", key: "note" });
		expect(state.removing).toEqual(["note"]);
		state = reducer(state, { type: "remove", key: "note" });
		expect(state.custom).toEqual([]);
		expect(state.removing).toEqual([]);

		const after = reducer(state, { type: "remove", key: "bio" });
		expect(after.core).toHaveLength(7);
	});

	it("reset 清空数据但保留 filter / query", () => {
		let state = reducer(synced(makeUser(), initialState("custom")), {
			type: "add",
			field: custom("note"),
		});
		state = reducer(state, { type: "hide", key: "bio" });
		state = reducer(state, { type: "setQuery", query: "abc" });
		state = reducer(state, { type: "reset" });
		expect(state).toEqual({ ...initialState("custom"), query: "abc" });
	});
});

describe("计数", () => {
	it("初始同步后：7 个核心字段", () => {
		expect(derive(synced()).counts).toEqual({
			all: 7,
			core: 7,
			custom: 0,
			sensitive: 0,
		});
	});

	it("新增 secret 字段计入敏感凭证，其他自定义类型计入扩展字段（AC-003）", () => {
		let state = synced();
		state = reducer(state, {
			type: "add",
			field: custom("token", { type: "secret", value: "s" }),
		});
		state = reducer(state, {
			type: "add",
			field: custom("age", { type: "number", value: "3" }),
		});
		expect(derive(state).counts).toEqual({
			all: 9,
			core: 7,
			custom: 1,
			sensitive: 1,
		});
	});

	it("屏蔽核心字段后计数减少，恢复后还原（AC-006）", () => {
		let state = reducer(synced(), { type: "hide", key: "bio" });
		state = reducer(state, { type: "hide", key: "blog" });
		expect(derive(state).counts).toMatchObject({ all: 5, core: 5 });
		expect(derive(state).all.map((f) => f.key)).not.toContain("bio");

		state = reducer(state, { type: "restore", key: "all" });
		expect(derive(state).counts).toMatchObject({ all: 7, core: 7 });
	});

	it("计数不受 filter / query 影响", () => {
		let state = reducer(synced(), { type: "setFilter", filter: "custom" });
		state = reducer(state, { type: "setQuery", query: "zzz-no-match" });
		const { counts, visible } = derive(state);
		expect(visible).toEqual([]);
		expect(counts.all).toBe(7);
	});
});

describe("搜索与筛选", () => {
	const base = () => {
		let state = synced();
		state = reducer(state, {
			type: "add",
			field: custom("api_token", {
				label: "API Token",
				type: "secret",
				value: "SuperSecretValue",
			}),
		});
		state = reducer(state, {
			type: "add",
			field: custom("hobby", { label: "爱好", value: "Climbing" }),
		});
		return state;
	};
	const search = (state: FieldsState, query: string) =>
		derive(reducer(state, { type: "setQuery", query })).visible.map(
			(f) => f.key,
		);

	it("匹配 key / label，忽略大小写与首尾空白", () => {
		expect(search(base(), "  HOBBY ")).toEqual(["hobby"]);
		expect(search(base(), "爱好")).toEqual(["hobby"]);
		expect(search(base(), "所在公司")).toEqual(["company"]);
	});

	it("匹配非 secret 字段的 value", () => {
		expect(search(base(), "climbing")).toEqual(["hobby"]);
		expect(search(base(), "san francisco")).toEqual(["location"]);
	});

	it("secret 字段不按 value 匹配，但仍可按 key/label 搜到", () => {
		expect(search(base(), "supersecret")).toEqual([]);
		expect(search(base(), "api token")).toEqual(["api_token"]);
	});

	it("已屏蔽字段不出现在搜索结果中", () => {
		const state = reducer(base(), { type: "hide", key: "location" });
		expect(search(state, "san francisco")).toEqual([]);
	});

	it("空查询返回当前 Tab 的全部字段；Tab 与查询取交集", () => {
		let state = reducer(base(), { type: "setFilter", filter: "sensitive" });
		expect(derive(state).visible.map((f) => f.key)).toEqual(["api_token"]);

		state = reducer(state, { type: "setFilter", filter: "core" });
		state = reducer(state, { type: "setQuery", query: "o" });
		const keys = derive(state).visible.map((f) => f.key);
		expect(keys).not.toContain("hobby");
		expect(keys.every((k) => state.core.some((f) => f.key === k))).toBe(true);
		expect(keys).toContain("login");
	});
});
