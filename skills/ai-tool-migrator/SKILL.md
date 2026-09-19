---
name: ai-tool-migrator
slug: ai-tool-migrator
version: 1.1.0
displayName: AI资产迁移，工具切换
summary: 在 Claude Code、Codex、ZCode、OpenCode、WorkBuddy、Cursor 与 DeepSeek Harness（dsh）之间盘点和迁移兼容资产，明确权限与能力限制
description: 在 AI 编码工具之间迁移配置资产——[CC]、Codex、ZCode、OpenCode、WorkBuddy、Cursor、DeepSeek Harness（dsh）之间迁移兼容的 Skills、MCP 服务器、Agents/子代理、记忆(Memory)与全局指令(AGENTS.md/CLAUDE.md)。当用户说"迁移到 XX"、"把配置同步到 XX 工具"、"从 XX 换到 YY"、"搬家"、"同步 memory/skills/MCP/agent 到另一个工具"时使用。先盘点源工具资产，再按目标工具格式转换写入，全程只增不删、可回滚。
tags: [migration, mcp, memory, skills, agents, claude-code, codex, zcode, cursor]
license: MIT
compatibility: 需要 Python 3.8+（仅标准库）；支持 Windows/macOS/Linux
---

# AI Tool Migrator — AI 编码工具间配置迁移

## 心智模型

七种工具可按四类资产盘点，但**格式相似不代表执行、权限、记忆加载语义相同**。dsh 的分层配置和不等价项见 [dsh 适配说明](references/dsh.md)：

| 资产类 | 本质 | 迁移难度 |
|--------|------|----------|
| **Skills** | `SKILL.md` + YAML frontmatter（六家几乎全兼容） | ⭐ 直接复制 |
| **MCP** | 服务器连接定义（stdio 命令 / HTTP URL），格式分裂严重 | ⭐⭐⭐ 需转换 |
| **Agents** | 子代理定义（name/description/指令），部分工具没有原生概念 | ⭐⭐ 需降级或转换 |
| **Memory / 指令** | 全局指令文件 + 项目记忆（路径编码方式各家不同） | ⭐⭐ 需定位映射 |

迁移铁律：
1. **只增不删**：永远不删除、不覆盖目标工具的既有资产。同名冲突时先备份再询问用户。
2. **先盘点后动手**：先跑 `scripts/scan_inventory.py` 摸清两边家底，和用户确认迁移清单，再执行。
3. **凭据不迁移**：`auth.json`、API key、token 等凭据文件一律跳过，只提示用户在目标工具重新登录。
4. **记录每一步**：把复制的每个文件路径写进迁移清单，出问题可精确回滚。

## 工作流程

### Phase 1 — 识别方向

确认三件事（有歧义时问用户）：
- **源工具**：从哪迁出（缺省：用户正在用的工具）
- **目标工具**：迁入哪
- **资产范围**：全部四类，还是只要某几类（如"只要 MCP 和 skills"）

### Phase 2 — 盘点

运行盘点脚本（只读，不改任何文件）：

```bash
python scripts/scan_inventory.py            # 盘点全部已装工具
python scripts/scan_inventory.py claude codex   # 只盘点指定工具
```

脚本输出 JSON：每个工具的 skills 列表、MCP 服务器数、agents 列表、memory 文件数。把结果整理成一张清单给用户看，标注：
- ✅ 直接可复制（skills 同名格式）
- 🔄 需格式转换（MCP、agents）
- ⚠️ 无法自动迁移（凭据、工具特有配置如 hooks/plugins）

### Phase 3 — 执行迁移

按资产类逐个迁移。每类的具体路径映射和格式转换规则查 [references/tool-layouts.md](references/tool-layouts.md)（目录在哪）和 [references/conversion-rules.md](references/conversion-rules.md)（怎么转），这两份文件按需读取，不必一次全读。

**3.1 Skills（最简单，先做）**

```bash
# 源 → 中转目录（保持原样复制整个 skill 目录）
cp -r <src_skills_dir>/<skill-name> <staging>/
```

复制后做两件事：
1. 校验每个 `SKILL.md` 有合法 YAML frontmatter（`name` + `description`），缺失就补。
2. 剔除工具特有文件（WorkBuddy 的 `_user_meta.json`、`.zip` 包、`node_modules` 等），这些不通用。

**3.2 MCP（最容易错，逐个转）**

对每台源 MCP 服务器，按 conversion-rules.md 里的格式表改写成目标格式。关键转换轴：
- JSON `{"command","args","env"}` ↔ TOML `[mcp_servers.name]`
- stdio ↔ HTTP（`url` 型跨工具普遍兼容，字段名要变）
- `enabled: false` ↔ `disabled: true` 语义相反，转换时取反
- Windows 路径在 TOML 用单引号原样写，在 JSON 要转义 `\\`

**3.3 Agents**

映射关系：`~/.claude/agents/*.md` ↔ OpenCode `agent/*.md` ↔ Cursor `.cursor/agents/` ↔ WorkBuddy 原生无 agents（可转为 skill）↔ Codex 无原生 agents（转为 prompt/skill）。

转换要点：保留 frontmatter 的 `name`/`description`。`tools` 白名单、沙箱、审批和模型限制必须逐项映射；目标不能表达时标记受阻，不能删除限制而让子代理继承全部工具。降级为 Skill 也不是权限等价，须明确说明后取得授权。dsh 不直接导入其他工具的 agents 目录。

**3.4 Memory / 全局指令**

分两层：
- **全局指令**：`CLAUDE.md`（[CC]/ZCode）↔ `AGENTS.md`（Codex/OpenCode/Cursor）↔ `IDENTITY.md`+`USER.md`（WorkBuddy）。内容语义迁移而非原文复制——先读源文件，提炼为指令条目，再按目标文件的既有结构合并进去。
- **项目记忆**：`~/.claude/projects/<路径编码>/memory/` ↔ `~/.zcode/cli/memories/projects/<hash>/` ↔ `~/.codex/memories/` ↔ `~/.workbuddy/memory/`。项目记忆是逐文件的 markdown，可直接复制；`MEMORY.md` 索引同名冲突时做行级合并。路径编码不同（[CC] 用路径转 `D--Users-...`，ZCode 用 hash），需要靠项目实际路径人工对应。

### Phase 4 — 验证与回滚说明

1. 重新跑 `scan_inventory.py <目标工具>`，确认资产数量和迁移清单一致。
2. 抽查 1-2 个迁移后的文件，确认格式合法（JSON 能 parse、TOML 能 parse、frontmatter 有 name/description）。
3. 提示用户重启目标工具使其重新加载配置（MCP 和 skills 多数工具在启动时扫描）。
4. 产出迁移报告：迁了什么、跳过什么（及原因）、如何回滚（删除迁入文件即可——因为只增不删，回滚就是删除）。

## 现场应变

- **目标目录不存在**：先创建再写入；目录不存在也可能说明该工具从未在此机器初始化，向用户确认。
- **同名 skill 已存在**：diff 两者，把差异报给用户，由用户决定跳过/覆盖/双份共存（改名加后缀）。不要静默覆盖。
- **发现未收录的工具**（如用户装了其他 AI CLI）：用 scan 脚本的探测逻辑兜不了底，改为手工探查其配置目录（通常在 `~/.<tool>/`），套用同类资产的转换规则。
- **大量资产（>50 个 skill）**：建议按用户提的优先级分批迁移，每批验证后再继续。
