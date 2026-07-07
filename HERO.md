# PearProject Hero

PearProject 的 Web 客户端：用摘要页、多视图任务管理与团队权限，支撑从规划到交付的日常协作。

对接 [pearProjectApi](https://github.com/a54552239/pearProjectApi)（ThinkPHP 6），复用 `project/*` 业务 API，并可选对接 Jira REST 兼容层。

## 仓库定位

| 分支 | 说明 |
|------|------|
| **Hero**（本分支） | 正式前端 — React 19 + HeroUI 3 + Vite + TypeScript |
| `HistoryV` | 2.8.x Vue 原型，只读，作交互与流程参考 |

## 设计原则

1. **产品优先** — 对齐 [pearProjectDocs](../pearProjectDocs/Manual/架构设计.md) 功能设计与 Jira 式项目空间。
2. **API 稳定** — 复用 pearProjectApi `project/*`，与后端 Gate A 验收保持一致。
3. **现代体验** — 函数组件、TypeScript strict、响应式布局、可访问的交互组件。
4. **持续交付** — 核心产品域已可用，按路线图迭代补齐能力。

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
# 1. 启动后端（8090）与 WebSocket（2345）
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

- **2.8.x 原型**：`git checkout HistoryV` — 对照历史交互（只读）
- **API 文档**：pearProjectDocs [API参考.md](../pearProjectDocs/Manual/API参考.md)、Swagger http://127.0.0.1:8090/swagger-ui
- **验收**：`bash tests/hero/run.sh`；后端 Gate A 保证 API 行为不回退

## 与 master 的关系

- Hero 为独立演进的前端分支，成熟后可合并或替换仓库默认前端。
- 后端使用 pearProjectApi `master`（TP6 + 可选 Jira 层）。

## 实时推送（WebSocket）

顶栏圆点表示 GatewayWorker 连接状态：**灰 = 未配置**，**绿 = 已连接**。启用后可：

- **看板 / 列表 / 日历**：同组织其他成员改任务时自动刷新
- **通知铃铛**：收到 `notice` / `task` / `events` 推送时更新未读数

### 1. 启动 GatewayWorker（Docker 推荐）

`docker/jira` 已包含 `gateway` 服务，与 API 同网段：

```bash
cd pearProjectApi/docker/jira
docker compose up -d          # 含 mysql / redis / app / gateway
docker compose up -d gateway  # 仅补启 WebSocket
docker compose ps             # gateway 应监听 2345
```

**Docker Hub 拉取超时**（`auth.docker.io` timeout）时，目录下已有 `.env` 使用国内镜像：

```bash
# docker/jira/.env（已随仓库提供）
PHP_BASE=docker.m.daocloud.io/library/php:8.2-fpm

docker compose build app
docker compose up -d gateway
```

若暂时无法 rebuild，gateway 启动脚本会在容器内**自动补装 pcntl**（首次约 10 秒）。**推荐使用统一入口 `GateWayWorker/start.php`**，避免 Register/Gateway/BusinessWorker 分进程启动导致 `SendBufferToWorker fail`。

后端 `.env.docker` 已默认：

```ini
[config]
notice_push = true

[gateway]
register_host = gateway
register_port = 2346
```

修改后需 `docker compose restart app gateway`。

### 2. 配置 Hero 前端

```bash
cd pearProject
cp .env.example .env   # 若尚未创建
# 确认含：
# VITE_WS_URL=ws://127.0.0.1:2345
npm run dev
```

### 3. 本机直跑 GatewayWorker（非 Docker）

```bash
cd pearProjectApi
# config.php 默认 GW_SERVER_ADDRESS=127.0.0.1，端口 2345/2346
bash start.sh

# API .env 中：
# notice_push = true
# gateway.register_host = 127.0.0.1
```

### 4. 验证

1. 登录后顶栏圆点应变 **绿色**（实时已连接）
2. 打开两个浏览器窗口，进入**同一项目看板**
3. 在 A 窗口拖拽/创建任务 → B 窗口应在数秒内自动刷新
4. 断开 GatewayWorker 后圆点变灰或「已断开」

### 推送触发点（后端）

任务 **创建 / 指派 / 排序（跨列）/ 完成** 时，向组织组广播 `organization:task`。

## 已知限制

- 未启动 GatewayWorker 或未配置 `VITE_WS_URL` 时，实时功能自动降级为纯 HTTP，不影响正常使用。
- 部门排序、批量更新成员信息等能力尚未实现。
- 仓库内仍保留 Vue 2 源码（`src/views` 等），Hero 构建不引用。
