---

description: 安全规范：GitHub Token 处理、Hono 后端输入校验/错误/CORS、varlock 环境变量、Drizzle 查询与前端 XSS/存储
globs: apps/**/*.{ts,tsx}, packages/**/*.ts, **/.env.schema
---

# 安全规范

## 密钥与环境变量（varlock）

- 环境变量统一在各包 `.env.schema` 中声明（已设 `@defaultSensitive=true`、`@defaultRequired=true`），代码只通过 `ENV` 读取：server 从 `./env.server` 引入（含 `varlock/auto-load`），禁止直接读 `process.env`。
- `src/env.ts` 由 varlock 自动生成，禁止手改；新增变量改 `.env.schema` 后重新生成。
- 只有显式标注 `@public` 的变量可暴露给前端；web 端变量必须 `VITE_` 前缀，且绝不放任何密钥（`VITE_*` 会被打进客户端 bundle）。
- `.env`、`.env*.local` 已在 `.gitignore`，禁止提交真实值；`.env.schema` 只写空值或无害默认值。
- 禁止在源码、测试 fixture、spec 文档、日志中硬编码真实 Token / 数据库连接串；测试用明显的假值（如 `ghp_` + 固定占位字符）。

## GitHub Personal Access Token

- Token 只由客户端通过 `Authorization: Bearer <token>` 发送，服务端不持久化（不写库、不写文件、不放入全局/模块级变量缓存），仅在单次请求中经 `c.set("token", ...)` 传递。
- `requireToken` 中间件必须做格式校验（`/^[A-Za-z0-9_]{20,255}$/`），缺失或非法直接返回 400 `TOKEN_MISSING`，不得转发到上游。
- 禁止在任何日志、错误 message、响应体中输出 Token（包括部分截断）；`logger()` 保持只打印方法与路径，不新增打印请求头的中间件。
- 禁止通过 query string / URL path 传递 Token。
- 前端 Token 只存 `sessionStorage`（键 `ghsync:pat`），禁止 `localStorage` / cookie 持久化；提供 `clear()` 一键清除 Token 与快照；读写均 try/catch 降级为内存。
- 输入框使用 `type="password"` + `autoComplete="off"`，不在 URL、页面标题或 Toast 中回显 Token。

## 上游代理（SSRF 防护）

- 服务端调用 GitHub 只允许固定基址 `https://api.github.com` + 代码内常量路径，禁止把客户端传入的 path/URL/host 拼接进上游请求。
- 所有上游 `fetch` 必须带超时（`AbortSignal.timeout(10_000)`），超时/网络错误映射为 `UPSTREAM_UNAVAILABLE`。
- 上游响应用 zod 校验关键字段后再返回；只透传约定字段与必要头（如 `x-oauth-scopes`），不原样转发上游响应头。

## Hono 后端

- 所有外部输入（headers、query、params、body）用 zod 校验后再使用；校验失败返回 400 与统一错误体 `{ error: { code, message } }`。
- `app.onError` 统一处理异常：已知错误映射到对应状态码；未知错误返回 500 `INTERNAL_ERROR`，不得泄露堆栈、内部路径、SQL 或上游原始错误信息。
- CORS 仅允许 `ENV.CORS_ORIGIN`，禁止 `origin: "*"`（尤其是携带 `Authorization` 时）；`allowHeaders` 只列必要项（`Authorization`、`Content-Type`），`allowMethods` 按需最小化。
- 不信任客户端提供的身份或权限字段；需要鉴权的路由必须挂中间件，而不是在 handler 内零散判断。
- 新增写操作接口时考虑请求体大小限制（`hono/body-limit`）与限流。

## 数据库（Drizzle / PostgreSQL）

- 使用 Drizzle 查询构建器或 `sql` 模板标签（自动参数化），禁止用字符串拼接构造 SQL，禁止 `sql.raw()` 处理用户输入。
- `DATABASE_URL` 仅在 server / db 包中使用，绝不暴露给 web。
- 不在数据库中存储 GitHub Token；如未来必须存储敏感字段，须加密存储并在 spec 中说明。
- schema 变更通过 drizzle migration 管理，迁移文件需 review 后提交。

## 前端（React Router / React）

- 渲染用户或 GitHub 返回的数据（bio、blog、name 等）一律走 JSX 文本转义，禁止 `dangerouslySetInnerHTML`；如确需渲染 HTML/Markdown 须先 sanitize。
- 外部链接（如 `blog`、`html_url`）只允许 `http:`/`https:` 协议，禁止 `javascript:` 等；新窗口打开加 `rel="noopener noreferrer"`。
- 错误展示只用错误码查表映射文案，不直接渲染服务端/上游原始 message。
- 「导出 JSON」等功能导出的快照不得包含 Token。

## 依赖与检查

- 依赖统一 `pnpm` 安装，提交 `pnpm-lock.yaml`；不引入来源不明或长期无人维护的包。
- 提交前运行 `pnpm run check`（Biome）与 `pnpm run check-types`；涉及鉴权/Token/上游请求的改动需在测试中覆盖缺失 Token、无效 Token、超时等用例。
