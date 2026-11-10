---

description: TypeScript/React/Hono 代码风格规范（Biome 格式化 + lint、严格 TS、命名与 import 约定）
globs: "**/*.{ts,tsx,js,jsx,mjs,cjs,css,json}"
---

# Coding Style

## 工具与校验

- 格式化与 lint 统一使用 Biome（根 `biome.json`），不引入 ESLint / Prettier。
- 提交前运行 `pnpm run check`（`biome check --write .`，自动修复格式、import 排序、Tailwind class 排序）。
- 类型检查运行 `pnpm run check-types`（turbo 跑各包 `tsc`），必须零错误。

## 格式

- 缩进使用 Tab（Biome `indentStyle: tab`）；字符串使用双引号。
- import 由 Biome `organizeImports` 自动排序；分组顺序：第三方包 → workspace 包（`@my-better-t-app/*`）→ 别名 `@/` → 相对路径，组间空一行。
- 所有 `import` 放在文件顶部，不在代码中间插入 import。
- JSX 无子元素时必须自闭合（`useSelfClosingElements`）。
- Tailwind class 顺序交给 Biome `useTailwindSortedClasses` 自动修复，不手工排序。

## TypeScript

- 开启 `strict`，并遵守 `packages/config/tsconfig.base.json` 的 `noUncheckedIndexedAccess`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`：数组/索引访问需处理 `undefined`，不留未使用变量和参数。
- `verbatimModuleSyntax` 开启：仅作类型使用的导入必须写 `import type { ... }`。
- 禁止 `any`；未知数据用 `unknown` + zod 校验后收窄（项目已依赖 `zod`）。
- 不写可推断的类型标注（`noInferrableTypes`）；常量字面量用 `as const`（`useAsConstAssertion`）。
- 枚举成员必须显式初始化（`useEnumInitializers`），优先使用字面量联合类型或 `as const` 对象代替 enum。
- 数字工具方法使用 `Number.parseInt` / `Number.isNaN` 等命名空间形式（`useNumberNamespace`）。

## 语句风格

- 一条声明只声明一个变量（`useSingleVarDeclarator`）；优先 `const`。
- 不重新赋值函数参数（`noParameterAssign`）；默认参数放最后（`useDefaultParameterLast`）。
- `return`/`throw` 之后不写多余的 `else`（`noUselessElse`），优先 early return。
- 无插值时不用模板字符串（`noUnusedTemplateLiteral`）。

## 命名与文件组织

- 文件名使用 kebab-case（如 `app-sidebar.tsx`、`use-clipboard.ts`）；React Router 路由文件遵循框架约定（`_index.tsx`、`$section.tsx`）。
- React 组件 PascalCase，hooks 以 `use` 开头，模块级常量 UPPER_SNAKE_CASE（如 `NAV_ITEMS`），其余变量/函数 camelCase。
- 前端（apps/web）：通用 UI 放 `src/components/ui`，布局放 `src/components/layout`，业务功能按 `src/features/<feature>/{components,hooks}` 组织；跨目录引用使用 `@/` 别名。
- className 合并统一使用 `@/lib/cn` 的 `cn()`，不要直接用 `clsx`/`twMerge`。
- 后端（apps/server）：Hono 路由按领域拆分；环境变量只从 `env.server.ts` 的 `ENV` 读取，不直接访问 `process.env`；数据库实例从 `services.ts` 获取。
- 数据库（packages/db）：schema 放 `src/schema`，关系放 `src/relations.ts`，通过 `createDb` 导出使用。

## 注释

- 对导出的组件/函数用简短 JSDoc（`/** ... */`）说明意图与非显而易见的原因，不写复述代码的注释。
