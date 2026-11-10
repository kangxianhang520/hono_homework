---

description: apps/server 后端 API 规范（Hono 4 + @hono/node-server、varlock 环境变量、zod 校验、统一错误格式、第三方 API 代理安全）
globs: apps/server/**
---

# 后端 API 规范（apps/server）

## 技术栈与运行

- Hono 4 运行在 Node.js 上（`@hono/node-server` 的 `serve`，端口 3000）；ESM（`"type": "module"`）。
- 开发：`pnpm --filter server dev`（`tsx watch src/index.ts`）；构建：`tsdown`，产物 `dist/index.mjs`。
- 类型检查：`pnpm run check-types`；格式化/Lint：`pnpm run check`（Biome，tab 缩进，自动整理 import）。
- 路径别名 `@/*` → `apps/server/src/*`。

## 目录结构

- `src/index.ts`：只做应用组装——全局中间件（`logger()`、`cors()`）、`app.route()` 挂载子路由、`app.onError` / `app.notFound`、`serve()` 启动。
- `src/routes/<domain>.ts`：按领域拆分路由，导出 `new Hono().basePath("/api/<domain>")` 子应用，在 `index.ts` 中 `app.route("/", sub)` 挂载。
- `src/<domain>/`：领域逻辑（如 `src/github/client.ts`、`schemas.ts`、`types.ts`），路由文件只做参数解析、调用领域函数、组装响应。
- `src/services.ts`：共享单例（如 `db = createDb(ENV)`），不要在路由内重复创建。
- 所有业务接口统一以 `/api/` 前缀开头；`GET /` 保留为健康检查（返回 `OK`）。

## 环境变量

- 通过 varlock 管理：在 `apps/server/.env.schema` 中声明（带 `@type`、`@sensitive` 等注解），然后运行 `pnpm --filter server env:generate` 重新生成 `src/env.ts`。
- `src/env.ts` 是自动生成文件，禁止手改；代码中统一 `import { ENV } from "./env.server"`（或 `@/env.server`），不要直接读 `process.env`。
- 密钥类变量保持 `@defaultSensitive=true`，不得写入日志或响应。

## 请求处理

- 入参（query / params / body / header）必须用 zod 校验；校验失败返回 400 与统一错误体。
- 鉴权类中间件（如 `requireToken`）解析 `Authorization: Bearer <token>`，校验格式后用 `c.set()` 写入上下文；为 Hono 实例声明 `Variables` 泛型以获得类型安全的 `c.get()`。
- 响应统一用 `c.json(data, status)`；成功响应直接返回业务数据对象，不额外包一层 `{ data }`（除非 spec 另有约定）。
- 响应类型（如 `GitHubSyncResponse`、`ApiErrorBody`）在 `src/<domain>/types.ts` 中导出，作为前后端契约。

## 错误处理

- 统一错误体：`{ "error": { "code": "UPPER_SNAKE_CASE", "message": "...", "retryAfter"?: number } }`。
- 领域错误定义为自定义 Error 类（如 `GitHubError { status, code, message, retryAfter? }`），在路由中直接 `throw`，由 `app.onError` 统一映射为对应 HTTP 状态码。
- 未知错误一律返回 500 `INTERNAL_ERROR`，不得泄露堆栈、上游原始 body 或任何凭证。
- 错误码使用 spec 中约定的枚举，新增错误码需同步更新 `specs/<feature>/design.md` 的接口契约。

## 调用第三方 API（代理）

- 使用原生 `fetch`，统一封装客户端（base URL、请求头、`AbortSignal.timeout(10_000)` 超时）；不要为少量端点引入重量级 SDK。
- 上游路径固定白名单，禁止把客户端传入的任意路径透传到上游（防 SSRF / 越权调用）。
- 上游响应用 zod schema 校验关键字段，需保留原始字段时用 `.passthrough()`。
- 将上游状态码与限流头（如 `x-ratelimit-remaining` / `x-ratelimit-reset`）映射为业务错误码（`TOKEN_INVALID`、`RATE_LIMITED`、`UPSTREAM_UNAVAILABLE` 等）。
- 可并行的上游请求用 `Promise.all`，保证一次响应是一致快照。

## 安全

- 用户凭证（如 GitHub PAT）只存在于单次请求生命周期：不落库、不缓存、不写日志、不回显到错误信息。
- `logger()` 只记录方法与路径；禁止 `console.log` 请求头或 token。
- CORS 只允许 `ENV.CORS_ORIGIN`；新增请求头（如 `Authorization`）时同步更新 `allowHeaders`，新增方法时同步更新 `allowMethods`。

## 数据库

- 需要持久化时通过 `src/services.ts` 中的 `db`（Drizzle，来自 `@my-better-t-app/db`）访问；schema 与 migration 在 `packages/db` 中维护，不在 `apps/server` 内定义表结构。

## 测试

- 路由测试优先使用 `app.request()`（Hono 内置）发起请求，不启动真实端口；对上游 `fetch` 做 mock，不调用真实第三方 API。

## 应用入口拆分（补充）

- 实际结构：`src/app.ts` 导出 `app`（全局中间件、CORS、`app.route()`、`onError` / `notFound` 在此组装）；`src/index.ts` 只负责 `serve({ fetch: app.fetch, port: 3000 })`。上文“`src/index.ts` 做应用组装”以此为准。
- 测试从 `@/app`（或 `../app`）导入 `app` 调用 `app.request()`，不要导入 `index.ts`（会启动真实端口）。
- `cors()` 中间件必须在带鉴权中间件的子路由之前注册，否则 OPTIONS 预检会被 `requireToken` 等拦截。
- 路由测试文件与路由同目录放置：`src/routes/<domain>.test.ts`。
