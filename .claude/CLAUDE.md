# my-better-t-app (hono_homework)

基于 Better-T-Stack 的 Turborepo monorepo：`apps/web` React Router 前端 + `apps/server` Hono 后端 + `packages/db|ui|config` 共享包。
需求见 `docs/prd.md`，功能规格见 `specs/`（如 `1.github-api-proxy`、`2.token-auth-sync`、`3.profile-overview`、`4.dynamic-field-manager`，总计划 `specs/PLAN.md`）。

## 技术栈

- 语言：TypeScript（ESM，`"type": "module"`）
- 前端：React Router v8 (Vite) + TailwindCSS + shadcn/ui（共享组件在 `packages/ui`）
- 后端：Hono 4 + `@hono/node-server`（Node.js，`tsx watch` 开发，`tsdown` 构建）
- 数据库：Drizzle ORM + PostgreSQL（`packages/db`）
- 校验/环境：zod + Varlock（各包 `.env.schema` → 生成 `src/env.ts`）
- 工程：pnpm 11 workspaces + Turborepo；Biome 负责 lint/format

## 常用命令

```bash
pnpm install            # 安装依赖（postinstall 会执行 varlock codegen）
pnpm run dev            # 同时启动 web(:5173) + server(:3000)
pnpm run dev:web        # 仅前端
pnpm run dev:server     # 仅后端
pnpm run build          # 全量构建
pnpm run check-types    # 类型检查（当前作为测试门禁）
pnpm -F server test     # 后端单测（vitest run）
pnpm run check          # Biome lint + format（--write）
pnpm run env:generate   # 修改 .env.schema 后重新生成 env.ts
pnpm run db:push        # 推送 schema 到数据库（另有 db:generate/db:migrate/db:studio）
```

## 目录结构

```
apps/
  web/src/          # 前端：root.tsx, routes.ts, routes/, features/, components/, hooks/, lib/
  server/src/       # 后端：index.ts (Hono 入口), services.ts, env.ts
packages/
  db/src/           # Drizzle：schema/, relations.ts, migrations/, index.ts
  ui/src/           # 共享 shadcn/ui：components/, hooks/, lib/, styles/globals.css
  config/           # 共享 tsconfig 等配置
specs/              # 各 feature 的 requirements/design/tasks
docs/prd.md         # 原始需求
biome.json turbo.json pnpm-workspace.yaml
```

## 关键约定

- 包名前缀 `@my-better-t-app/*`，跨包引用使用 `workspace:*`；共享依赖版本走 `pnpm-workspace.yaml` 的 catalog。
- 共享 UI 组件导入：`import { Button } from "@my-better-t-app/ui/components/button"`。
- 应用代码通过生成的 `ENV` 读取环境变量，不直接读 `process.env`；`env.ts` 为生成文件，勿手改。
- 提交前确保 `pnpm run check-types` 与 `pnpm run check` 通过。

## 模块规则（按需引入）

- 前端（apps/web、packages/ui）：@rules/frontend.md
- 后端（apps/server）：@rules/backend-api.md
- 数据库（packages/db）：@rules/database.md
- 通用编码风格：@rules/coding-style.md
- 测试（vitest，`pnpm -F server test`）：@rules/testing.md
- 安全（token/env/CORS）：@rules/security.md
- Git 工作流：@rules/git-workflow.md

## 项目踩坑与教训（自学习闭环，开发中持续追加）

@../AGENTS.md
