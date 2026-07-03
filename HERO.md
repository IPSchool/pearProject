# PearProject Hero

**Hero** 分支是 PearProject 前端的 **从零重写**：React 19 + HeroUI v3 + Vite + TypeScript。

| 分支 | 技术栈 | 定位 |
|------|--------|------|
| `HistoryV` / `master` (旧) | Vue 2 + Ant Design Vue 1.7 | **产品原型** — 交互与功能参考 |
| **`Hero`** | React 19 + HeroUI 3 + Tailwind 4 | **正式重建** — 对接 pearProjectApi |

## 设计原则

1. **不迁移 Vue 代码** — 只参考 HistoryV 的页面流程与 pearProjectDocs 功能设计。
2. **API 不变** — 优先对接 master TP6 Legacy `project/*`（与 Gate A 一致）。
3. **现代栈** — 函数组件、TypeScript strict、Vite、Zustand、Axios。
4. **渐进交付** — 按产品域分 Phase，每 Phase 可独立验收。

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

# 2. 前端
cd pearProject
git checkout Hero
cp .env.example .env
npm install
npm run dev
```

打开 http://127.0.0.1:5173 ，演示账号 `123456` / `123456`。

开发环境通过 Vite 代理：`/api/*` → `http://127.0.0.1:8090/*`。

## 目录结构

```text
src/
├── api/           # Legacy API 客户端
├── components/    # 通用 UI
├── config/        # 环境与站点配置
├── layouts/       # AuthLayout / AppLayout
├── pages/         # 按产品域划分
│   ├── auth/
│   ├── workbench/
│   ├── projects/
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
└── types/         # API 类型
```

## 实现路线图

| Phase | 范围 | 状态 |
|-------|------|------|
| **0** | 脚手架、登录、布局、工作台/项目列表骨架 | ✅ |
| **1** | 注册、资料、组织切换、动态菜单 | ✅ |
| **2** | 看板（列/卡片/拖拽）、任务详情、创建任务 | ✅ |
| **3** | 成员、文件、评论、通知 | ✅ |
| **4** | 版本、模板、工作流、团队/RBAC | ✅ |
| **5** | 日程、WebSocket、图表 | ✅ |
| **6** | 回收站、邀请链接、搜索、收藏 | ✅ |
| **7** | 归档、工时 UI、邀请落地页 | ✅ |

## 验收

```bash
bash tests/hero/run.sh   # API 验收 53 项 + Vitest 单元测试
npm run build
```

产品功能树见 [pearProjectDocs/Manual/架构设计.md](../pearProjectDocs/Manual/架构设计.md)。

## 原型对照

- **Vue 原型**：`git checkout HistoryV` — 仅作 UI/流程参考
- **API 文档**：pearProjectDocs `Manual/API参考.md`、`/swagger-ui`（8090）
- **验收**：后端 Gate A 保证 Legacy API 不回退；Hero 前端逐步对齐 SystemDesign

## 与 master 的关系

- `Hero` 独立演进，成熟后合并或替换 `master` 前端。
- 后端继续使用 pearProjectApi `master`（TP6 + Jira 层可选）。
