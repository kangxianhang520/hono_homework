---

description: Drizzle ORM（1.0.0-rc.5）+ PostgreSQL 数据层规范，适用于 packages/db 及服务端的数据库访问
globs:
- "packages/db/**"
- "apps/server/src/**"

---

# 数据库规范（Drizzle ORM + PostgreSQL）

## 包结构（packages/db，包名 `@my-better-t-app/db`）

- `src/schema/index.ts`：唯一的 schema 入口，drizzle-kit 从这里读取（`drizzle.config.ts` 里的 `schema`）。新表可以拆到 `src/schema/<name>.ts`，但必须在 `index.ts` 中 `export *` 导出。
- `src/relations.ts`：用 `defineRelations(schema)` 定义关系（Drizzle v1 的 relations API）。不要用旧的 `relations()` 写法。
- `src/index.ts`：`createDb(env)` 工厂函数和 `Database` 类型。应用侧只能通过它拿到 db 实例。
- `src/config.ts`：`DatabaseConfig` 类型（`DATABASE_URL`）。
- `src/env.ts`：由 varlock 根据 `.env.schema` **自动生成**，并且已加入 gitignore，**禁止手改**。
- `src/migrations/`：drizzle-kit 生成的迁移文件（`out`）。

## Schema 编写

- 方言固定为 PostgreSQL，只用 `drizzle-orm/pg-core` 的列类型和建表函数。`schemaFilter` 只有 `public`，不要新建其他 pg schema。
- 表名和列名在数据库中用 snake_case，TS 属性用 camelCase。
- 每张表都要有主键。时间列用 `timestamp(..., { withTimezone: true })`，并给 `createdAt` 和 `updatedAt` 加默认值 `defaultNow()`。
- 外键用 `.references(() => table.id, { onDelete: ... })` 明确写出级联策略；常用查询列要在表定义的第三个参数里声明 `index()` 或 `uniqueIndex()`。
- 行类型用 `typeof table.$inferSelect` 和 `$inferInsert` 导出，不要另外手写重复的接口。
- 需要输入校验时用 zod（包内已依赖 `zod` catalog 版本）。

## 迁移流程

- 本地启动数据库：`pnpm run db:start`（docker compose，镜像 postgres:18，端口 5432）。
- 原型阶段可以用 `pnpm run db:push`。需要保留记录或面向部署的变更，必须先 `pnpm run db:generate` 生成迁移，再 `pnpm run db:migrate` 执行。
- 生成的迁移 SQL 要提交到仓库。已提交的迁移文件**不能修改**，需要变更时新增一个迁移。
- 修改 schema 之后执行 `pnpm run check-types`，确认 `apps/server` 的类型仍能通过。
- 所有 db 脚本都从根目录通过 turbo 过滤执行（`turbo run db:* -F @my-better-t-app/db`），不要进入子包直接跑。

## 连接与环境变量

- `DATABASE_URL` 是敏感变量，定义在 `apps/server` 的 `.env.schema` 中，db 包通过 `@import(../../apps/server/, pick=[NODE_ENV, DATABASE_*])` 引入。新增 DB 相关变量时使用 `DATABASE_` 前缀，并写进 server 的 `.env.schema`。
- 不要提交 `.env`、`.env.local` 等文件，也不要在代码里硬编码连接串或密码（docker-compose 中的密码只用于本地开发）。
- 服务端只在 `apps/server/src/services.ts` 里调用 `createDb(ENV)` 创建一个单例 `db`，其他模块从这里导入，不要重复创建连接。

## 查询

- 优先用 Drizzle 的查询构建器或 `db.query.<table>`（relational query v2）。原生 SQL 只能用 `sql` 模板标签做参数化，**禁止字符串拼接 SQL**。
- 有多步写操作时用 `db.transaction(async (tx) => ...)`，事务里统一使用 `tx`。
- 只 select 需要的列，列表查询必须分页（`limit`/`offset` 或游标）。
- 数据库错误在 service 层转换成业务错误，不要把原始错误信息透传给 HTTP 响应。

## 当前状态

- `src/schema/index.ts` 目前是空的（`export {}`）。项目当前的 feature（GitHub API 代理）如果用不到持久化，就不要为了“看起来完整”而加表；确实需要缓存或记录时，再按上面的规范新增。
