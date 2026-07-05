# PearProject Hero

梨子项目管理系统 — **React + HeroUI** 前端重建（`Hero` 分支）。

> Vue 2 原型见 `HistoryV` 分支。完整说明见 [HERO.md](./HERO.md)。

## 快速开始

```bash
npm install
cp .env.example .env
npm run dev
```

默认连接本地 API（需 pearProjectApi `docker/jira` 8090）：

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

## 文档

- [HERO.md](./HERO.md) — 架构与路线图
- [pearProjectDocs](https://github.com/a54552239/pearProjectDocs) — 产品设计
