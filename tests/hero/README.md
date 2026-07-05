# Hero 前端验收

对接 pearProjectApi Legacy API（8090），与 UI 实现进度同步扩展。

## 运行

```bash
# 需 docker/jira
cd pearProjectApi/docker/jira && docker compose up -d

cd pearProject
bash tests/hero/run.sh
```

环境变量：

| 变量 | 默认 |
|------|------|
| `HERO_API_BASE` | `http://127.0.0.1:8090` |
| `HERO_ACCOUNT` | `Lincoln` |
| `HERO_PASSWORD_MD5` | md5(123456) |

## 用例

| ID | 说明 |
|----|------|
| HERO-A01 | Swagger spec 可达 |
| HERO-A02 | 登录 |
| HERO-A03 | 动态菜单 |
| HERO-A04 | 组织切换 |
| HERO-A05 | 项目列表 |
| HERO-A06 | 看板列 |
| HERO-A07 | 创建任务 |
| HERO-A08 | 任务详情 |
| HERO-A09 | 列任务列表 |
| HERO-A10 | 项目成员 |
| HERO-A11 | 搜索邀请成员 |
| HERO-A12 | 文件列表 |
| HERO-A13 | 通知列表 |
| HERO-A14 | 未读通知 |
| HERO-A15 | 任务评论 |
| HERO-A16 | 评论 taskLog |
| HERO-A17 | 文件上传 |

单元测试：`npm run test:unit`（Vitest）。
