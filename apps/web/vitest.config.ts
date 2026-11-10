import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 独立于 vite.config.ts:react-router / varlock 插件在 vitest 下不需要且会干扰。
export default defineConfig({
	resolve: {
		alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}"],
	},
});
