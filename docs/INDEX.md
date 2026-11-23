# 共享文档索引

> verified: 2026-11-23 ｜ 验证方式: 目录实测

> **唯一检索入口**：按关键词找到对应文档。命中 `STALE` 时先看文件头 `verified:` 决定是否重新核对。

## 架构与约定

| 关键词 | 路径 | 状态 |
|---|---|---|
| 目录结构、home repo 怎么搭、落地清单 | [`architecture/layout.md`](architecture/layout.md) | OK |
| 命名、文档头、verified、内容纪律 | [`architecture/conventions.md`](architecture/conventions.md) | OK |
| ADR-0001 为什么要 home repo、被否掉的 monorepo | [`architecture/decisions/ADR-0001-home-repo.md`](architecture/decisions/ADR-0001-home-repo.md) | OK |
| ADR-0002 L1/L2/L3 资产分层 | [`architecture/decisions/ADR-0002-asset-layering.md`](architecture/decisions/ADR-0002-asset-layering.md) | OK |
| ADR-0003 verified 门禁、30/90 天阈值 | [`architecture/decisions/ADR-0003-doc-freshness.md`](architecture/decisions/ADR-0003-doc-freshness.md) | OK |
| ADR-0004 会话起点、仓指针格式、单仓卡片边界 | [`architecture/decisions/ADR-0004-session-start-and-pointers.md`](architecture/decisions/ADR-0004-session-start-and-pointers.md) | OK |
| ADR-0005 索引而非搬迁、junction 方案 | [`architecture/decisions/ADR-0005-index-not-migrate.md`](architecture/decisions/ADR-0005-index-not-migrate.md) | OK |

## 业务域

| 关键词 | 路径 | 状态 |
|---|---|---|
| 权限系统（示例域，部署时替换或删除） | [`domains/permission-system/README.md`](domains/permission-system/README.md) | OK |

## 可执行手册

| 关键词 | 路径 | 状态 |
|---|---|---|
| runbook 写法与清单 | [`runbooks/README.md`](runbooks/README.md) | OK |

## 维护

新增/删除文档**同一提交**内更新本表，规则见 [`architecture/conventions.md`](architecture/conventions.md) §4。
