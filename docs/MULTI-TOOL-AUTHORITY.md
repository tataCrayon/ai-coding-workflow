# 多工具归一（Multi-Tool Authority）— V3.0 部署形态

> V3.0 的部署答案：**一套配置，所有 AI 编码工具共用**——真相源收敛到 `~/.agents/`，各工具目录退化为指向它的链接壳。

## 一、问题：N 个工具 = N 份漂移的配置

同时使用多个 AI 编码工具（Claude Code / ZCode / Codex / Cursor / OpenCode / WorkBuddy…）时，每家都有自己的配置目录：

| 工具 | 全局指令 | Skills | Rules |
|------|----------|--------|-------|
| Claude Code | `~/.claude/CLAUDE.md` | `~/.claude/skills/` | `~/.claude/rules-dev/` |
| ZCode | `~/.zcode/AGENTS.md` | `~/.zcode/skills/` | 随 AGENTS.md |
| Codex | `~/.codex/AGENTS.md` | `~/.codex/skills/` | — |

在每家各放一份 → 必然漂移。实测教训（OPT-035）：同一套 Skill 在两个目录各一份，盘点出 **33 对漂移实体**（同名不同内容，req-standardizer 两版差 1.8KB），路由表还描述着早已不存在的能力。**配置漂移就是工作流的理解债**。

## 二、解法：单一真相源 + 链接壳

```
~/.agents/                     ← 唯一权威（真相源）
├── AGENTS.md                  ← 全局指令唯一版本
├── skills/                    ← 全部 Skill（含归档区 .archived-*）
├── rules/{core,methodology}/  ← 规则两层
└── scripts/check-links.py     ← 巡检

~/.claude/CLAUDE.md    → junction → ~/.agents/AGENTS.md
~/.claude/skills       → junction → ~/.agents/skills
~/.claude/rules-dev    → junction → ~/.agents/rules
~/.zcode/AGENTS.md     → junction → ~/.agents/AGENTS.md
~/.zcode/skills/*      → 按需单个链接
```

**原则**：
1. **只改真相源**。任何工具目录里的"修改"都是错的——先确认它是壳还是拷贝。
2. **链接壳不可反向修改**。工具升级若覆盖壳，重建链接即可。
3. **归档不删除**：退役 Skill 进 `skills/.archived-*/`（点前缀目录不进技能发现），回滚 = 移回来。

### Windows 落地要点（实测坑）

| 坑 | 解法 |
|----|------|
| Git Bash `ln -s` 对目录默认**复制**而非建链 | 用 PowerShell `New-Item -ItemType Junction`（无需管理员）；真 symlink 才需要管理员权限 |
| PowerShell `Remove-Item` 删 junction 抛 NullReferenceException | 用 `cmd /c rmdir /q <path>` |
| `os.path.islink()` 对 **junction 返回 False** | 巡检用 `dir /a` 找 `<JUNCTION>`，或直接验证目标存在性 |
| 文件级共享（references 真源） | 同卷用 hardlink（`os.link`），零拷贝且内容恒同步 |

## 三、跨工具迁移：ai-tool-migrator + workflow-migrator

**仓库→新环境部署**（新电脑 clone 本仓库后怎么装起来）用本仓自带的 [skills/workflow-migrator](../skills/workflow-migrator/SKILL.md)：先 `scripts/scan_migration.py` 只读盘点出冲突矩阵（new / identical / differs），再按形态 A（逐工具拷贝）或形态 B（本文的真相源归一）执行，只增不删、留迁移报告可回滚。

**工具 A→工具 B 横向资产迁移**用 [skills/ai-tool-migrator](../skills/ai-tool-migrator/SKILL.md)（V3.1.1 起已收录进本仓库，亦可从 SkillHub / github.com/tataCrayon/ai-tool-migrator 单独安装），处理无法用链接归一的部分：

- **四类资产**：Skills（六家格式趋同，目录整拷）/ MCP（格式分裂最重：JSON vs TOML vs 数组）/ Agents（无原生概念的降级为 Skill）/ Memory（语义合并不照搬）。
- **四条铁律**：只增不删；先盘点后动手（scan_inventory.py）；凭据一律不迁（token → `<REPLACE_ME>`）；每步记录迁移报告。
- 与本模式的分工：**目录能链接的用链接**（Skills/Rules/全局指令），**格式分裂的用迁移器**（MCP/Agents/Memory）。

## 四、巡检（防复发）

```bash
python scripts/check-links.py   # 三层：断链 / SKILL.md 缺失 / 内联引用失效；exit 0 = 健康
```

接入 H4 节奏：Skill 增删时跑一次 + 刷新能力一页纸；或每月例行。实测首跑即抓出 40+ 处失效引用（归档/搬迁后的幽灵文件引用）。

## 五、本仓库与该模式的关系

- 本仓库仍是**项目无关的便携分发**（放进任何项目、任何工具都能跑）；多工具重度用户才需要升级到 `~/.agents` 归一形态。
- 单工具用户维持现状即可：`rules/ + skills/ + AGENTS.md` 拷进目标目录，没有漂移问题。
- 若走归一形态，本仓库的 `skills/`、`rules/` 内容即真相源的初始种子。
