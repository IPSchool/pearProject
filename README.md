# PearProject

梨子项目管理系统 — 开源团队协作与项目管理 Web 应用。

Hero 分支为正式 Web 客户端：Jira 式项目空间、看板与列表、Wiki、团队权限与数据分析。本地开发需配合 [pearProjectApi](https://github.com/a54552239/pearProjectApi)（Docker 8090）。

- [HERO.md](./HERO.md) — 功能清单与开发说明
- [pearProjectDocs](https://github.com/a54552239/pearProjectDocs) — 产品设计文档

## 快速开始

```bash
npm install
cp .env.example .env
npm run dev
```

启动后端（8090）：

```bash
cd ../pearProjectApi/docker/jira && docker compose up -d
```

演示账号：`Lincoln` / `123456`

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 http://127.0.0.1:5173 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建产物 |
