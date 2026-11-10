---

description: 测试与验证规范：当前以类型检查 + Biome 为质量门禁，新增测试时统一用 Vitest，Hono 路由用 app.request() 测试
globs: ["**/*.test.ts", "**/_.test.tsx", "**/_.spec.ts", "**/*.spec.tsx", "apps/**/src/**/*.{ts,tsx}", "packages/**/src/**/*.ts"]
---

# 测试规范

## 现状（以实际配置为准）

- 仓库**尚未配置单元测试框架**：没有 vitest/jest/playwright 依赖，也没有 `*.test.*` 文件，turbo.json 中没有 `test` 任务。
- 当前质量门禁 = 类型检查 + Biome：
  - `pnpm run check-types`：turbo 跑各包 `check-types`（server: `tsc --noEmit`；web: `react-router typegen && tsc --noEmit`）
  - `pnpm run check`：`biome check --write .`（格式化 + lint + organizeImports，会**改写文件**）
- 根 `package.json` 里有 `visual:test`（backstopjs）和 `visual:reference` 脚本，但 `backstop.config.cjs`、`scripts/visual/` 目前不存在，跑之前先确认文件存在，不要当成可用门禁。

## 每个任务完成前必须通过

1. `pnpm run check-types`：零错误。不要用 `any`、`@ts-ignore`、`@ts-expect-error` 来压错误。
2. `pnpm run check`：跑完后看 diff，确认 Biome 的自动修改合理，再提交。
3. 改了后端：`pnpm run dev:server` 起服务，用 curl 访问改动的路由，确认状态码和响应体（含错误分支）。
4. 改了前端：`pnpm run dev:web` 打开页面，手动走一遍改动的交互，同时看浏览器控制台没有报错。

## 新增测试时的约定

需要写自动化测试时，按下面的方式来，不要每个人各引一套：

- **框架**：统一用 Vitest（和 Vite 同生态，web 端能复用 Vite 配置）。在需要测试的包里加 `vitest` devDependency 和 `"test": "vitest run"` 脚本，再在 `turbo.json` 加 `test` 任务（`dependsOn: ["^build"]`），这样根目录能用 `turbo run test` 统一跑。
- **文件位置**：测试和源码放在一起，命名 `<name>.test.ts(x)`，不另建 `__tests__` 目录。
- **后端（Hono）**：
  - 把 `app` 从入口拆出来导出（`serve()` 留在入口文件），测试中直接用 `app.request("/path", init)`，不要真的监听端口。
  - 断言要覆盖状态码、响应 JSON 结构，以及 CORS / 参数校验失败等错误分支。
  - 调用外部 HTTP（如 GitHub API）时 mock `fetch`（`vi.stubGlobal("fetch", ...)` 或注入 fetcher），测试里不发真实网络请求，也不依赖真实 token。
- **前端（React Router + React）**：组件/hook 测试用 `@testing-library/react` + `jsdom`，按用户可见行为断言（role、文本），不断言实现细节或 className；数据请求在网络层 mock。
- **数据库（Drizzle / PostgreSQL）**：单元测试不连真实数据库，把查询放在 service 函数里然后 mock 掉。确实需要集成测试时，用 `pnpm run db:start` 起的本地库，并且每个测试自己准备和清理数据。
- **环境变量**：env 由 varlock 生成（`env.ts` / `env.server.ts`），测试中通过 mock 模块或设置 `process.env` 提供，不要读开发者本地的 `.env`。

## 服务端测试现状（已落地，优先于上文"尚未配置"的描述）

- `apps/server` 已接入 Vitest：`package.json` 有 `"test": "vitest run"`（devDependency `vitest`），`turbo.json` 已有 `test` 任务；没有单独的 `vitest.config.*`，用默认配置。
- 运行：`pnpm -F server test`（或 `turbo run test -F server`）。web / packages 目前仍无测试。
- 已有用例 `apps/server/src/routes/github.test.ts` 作为参考写法：
  - 入口已拆为 `app.ts`（导出 app）+ `index.ts`（仅 `serve()`），测试只导入 `app.ts`。
  - 先 `vi.mock("../env.server", () => ({ ENV: {...} }))`，再 `await import("../app")`，避免 varlock 校验本地 `.env`。
  - `vi.stubGlobal("fetch", ...)` 必须配 `afterEach(() => vi.unstubAllGlobals())`。
  - 超时不要用 fake timers 推进 `AbortSignal.timeout`，让 mock fetch 直接 reject `new DOMException("...", "TimeoutError")`。
  - 带鉴权中间件的路由要补 OPTIONS 预检用例；GitHub 403 需区分限流（`x-ratelimit-remaining: 0`）与缺 scope，`/user/emails` 的 404 也按缺 scope 覆盖。
- 改了 `apps/server` 时，完成前除类型检查外还需 `pnpm -F server test` 全绿。

## 禁止

- 为了让检查通过而删除或跳过已有测试（`it.skip`、`describe.only` 不能提交）。
- 测试之间共享可变状态，或依赖执行顺序。
- 没实际跑过就说"测试通过"或"类型检查通过"。
