# Tool Layouts — 六工具配置目录地图

> 按需查阅：迁移前先找到源和目标的对应目录。所有路径以 `~` 为用户主目录。
> 探测优先级：本文路径优先；找不到时用 `scan_inventory.py` 确认；仍找不到则该工具可能未初始化，向用户确认。

## [CC] (claude)

| 资产 | 路径 | 格式 |
|------|------|------|
| Skills（全局） | `~/.claude/skills/<name>/SKILL.md` | 标准 Skill 格式 |
| Skills（共享） | `~/.agents/skills/<name>/SKILL.md` | 同上（部分安装方式放这里） |
| Agents（子代理） | `~/.claude/agents/*.md` | frontmatter: name, description, tools, model |
| MCP（全局） | `~/.claude.json` → `"mcpServers"` 键 | JSON，stdio: command/args/env；HTTP: url/type |
| MCP（项目级） | `<project>/.mcp.json` | 同上 |
| 全局指令 | `~/.claude/CLAUDE.md` | Markdown |
| Hooks | `~/.claude/settings.json` → `"hooks"` | JSON |
| 项目记忆 | `~/.claude/projects/<路径编码>/memory/*.md` + `MEMORY.md` | Markdown；路径编码：`D:\Users\x\proj` → `D--Users-x-proj`（非字母数字转 `-`） |
| 凭据 | `~/.claude/.credentials.json`、`~/.claude.json` 内的 OAuth 字段 | ⚠️ 禁止迁移 |

## Codex

| 资产 | 路径 | 格式 |
|------|------|------|
| Skills | `~/.codex/skills/<name>/SKILL.md` | 标准 Skill 格式 |
| MCP | `~/.codex/config.toml` → `[mcp_servers.<name>]` | TOML：command/args/env，`[mcp_servers.<name>.env]` 子表 |
| 全局指令 | `~/.codex/AGENTS.md` | Markdown |
| Rules | `~/.codex/rules/*.rules` | Codex 特有，无法直接迁移 |
| Memory | `~/.codex/memories/*.md` + `MEMORY.md` | Markdown（扁平，无项目分层） |
| 凭据 | `~/.codex/auth.json` | ⚠️ 禁止迁移 |

TOML MCP 示例：
```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.context7.env]
API_KEY = "xxx"
```

## ZCode

| 资产 | 路径 | 格式 |
|------|------|------|
| Skills | `~/.zcode/skills/<name>/SKILL.md`（项目级另支持 `.zcode/skills/`） | 标准 Skill 格式 |
| Plugins | `~/.zcode/cli/plugins/` | ZCode 特有，无法直接迁移 |
| MCP | 全局 `~/.claude.json` → `"mcpServers"`（与 [CC] 共用一份）或工具内配置 | JSON 同 [CC] 格式 |
| 全局指令 | `~/.claude/CLAUDE.md` / 工作区 `AGENTS.md` / `CLAUDE.md` | Markdown |
| 项目记忆 | `~/.zcode/cli/memories/projects/<hash>/memory/*.md` + `MEMORY.md` | Markdown；目录名是项目路径 hash，需人工对应项目 |
| Agents | 无原生全局 agents 目录（`~/.zcode/cli/agents/` 是会话数据，**不是**迁移对象） | — |

## OpenCode

| 资产 | 路径 | 格式 |
|------|------|------|
| Skills | `~/.config/opencode/skill/<name>/SKILL.md`（部分版本 `skills/`） | 标准 Skill 格式 |
| Agents | `~/.config/opencode/agent/*.md` | frontmatter: description, mode(primary/subagent), model, tools |
| MCP | `~/.config/opencode/opencode.json` → `"mcp"` 键 | JSON：`{"mcp": {"name": {"type": "local"|"remote", "command": [...], "url": ...}}}` |
| 全局指令 | `~/.config/opencode/AGENTS.md` | Markdown |
| 数据 | `~/.local/share/opencode/`（db/sessions，**不是**迁移对象） | — |

> OpenCode 的 MCP stdio 是 `command` 数组（程序 + 参数合一），与其他工具的 `command`+`args` 分离不同。

## WorkBuddy

| 资产 | 路径 | 格式 |
|------|------|------|
| Skills | `~/.workbuddy/skills/<name>/SKILL.md` | 标准 Skill 格式，但可能带工具特有文件（`_user_meta.json`、`cases/`、`prompts/`）——迁出时剔除，迁入时可不带 |
| MCP（连接器） | `~/.workbuddy/connectors/<id>/mcp.json` → `"mcpServers"` | JSON，HTTP 型为主：`{"type": "streamableHttp", "url": ..., "disabled": true}` |
| 全局指令 | `~/.workbuddy/IDENTITY.md`（身份/规则）+ `USER.md`（用户画像） | Markdown |
| Memory | `~/.workbuddy/memory/<id>_memory.md` | Markdown（单文件，按会话主体分文件） |
| Agents | 无原生子代理概念 | — |
| 凭据 | `~/.workbuddy-key-fallback`、settings 内 token | ⚠️ 禁止迁移 |

## Cursor

| 资产 | 路径 | 格式 |
|------|------|------|
| Skills | `~/.cursor/skills/<name>/SKILL.md`（内置技能在 `skills-cursor/`，**不是**迁移对象） | 标准 Skill 格式 |
| Agents | `~/.cursor/agents/` | 较新版本支持 |
| MCP | `~/.cursor/mcp.json` → `"mcpServers"` | JSON 同 [CC] 格式；文件在首次配置 MCP 前不存在，需手工创建 |
| 全局指令 | `~/.cursor/AGENTS.md`；项目级 `<project>/AGENTS.md` 或 `.cursor/rules/*.mdc` | Markdown / mdc |
| Memory | 无独立全局记忆文件（靠 rules + AGENTS.md 承载） | — |

## 通用注意事项

1. **skills-cursor、plugins、sessions、db 文件**都是工具内部数据，不在迁移范围。
2. Windows 上部分工具用 `AppData\Roaming` 存状态，但**用户级配置**（skills/mcp/rules）基本都在 `~/.<tool>/`。
3. 版本演进快：迁移前若发现实际布局与本文不符，以实际为准，并把差异反馈给用户。
