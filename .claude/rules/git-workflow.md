---

## description: Git 分支、提交信息、提交前检查与忽略文件规范（Turborepo monorepo，origin=GitHub，主分支 main）

# Git 工作流规范

## 分支

- 主分支为 `main`（远程 `origin` = `git@github.com:kangxianhang520/hono_homework.git`），不直接在 `main` 上开发新 feature。
- 新功能从 `main` 切出：`feat/<feature-slug>`，如 `feat/github-api-proxy`；修复用 `fix/<slug>`，杂项用 `chore/<slug>`。
- feature slug 与 `specs/<序号>.<feature>/` 目录名保持一致（去掉序号前缀）。
- 禁止 `git push --force` 到 `main`；禁止 `git reset --hard`、`git clean -fd` 等破坏性操作，除非用户明确要求。

## 提交信息（Conventional Commits）

- 格式：`<type>(<scope>)?: <简短描述>`，与现有历史一致（如 `feat: frontend ui develop`）。
- type：`feat` / `fix` / `refactor` / `docs` / `style` / `test` / `chore` / `perf` / `build`。
- scope 建议使用 workspace 名：`web`、`server`、`db`、`ui`、`config`，跨包改动可省略 scope。
- 描述用祈使/简短语气，首行不超过 72 字符，结尾不加句号；必要时空一行写正文说明原因。
- 一次提交只做一件事；数据库 schema 变更与其 migration（`packages/db`）放同一个提交。

## 提交前检查

按顺序执行，全部通过再提交：
1. `pnpm run check` —— Biome lint + format（会 `--write` 自动修复，修复后的改动需一并暂存）
2. `pnpm run check-types` —— Turborepo 全仓类型检查
3. 涉及构建配置时额外跑 `pnpm run build`

- 项目未配置 husky / lint-staged，以上检查需手动或由 agent 执行，不得跳过。

## 不要提交的内容

- `.env`、`.env*.local` 等任何含密钥的文件；密钥只放本地环境变量（varlock 管理），代码中不得硬编码 token（如 GitHub Token）。
- 构建产物与缓存：`node_modules`、`dist`、`build`、`.turbo`、`*.tsbuildinfo`、`coverage`。
- 生成文件：`apps/web/src/routeTree.gen.ts`、`local.db*`。
- `/docs/`、`/specs/` 已在 `.gitignore` 中忽略，属于本地需求/规格文档，不要用 `git add -f` 强行加入。
- `pnpm-lock.yaml` 必须随依赖变更一起提交；只用 pnpm 安装依赖，不要生成 `package-lock.json` / `yarn.lock` / `bun.lockb`。

## 暂存与提交操作

- 用 `git add <具体路径>` 精确暂存，避免 `git add -A` 误带入无关文件（如 `.DS_Store`、本地调试文件）。
- 提交前 `git status` / `git diff --staged` 自查。
- 只有在用户明确要求时才 commit / push / 创建 PR；PR 用 `gh` CLI 创建，目标分支 `main`。
