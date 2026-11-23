# home repo 入口模板（`AGENTS.md`）

> verified: 2026-11-23 ｜ 验证方式: 模板占位

> 复制到你的 home repo 根目录作为 `AGENTS.md`，替换 `<...>` 占位符。
> 这套内容与工具无关；工具专属补充放各自的入口文件（如 `CLAUDE.md`），不在这里重复。
> 结构说明见 [docs/architecture/layout.md](docs/architecture/layout.md)。

---

# `<home-repo>` · 跨仓 AI 工作流主入口

> 本文件是**工具无关的事实源**。任何 AI 编码工具（Codex / Cursor / Gemini / Claude Code …）进入本仓，都从这里开始。
> 工具专属补充放在各自的入口文件里（如 `CLAUDE.md`），不在这里重复。

本仓是 **home repo**。业务代码不在这里，这里只有：跨仓共享的 skills / rules / agents、共享文档、仓库指针。

---

## 1. 会话起点规则

| 任务 | 从哪起会话 |
|---|---|
| 跨仓改动（接口契约、跨服务联调、权限落库、多仓一致性） | **本仓** |
| 单仓深挖（某接口报错、某段逻辑、单仓重构） | **直接进那个业务仓** |
| 不确定范围 | 本仓，先看 `repos/INDEX.md` 判范围 |

理由与代价见 [`docs/architecture/decisions/ADR-0004-session-start-and-pointers.md`](docs/architecture/decisions/ADR-0004-session-start-and-pointers.md)。

**核心取舍**：home repo 只提供「可达」，不提供「深度」。跨仓任务在这里看全局；单仓排查进仓，因为文件树、`git log`、编译报错天然在那边。

## 2. 找东西的顺序

1. [`repos/INDEX.md`](repos/INDEX.md) —— 仓在哪、怎么 clone、什么栈
2. [`docs/INDEX.md`](docs/INDEX.md) —— 关键词 → 文档（唯一检索入口）
3. [`skills/CATALOG.md`](skills/CATALOG.md) —— 有哪些 skill、各自触发词
4. [`memory/CATALOG.md`](memory/CATALOG.md) —— 项目记忆在哪、怎么召回
5. 都没命中：进对应业务仓，读它的 `AGENTS.md` / `CLAUDE.md`

## 3. 写东西的规则

| 内容类型 | 落点 |
|---|---|
| 跨仓业务事实 | `docs/domains/<域>/` |
| 可执行步骤（SQL、命令、回滚） | `docs/runbooks/` |
| 结构决策 | `docs/architecture/decisions/`（一号一档，不改旧档，写新档取代） |
| 进行中的设计 | `.specs/`（做完把结论搬进 `docs/`） |
| 单仓专属内容 | 那个业务仓自己 |

**每份 `docs/` 文档必须有 `verified:` 日期**，规则见 [`docs/architecture/conventions.md`](docs/architecture/conventions.md)。
提交前跑一次 `python scripts/check-freshness.py`。

## 4. 三条硬约束

1. **不迁业务代码、不放构建产物**。本仓不进任何构建链路。
2. **单仓专属的东西不要放这里**。判据：删掉某个仓后这份内容还有价值吗？没有就放那个仓。
3. **凭证不入库**。token / 密码 / session 一律走凭证保险库，文档里只写「从哪取」，不写值。

## 5. 资产分层

| 层 | 判定 | 存放 |
|---|---|---|
| L1 通用 | 与仓库体系无关（通用工程 / AI 工程 / 写作） | 运行时目录或本仓 |
| L2 工作区 | 服务这套工作区，跨多仓复用 | 本仓 `skills/` |
| L3 单仓 | 只对一个仓成立 | 该仓 `.claude/skills/` |

默认**只索引不搬迁**，见 [`docs/architecture/decisions/ADR-0005-index-not-migrate.md`](docs/architecture/decisions/ADR-0005-index-not-migrate.md)。
需要版本化或跨机器共享时才搬，且搬完要把运行时侧改成目录联接（`mklink /J`）。

## 6. 多工具兼容

| 文件 | 谁读 | 关系 |
|---|---|---|
| `AGENTS.md` | 通用（Codex / Cursor / Gemini / 其它） | **事实源** |
| `CLAUDE.md` | Claude Code | 只放 Claude Code 专属内容 + 指向本文件 |

业务仓也遵循同样规则：入口文件写工具无关事实，工具专属差异单独放。

## 7. 目录速览

```
<home-repo>/
├── AGENTS.md            # 本文件：工具无关事实源
├── CLAUDE.md            # 工具专属补充
├── README.md            # 人读概览
├── repos/INDEX.md       # 仓指针（一仓一行）
├── docs/                # 共享事实（INDEX 为入口）
├── skills/CATALOG.md    # skill 索引
├── memory/CATALOG.md    # 项目记忆索引
├── rules/  agents/      # 索引与清单
├── scripts/             # 校验脚本
└── .specs/              # 进行中的设计
```
