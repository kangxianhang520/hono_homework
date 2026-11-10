---

description: apps/web 前端规范（React Router v8 + Vite + TailwindCSS v4 + shadcn/ui）——路由、目录、样式 token、组件与数据获取约定
globs: apps/web/**/*.{ts,tsx,css}, packages/ui/**/*.{ts,tsx,css}
---

# 前端规范 (apps/web)

## 技术栈与运行

- React 19 + React Router v8（framework mode，Vite 8 构建，`appDirectory: "src"`），TailwindCSS v4（`@tailwindcss/vite`），shadcn/ui（style `base-lyra`，图标 lucide / Material Symbols）。
- 环境变量走 varlock：`apps/web/src/env.ts` 是 **自动生成文件，禁止手改**；变更 schema 后运行 `pnpm --filter web env:generate`。前端只能读取 `VITE_` 前缀的公开变量（如 `VITE_SERVER_URL`），不要把任何密钥（GitHub PAT 等）写入前端 env 或源码。
- 校验命令：`pnpm run check-types`（含 `react-router typegen` + `tsc --noEmit`）、`pnpm run check`（Biome）。提交前两者必须通过。

## 路由

- 使用 `@react-router/fs-routes` 的 `flatRoutes()`，路由文件放在 `src/routes/`，命名遵循 flat routes 约定（`_index.tsx`、`$param.tsx`、`a.b.tsx`）。不要在 `routes.ts` 中手写路由表。
- 路由模块类型从 `./+types/<route>` 导入（`import type { Route } from "./+types/_index"`），用 `Route.MetaArgs` / `Route.LoaderArgs` / `Route.ComponentProps` 等，不要手写 loader/props 类型。
- 每个页面路由导出 `meta()`（title 格式：`<页面名> · GitHub Profile Sync & Fields Hub`，中文文案）。
- 路由文件只做组装：从 `@/features/<feature>/` 引入组件和数据，不在路由文件里堆业务逻辑。
- 全局错误由 `root.tsx` 的 `ErrorBoundary` 处理；需要局部错误 UI 时在路由内导出 `ErrorBoundary`。

## 目录结构

- `src/features/<feature>/`：按业务领域组织，内含 `components/`、`hooks/`、`data.ts`（类型、常量、标签映射）。新功能新建 feature 目录，不要往 `components/` 根下塞业务组件。
- `src/components/ui/`：项目内设计系统组件（Button、Card、Badge、Toast、Collapse、SegmentedTabs、design-icons 等）；`src/components/layout/`：AppShell / Sidebar / Header。
- `packages/ui`（`@my-better-t-app/ui/*`）：共享 shadcn 组件。通过 shadcn CLI 在 `apps/web` 添加组件时会落到 `packages/ui/src/components`（见 `components.json` aliases）。
- `src/hooks/`：跨 feature 通用 hook（如 `use-clipboard`）；feature 专属 hook 放 feature 内部。
- 文件名一律 kebab-case（`token-card.tsx`、`use-profile-fields.ts`），组件用具名导出 + PascalCase，页面路由组件用 `export default`。
- 导入用路径别名 `@/*`（= `apps/web/src/*`），不要写跨层级的 `../../`。

## 样式

- 优先使用 `src/styles/theme.css` 中定义的设计 token 工具类：颜色 `bg-surface-container*`、`text-on-surface`、`text-on-surface-variant`、`text-primary`、`text-secondary`；字号 `text-headline-*` / `text-body-*` / `text-label-*`；间距 `p-space-md`、`gap-space-sm`、`gutter` 等。不要硬编码十六进制颜色或随意的像素值。
- 合并 className 使用 `@/lib/cn` 的 `cn()`（已注册自定义字号/间距 token，避免 `text-label-sm` 被当成颜色吞掉），不要直接用 `@my-better-t-app/ui/lib/utils` 的 `cn` 处理含自定义 token 的类名。
- 应用固定为深色主题（`forcedTheme="dark"`），新增 token 需在 `theme.css` 中声明；复用样式片段写到 `src/styles/components.css`（如 `.code-chip`）。
- Tailwind 类名顺序由 Biome `useTailwindSortedClasses` 管理，运行 `pnpm run check` 自动修正。
- 图标优先使用 `@/components/ui/design-icons`（Material Symbols，与设计稿一致），通过 `size-*` 控制尺寸；其次 `lucide-react`。

## 组件与状态

- 函数组件 + TypeScript strict；props 用 `type XxxProps = {...}` 声明，组件上方加一句 JSDoc 说明用途。
- 使用 `import type` 导入类型（`verbatimModuleSyntax` 开启）。
- 本地 UI 状态用 `useState` / 自定义 hook（如 `useProfileFields`）；目前无全局状态库，不要擅自引入 Redux/Zustand 等。
- 通知使用 `src/components/ui/toast` 的 `ToastProvider` 体系（root 已挂载）；复制等通用交互复用现有 hook。
- 可访问性：交互元素用语义标签（`button`、`nav`、`aria-label`、`aria-current`），装饰图标加 `aria-hidden`。
- 界面文案以简体中文为主（`<html lang="zh-CN">`），技术名词可保留英文。

## 数据获取（接入后端时）

- 现阶段 `features/*/data.ts` 中为 mock 数据；接入 `apps/server`（Hono）时，通过 `VITE_SERVER_URL` 拼接 API 地址，请求逻辑封装在 feature 内（如 `features/<feature>/api.ts`），组件不直接散落 `fetch`。
- 优先使用 React Router 的 `clientLoader` / `loader`、`clientAction` / `action` 获取与提交数据，配合 `useFetcher` / `useNavigation` 处理 pending 状态。
- GitHub PAT 等敏感凭证只经由后端代理调用 GitHub API，前端展示时需脱敏，不写入 localStorage 明文、不打印到 console。
- 用 `zod` 校验后端响应和表单输入，类型从 schema 推导（`z.infer`）。

## 代码风格（Biome）

- Tab 缩进、双引号；自闭合空元素；`const` 优先、禁止参数重新赋值、禁止无用 else、`as const` 断言。
- 不要提交未使用的导入/变量；Biome organizeImports 自动排序导入。
