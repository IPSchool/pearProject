# HistoryV — 改造前基线分支

本分支永久保留 **PearProject 大刀阔斧改造之前** 的代码快照，供对照与回滚参考。

| 项 | 值 |
|----|-----|
| 分支名 | `HistoryV` |
| 创建日期 | 2026-06-30 |
| 前端版本 | 2.8.17（`src/config/version.js`） |
| 用途 | 历史参考；**不在此分支继续开发** |
| 活跃开发 | `master`（Jira API 兼容改造） |

## 说明

- 原生 PearProject API（`project/task/edit` 等），**非** Jira REST API
- 配套文档见 pearProjectDocs 仓库 [改造基线.md](https://github.com/a54552239/pearProjectDocs) / [API参考.md](https://github.com/a54552239/pearProjectDocs)
- Jira 兼容改造规划见 [JiraAPI兼容.md](https://github.com/a54552239/pearProjectDocs/blob/main/Manual/JiraAPI兼容.md)

## 仓库

- 前端：pearProject（本仓库）
- 后端：pearProjectApi
- 文档：pearProjectDocs
