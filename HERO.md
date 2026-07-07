# PearProject Hero

**Hero** 分支是 PearProject 前端的 **从零重写**：React 19 + HeroUI v3 + Vite + TypeScript。

| 分支 | 技术栈 | 定位 |
|------|--------|------|
| `HistoryV` / `master` (旧) | Vue 2 + Ant Design Vue 1.7 | **产品原型** — 交互与功能参考 |
| **`Hero`** | React 19 + HeroUI 3 + Tailwind 4 | **正式重建** — 对接 pearProjectApi |

## 设计原则

1. **不迁移 Vue 代码** — 只参考 HistoryV 的页面流程与 pearProjectDocs 功能设计。
2. **API 不变** — 对接 master TP6 Legacy `project/*`（与 Gate A 一致）。
3. **现代栈** — 函数组件、TypeScript strict、Vite、Zustand、Axios。
4. **一次交付** — 核心产品域已对齐 Legacy API，后续按需迭代。

## 技术栈

| 层 | 选型 |
|----|------|
| UI | [HeroUI v3](https://www.heroui.com/) |
| 框架 | React 19 |
| 构建 | Vite 8 |
| 路由 | React Router 6 |
| 状态 | Zustand（持久化 auth） |
| HTTP | Axios（`application/x-www-form-urlencoded`，兼容 Legacy） |
| 样式 | Tailwind CSS 4 |

## 本地开发

```bash
# 1. 启动后端（8090）
cd ../pearProjectApi/docker/jira && docker compose up -d
docker exec jira-app-1 php /app/docker/jira/fixture-init.php

# 修改 PHP 路由或后端代码后重启（加载新路由 / 清 opcache）
cd ../pearProjectApi && bash restart-api.sh

# 2. 前端
cd pearProject
git checkout Hero
cp .env.example .env
npm install
npm run dev
```

打开 http://127.0.0.1:5173 ，演示账号 `Lincoln` / `123456`。

开发环境通过 Vite 代理：`/api/*` → `http://127.0.0.1:8090/*`。

## 目录结构

```text
src/
├── api/           # Legacy API 客户端
├── components/    # 通用 UI
├── config/        # 环境与站点配置
├── contexts/      # 项目级 React Context
├── layouts/       # AuthLayout / AppLayout / ProjectLayout
├── pages/         # 按产品域划分
│   ├── auth/
│   ├── workbench/
│   ├── projects/  # 概览、看板、成员、文件、标签、版本、工作流
│   ├── tasks/     # 我的任务
│   ├── invite/
│   ├── archive/
│   ├── recycle/
│   ├── analytics/
│   ├── templates/
│   ├── team/
│   ├── notifications/
│   └── settings/
├── routes/        # 路由守卫
├── stores/        # Zustand
└── types/         # 共享 API 类型（api.ts）
```

## 功能完成清单

### 认证与全局

- 登录 / 注册 / 个人设置
- 组织切换、动态菜单、侧边栏导航
- 工作台（项目概览、未读通知、我的任务入口）

### 项目空间（Jira 式视图）

项目页顶部为 **横向 Tab 导航**（对齐 Jira：摘要 → 列表 → 看板 → 日历 → 时间线 → 文档 → 表单 → 待办 → 版本），次要 Tab：成员 / 文件 / 标签 / 工作流 / **设置**。

**URL 编号规则**（对用户可见）：

| 模式 | 项目 URL | 任务 URL | 说明 |
|------|----------|----------|------|
| 数字（默认） | `/project/4/overview` | `/project/4/tasks/3` | 项目用数据库 `id`，任务用项目内 `id_num` |
| Issue Key | — | `/browse/KAN-1` | 在项目 **设置** 中启用 prefix 后生效 |
| 评论深链 | — | `?focusedCommentId=4498` | 评论用数字 `id`，兼容 Jira |

内部仍用 `code` 调用 Legacy API；访问旧长 code URL 会自动重定向到数字 id。

| 视图 | 路由 | 说明 |
|------|------|------|
| 摘要 | `/project/:id/overview` | KPI + 7日动态 + 未启用 Issue Key 时引导条 |
| **列表** | `/project/:code/list` | 表格视图，列配置（localStorage）、行内编辑经办人/优先级/状态/列 |
| 看板 | `.../tasks` | Kanban 列 + 拖拽 |
| 日历 | `.../calendar` | 月历 + 拖拽排期（`task/edit` 设置/清除截止日） |
| 时间线 | `.../timeline` | 简易甘特条 |
| 文档 | `.../wiki` | Wiki（Markdown，`projectInfo` + `hero:wiki`） |
| 表单 | `.../forms` | 需求收集，提交后 `task/save` 创建工作项 |
| 待办事项 | `.../backlog` | 第一列 = Backlog，其余 = 看板 |
| 版本 | `.../versions` | `projectFeatures/*`, `projectVersion/*` |
| 成员 / 文件 / 标签 / 工作流 / **设置** | 同上 Legacy | 设置页可启用 **Issue Key**（`prefix` + `open_prefix`） |

| 页面 | 路由 | Legacy API |
|------|------|------------|
| 概览 | `/project/:id/overview` | `project/read`, `project/edit`, `projectInfo/*`, `_projectStats` |
| **设置** | `.../settings` | `project/edit`（`prefix`, `open_prefix`）— Jira Issue Key |
| 看板 | `.../tasks` | `taskStages/*`, `task/*`, 拖拽排序 |
| 成员 | `.../members` | `projectMember/*`, 邀请/移除 |
| 文件 | `.../files` | `file/*` |
| 标签 | `.../tags` | `taskTag/*`, 任务详情内 `setTag` |
| 版本 | `.../versions` | `projectFeatures/*`, `projectVersion/*` |
| 工作流 | `.../workflow` | `taskWorkflow/*` |

### 跨项目

- 项目列表 / 创建 / 收藏
- 我的任务 `/my-tasks` — `task/selfList`
- 任务搜索 `/search`
- 回收站 / 归档
- 邀请链接生成 + 落地页 `/invite/:code`
- 日程 `/events`
- 数据分析 `/analytics`
- 项目模板 + 看板列模板 `/templates`
- 通知（含全部清空）`/notifications`
### 团队管理（完整 CRUD）

| 页面 | 路由 | 能力 |
|------|------|------|
| 组织 | `/team/organizations` | 新建/编辑/退出组织 |
| 团队成员 | `/team/members` | 部门树、成员筛选、邀请、批量导入、启停/移除 |
| 成员详情 | `/team/members/:code` | 资料编辑、同步、任务/项目 |
| 系统账号 | `/team/accounts` | 账户 CRUD、角色授权 |
| 角色权限 | `/team/roles` | 角色 CRUD、默认角色、启停 |
| 节点授权 | `/team/roles/:id/apply` | 权限树勾选（auth/apply） |

组织邀请链接：`inviteType=organization` → `/invite/:code` 落地页加入。

### 任务详情抽屉

- 编辑任务名、标记完成
- 评论、工时登记
- 标签切换（项目标签 ↔ 任务）

## 验收

```bash
bash tests/hero/run.sh   # API 验收 75 项 + Vitest 单元测试
npm run build
```

产品功能树见 [pearProjectDocs/Manual/架构设计.md](../pearProjectDocs/Manual/架构设计.md)。

## 原型对照

- **Vue 原型**：`git checkout HistoryV` — 仅作 UI/流程参考
- **API 文档**：pearProjectDocs `Manual/API参考.md`、`/swagger-ui`（8090）
- **验收**：后端 Gate A 保证 Legacy API 不回退；Hero 前端对齐 SystemDesign

## 与 master 的关系

- `Hero` 独立演进，成熟后合并或替换 `master` 前端。
- 后端继续使用 pearProjectApi `master`（TP6 + Jira 层可选）。

## 已知限制

- WebSocket 状态徽章需配置 `VITE_WS_URL`（可选）。
- 部门排序、批量更新成员信息等 Vue 占位功能未实现（HistoryV 同样未实现）。
- 仓库内仍保留 Vue Legacy 源码（`src/views` 等），Hero 构建不引用。
