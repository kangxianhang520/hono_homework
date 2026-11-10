import { describe, expect, it } from "vitest";

import type { GitHubUser } from "../api/types";
import type { FieldValueType } from "../data";
import {
	buildCoreFields,
	defaultValueFor,
	validateValue,
} from "./field-values";

describe("validateValue", () => {
	it.each([
		["string", "", null],
		["string", "anything", null],
		["secret", "", null],
		["secret", "ghp_xxx", null],
	] as const)("%s 类型不校验内容（%j）", (type, raw, expected) => {
		expect(validateValue(type, raw)).toBe(expected);
	});

	describe("number", () => {
		it.each(["0", "42", "-3.5", "1e3", " 7 "])("合法：%j", (raw) => {
			expect(validateValue("number", raw)).toBeNull();
		});
		it.each(["", "   ", "abc", "12px", "NaN", "Infinity", "-Infinity"])(
			"非法：%j",
			(raw) => {
				expect(validateValue("number", raw)).toBe("请输入有效的数字");
			},
		);
	});

	describe("boolean", () => {
		it.each(["true", "false"])("合法：%j", (raw) => {
			expect(validateValue("boolean", raw)).toBeNull();
		});
		it.each(["", "TRUE", "True", "1", "0", "yes", " true"])(
			"非法：%j",
			(raw) => {
				expect(validateValue("boolean", raw)).toBe(
					"布尔值只能是 true 或 false",
				);
			},
		);
	});

	describe("json", () => {
		it.each(["{}", "[]", '{"a":1}', "1", '"s"', "null", "true"])(
			"合法：%j",
			(raw) => {
				expect(validateValue("json", raw)).toBeNull();
			},
		);
		it.each(["", "{", "{a:1}", "{'a':1}", "undefined"])("非法：%j", (raw) => {
			expect(validateValue("json", raw)).toBe("不是合法的 JSON");
		});
	});

	describe("date", () => {
		it.each(["2024-01-31", "2024-02-29", "1999-12-31"])("合法：%j", (raw) => {
			expect(validateValue("date", raw)).toBeNull();
		});
		it.each([
			"",
			"2024-1-01",
			"2024/01/01",
			"2024-01-01T00:00:00Z",
			"2023-02-29", // 非闰年
			"2024-02-30",
			"2024-13-01",
			"2024-00-10",
			"2024-04-31",
		])("非法：%j", (raw) => {
			expect(validateValue("date", raw)).toBe("请输入有效日期（YYYY-MM-DD）");
		});
	});
});

describe("defaultValueFor", () => {
	it.each([
		"string",
		"number",
		"boolean",
		"json",
		"date",
		"secret",
	] as FieldValueType[])("%s 默认值可通过 validateValue", (type) => {
		expect(validateValue(type, defaultValueFor(type))).toBeNull();
	});
});

describe("buildCoreFields", () => {
	const user = {
		login: "octocat",
		id: 1,
		email: null,
		bio: "",
		blog: "https://github.blog",
		company: null,
		location: "SF",
		twitter_username: null,
	} as unknown as GitHubUser;

	it("生成 7 个 github 来源 string 字段，null 归一为空串，仅 login 只读", () => {
		const fields = buildCoreFields(user);
		expect(fields.map((f) => f.key)).toEqual([
			"login",
			"email",
			"bio",
			"blog",
			"company",
			"location",
			"twitter_username",
		]);
		for (const f of fields) {
			expect(f.source).toBe("github");
			expect(f.type).toBe("string");
		}
		expect(fields.filter((f) => f.readOnly).map((f) => f.key)).toEqual([
			"login",
		]);
		expect(fields.find((f) => f.key === "email")?.value).toBe("");
		expect(fields.find((f) => f.key === "blog")?.value).toBe(
			"https://github.blog",
		);
	});
});
