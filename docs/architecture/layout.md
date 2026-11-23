# 仓库结构：home repo 模式（可选启用）

> verified: 2026-11-23 ｜ 验证方式: 按 ADR-0001~0005 落地后的目录实测

## 什么时候用这套结构

本仓（vibe-coding-workflow）本身是**播种包**：一个业务仓克隆/拷贝它，就得到完整的 AI 工作流。
但当你手上有**十几个互相关联的业务仓**、且经常做跨仓改动时，还需要再上一层：**home repo**。

判据：

| 情况 | 用什么 |
|---|---|
| 只有 1 个仓 | 直接把本包内容拷进那个仓，不需要本节 |
| 2~3 个仓，偶尔联动 | 各自仓内一份本包即可 |
| **≥4 个仓，跨仓改动是常态** | 用 home repo（本节），另建一个仓只放指针与跨仓事实 |

理由与代价见 [`decisions/ADR-0001-home-repo.md`](decisions/ADR-0001-home-repo.md)。

## 目录结构

```
<home-repo>/
├── AGENTS.md                   # 入口：工具无关事实源（会话起点 / 找东西顺序 / 写东西规则）
├── CLAUDE.md                   # Claude Code 专属补充，只放指针不复制
├── README.md                   # 人读：从哪开始
├── repos/                      # 指向各业务仓（指针，不放代码）
│   ├── INDEX.md                # 一仓一行的可执行指针表
│   └── <repo>.md               # 单仓卡片：定位/栈/构建/边界（只写跨会话需要的）
├── docs/                       # 共享事实（跨仓才放）
│   ├── INDEX.md                # 关键词 → 文档路径，AI 检索入口
│   ├── domains/                # 业务域知识（可跨仓）
│   ├── architecture/           # 结构决策与约定
│   │   ├── layout.md           # 本文件
│   │   ├── conventions.md      # 命名/文档/新鲜度约定
│   │   └── decisions/          # ADR，一号一档
│   └── runbooks/               # 可执行操作手册（含 SQL、命令、回滚）
├── skills/CATALOG.md           # skill 索引（不搬内容，见 ADR-0005）
├── memory/CATALOG.md           # 项目记忆索引（在哪、多少篇、怎么召回）
├── .specs/                     # 进行中的设计（阶段物，不进 docs）
└── .archive/                   # 退役资产，保留可追溯
```

## 每一层回答什么

| 层 | 回答的问题 | 判据 |
|---|---|---|
| `repos/` | 「那个仓在哪、怎么用」 | 一行一仓，含路径 + clone 源 |
| `docs/domains/` | 「这块业务怎么运作」 | 跨仓复用的业务事实 |
| `docs/architecture/` | 「为什么这么做」 | 决策与约定，变动少 |
| `docs/runbooks/` | 「具体怎么操作」 | 有顺序、有回滚、可照抄 |
| `memory/` | 「上次学到什么」 | 记忆库位置与召回方式 |
| `.specs/` | 「正在做什么」 | 有生命周期，做完归档或删除 |

**`docs/` 与 `.specs/` 的区别**：`docs/` 是长期事实（写完就稳定），`.specs/` 是过程产物（会过期）。
一个需求做完，结论进 `docs/`，过程留 `.specs/` 或被删除。

## 禁止放这里的东西

| 不放 | 原因 | 应该放 |
|---|---|---|
| 业务代码、构建产物 | 本仓不参与任何构建链路 | 各自业务仓 |
| 单仓的 build/test 命令 | 换仓就失效 | 该仓的 `CLAUDE.md` |
| 单仓专属 skill | 占全局上下文，影响所有会话 | 该仓 `.claude/skills/` |
| 会话记录原文 | 体积大、检索价值低 | 提炼成 `docs/` 事实，原文归档 |
| 密码 / token 明文 | 安全 | 凭证保险库（见 `cred-vault` 类 skill） |

## 规模上限

| 仓数量 | 做法 |
|---|---|
| ≤ 20 | `repos/INDEX.md` 一仓一行 |
| 20–100 | `repos/` 按产品线拆文件，`INDEX.md` 只指到文件 |
| > 100 | 只保留活跃仓（近 90 天有提交）指针，其余靠按需发现 |

超限的第一信号：`INDEX.md` 长到 agent 读它比直接搜盘更慢。

## 落地清单

1. 建仓，写 `AGENTS.md`（会话起点 + 找东西顺序 + 写东西规则 + 硬约束）
2. 写 `repos/INDEX.md`（一仓一行：定位 / 栈 / 路径 / clone）
3. 写 `docs/architecture/conventions.md`（`verified` 锚点 + 命名 + 内容纪律）
4. 拷入决策记录 `docs/architecture/decisions/ADR-0001~0005`
5. 拷入 `scripts/check-freshness.py`，接进提交前检查
6. 建 `memory/CATALOG.md`，登记各工具的记忆库位置
7. 把本仓的 `AGENTS.md` 里的「找东西顺序」改成指向 `repos/INDEX.md` → `docs/INDEX.md`
