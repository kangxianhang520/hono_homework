import { describe, expect, it } from "vitest";

import type { GitHubEmail, GitHubSyncResponse, GitHubUser } from "../api/types";
import { normalizeBlogUrl, toProfileViewModel } from "./profile-view-model";

function makeUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
	return {
		login: "octocat",
		id: 1,
		avatar_url: "https://avatars.githubusercontent.com/u/1",
		name: "The Octocat",
		company: "@github",
		blog: "https://github.blog",
		location: "San Francisco",
		email: null,
		bio: "Hello",
		twitter_username: null,
		public_repos: 8,
		followers: 1200,
		following: 9,
		created_at: "2011-01-25T18:44:36Z",
		...overrides,
	};
}

function makeSync(
	user: Partial<GitHubUser> = {},
	emails: GitHubEmail[] = [],
): GitHubSyncResponse {
	return {
		user: makeUser(user),
		emails,
		rateLimit: { limit: 5000, remaining: 4999, used: 1, reset: 0 },
		scopes: [],
		fetchedAt: "2026-11-09T00:00:00Z",
	};
}

const email = (primary: boolean, verified: boolean): GitHubEmail => ({
	email: `${primary ? "p" : "s"}@example.com`,
	primary,
	verified,
	visibility: null,
});

describe("toProfileViewModel", () => {
	it("maps a fully populated user", () => {
		const vm = toProfileViewModel(makeSync());
		expect(vm).toMatchObject({
			login: "octocat",
			displayName: "The Octocat",
			bio: "Hello",
			company: "@github",
			location: "San Francisco",
			joinedAt: "2011-01-25",
			blog: { href: "https://github.blog/", host: "github.blog" },
			stats: { repos: 8, followers: 1200, following: 9 },
		});
	});

	it("normalizes all-null fields without throwing", () => {
		const vm = toProfileViewModel(
			makeSync({
				name: null,
				bio: null,
				company: null,
				location: null,
				blog: null,
			}),
		);
		expect(vm.displayName).toBe("octocat");
		expect(vm.bio).toBeNull();
		expect(vm.company).toBeNull();
		expect(vm.location).toBeNull();
		expect(vm.blog).toBeNull();
		expect(vm.isPro).toBe(false);
		expect(vm.hasVerifiedEmail).toBe(false);
	});

	it("treats empty / whitespace strings as missing", () => {
		const vm = toProfileViewModel(
			makeSync({ name: "  ", bio: "", company: " \n", location: "", blog: "" }),
		);
		expect(vm.displayName).toBe("octocat");
		expect(vm.bio).toBeNull();
		expect(vm.company).toBeNull();
		expect(vm.location).toBeNull();
		expect(vm.blog).toBeNull();
	});

	it("falls back to 0 for missing numeric stats", () => {
		const user = makeUser();
		const raw = {
			...user,
			public_repos: undefined,
			followers: undefined,
			following: undefined,
		} as unknown as GitHubUser;
		const vm = toProfileViewModel({ ...makeSync(), user: raw });
		expect(vm.stats).toEqual({ repos: 0, followers: 0, following: 0 });
	});

	it("tolerates missing emails array", () => {
		const s = {
			...makeSync(),
			emails: undefined,
		} as unknown as GitHubSyncResponse;
		expect(toProfileViewModel(s).hasVerifiedEmail).toBe(false);
	});

	it("returns empty joinedAt for malformed created_at", () => {
		expect(toProfileViewModel(makeSync({ created_at: "" })).joinedAt).toBe("");
	});

	describe("PRO badge", () => {
		it.each([
			["pro", true],
			["PRO", true],
			["Pro", true],
			["free", false],
			["pro_plus", false],
		])("plan.name=%s → isPro=%s", (name, expected) => {
			expect(toProfileViewModel(makeSync({ plan: { name } })).isPro).toBe(
				expected,
			);
		});

		it("missing plan (token lacks permission) → not PRO", () => {
			expect(toProfileViewModel(makeSync({ plan: undefined })).isPro).toBe(
				false,
			);
		});
	});

	describe("Verified Email badge (primary && verified)", () => {
		it("primary + verified → true", () => {
			const vm = toProfileViewModel(makeSync({}, [email(true, true)]));
			expect(vm.hasVerifiedEmail).toBe(true);
		});

		it("only secondary verified, primary unverified → false", () => {
			const vm = toProfileViewModel(
				makeSync({}, [email(true, false), email(false, true)]),
			);
			expect(vm.hasVerifiedEmail).toBe(false);
		});

		it("primary unverified only → false", () => {
			const vm = toProfileViewModel(makeSync({}, [email(true, false)]));
			expect(vm.hasVerifiedEmail).toBe(false);
		});

		it("empty emails → false", () => {
			expect(toProfileViewModel(makeSync({}, [])).hasVerifiedEmail).toBe(false);
		});
	});
});

describe("normalizeBlogUrl", () => {
	it.each([null, undefined, "", "   "])("%j → null", (raw) => {
		expect(normalizeBlogUrl(raw)).toBeNull();
	});

	it.each([
		["example.com", "https://example.com/", "example.com"],
		["  example.com/blog  ", "https://example.com/blog", "example.com"],
		["//example.com", "https://example.com/", "example.com"],
		["http://example.com", "http://example.com/", "example.com"],
		[
			"https://sub.example.com/a?b=1",
			"https://sub.example.com/a?b=1",
			"sub.example.com",
		],
		["HTTPS://Example.com", "https://example.com/", "example.com"],
		["localhost:8080", "https://localhost:8080/", "localhost:8080"],
		[
			"example.com:3000/path",
			"https://example.com:3000/path",
			"example.com:3000",
		],
	])("%s → %s", (raw, href, host) => {
		expect(normalizeBlogUrl(raw)).toEqual({ href, host });
	});

	it.each([
		"javascript:alert(1)",
		"JavaScript:alert(1)",
		"data:text/html,<script>alert(1)</script>",
		"vbscript:msgbox(1)",
		"ftp://example.com",
		"mailto:a@example.com",
		"https://",
		"http://exa mple.com",
	])("rejects %s", (raw) => {
		expect(normalizeBlogUrl(raw)).toBeNull();
	});
});
