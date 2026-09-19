# Conversion Rules — 资产转换规则

## 1. Skills 转换

这些工具的 Skill 格式高度趋同，但必须检查工具依赖和权限语义。dsh 迁移先读 [dsh 适配说明](dsh.md)，不能把插件工具名直接视为可用。检查清单：

```
skill-name/
├── SKILL.md          ← 必须有；frontmatter 必须含 name、description
├── scripts/          ← 通用，直接带
├── references/       ← 通用，直接带
└── assets/           ← 通用，直接带
```

**剔除清单**（迁出时删除，不属于通用格式）：
- `_user_meta.json`（WorkBuddy 元数据）
- `*.zip` 残留包（Codex 里常见）
- `node_modules/`、`__pycache__/`
- skill 内写死的绝对路径：检查 SKILL.md 正文和 scripts 里是否引用了源工具的主目录（如 `~/.claude/...`），迁移到其他工具时改成目标工具路径或相对路径。

**frontmatter 兼容性**：`name`、`description` 所有工具都认。`compatibility`、`allowed-tools`、`model` 等扩展字段目标不识别时会忽略，保留无害但建议在报告中注明。

## 2. MCP 转换（格式矩阵）

源里每台服务器按 stdio / HTTP 两类处理：

### 2.1 stdio 型（本地命令）

| 工具 | 格式 |
|------|------|
| [CC] / ZCode / Cursor | `"name": {"command": "npx", "args": ["-y", "pkg"], "env": {...}}` |
| Codex | `[mcp_servers.name]` + `command`、`args`、`[mcp_servers.name.env]` |
| OpenCode | `"name": {"type": "local", "command": ["npx", "-y", "pkg"], "environment": {...}}` |
| WorkBuddy | 多为 HTTP 连接器；stdio 型不原生支持，迁入时建议改为 HTTP 端点或跳过并注明 |

### 2.2 HTTP 型（远程）

| 工具 | 格式 |
|------|------|
| [CC] / ZCode / Cursor | `"name": {"type": "http", "url": "...", "headers": {...}}`（sse 用 `"type": "sse"`） |
| Codex | `[mcp_servers.name]` + `url = "..."`（`experimental_use_rmcp_client` 视版本） |
| OpenCode | `"name": {"type": "remote", "url": "...", "headers": {...}}` |
| WorkBuddy | `"name": {"type": "streamableHttp", "url": "...", "timeout": 60000}` |

### 2.3 高频坑

1. **启用/禁用语义相反**：[CC] 无此字段（默认启用）、Cursor `"disabled": true`、WorkBuddy `"disabled": true`、Codex `enabled = false`。迁移时统一换算成目标语义，禁用的服务器迁移后保持禁用。
2. **Windows 路径转义**：JSON 里 `"D:\\Users\\..."` 双反斜杠；TOML 用单引号字面量 `'D:\Users\...'` 最省事。
3. **`env` 键名不同**：OpenCode 用 `environment`，其余用 `env`。
4. **headers 认证**：HTTP 型带 `"headers": {"Authorization": "Bearer xxx"}` 时，token 属凭据——迁移结构但把值替换为 `<REPLACE_ME>`，提醒用户手工填。
5. **合并而非替换**：目标文件已有 mcpServers 时，逐台合并；同名服务器若配置不同，保留目标版本并报告差异（目标可用是经过验证的）。
6. **Codex TOML 手工编辑**：改 `config.toml` 前备份为 `config.toml.bak-<timestamp>`；TOML 解析失败会让 Codex 起不来。

## 3. Agents 转换

### 3.1 [CC] → OpenCode / Cursor

```markdown
# 源（[CC] ~/.claude/agents/reviewer.md）
---
name: reviewer
description: 代码审查专家
tools: Read, Grep, Bash     ← 目标语法不同则删
model: sonnet               ← 目标无此概念则删
---
系统提示词正文...
```

- OpenCode：frontmatter 改为 `description` + `mode: subagent`；`name` 由文件名承担。
- Cursor：保留 `name`/`description` 即可。
- `tools` 白名单语法各家不同（逗号分隔 vs 数组 vs 对象）。必须保留限制语义；拿不准时停止该项自动迁移并报告，不能删除限制后默许继承全部工具。

### 3.2 → Codex / WorkBuddy（无原生 agents）

降级为 **Skill**：把 agent 的指令正文写成 `SKILL.md`（frontmatter 取 name/description），放进目标 skills 目录。报告里注明"agent 以 skill 形式落地，调用方式从自动委派变为显式触发"。

## 4. Memory / 全局指令转换

### 4.1 全局指令

| 源 → 目标 | 做法 |
|-----------|------|
| CLAUDE.md → AGENTS.md | 语义迁移：读源文件 → 保留其结构 → 写/合并到目标。目标已有 AGENTS.md 时**合并段落**而非覆盖：新增段落追加，冲突段落（同名小节）列出差异问用户 |
| CLAUDE.md → WorkBuddy | 拆两半：工具行为约束 → `IDENTITY.md`；用户偏好/背景 → `USER.md` |
| AGENTS.md → CLAUDE.md | 同语义迁移，方向相反 |

原则：全局指令是"给 AI 的话"，不是配置数据。**不要原文照搬引用本地路径的行**——`~/.Codex/rules/` 这类路径在目标工具不存在，改写或删除。

### 4.2 项目记忆

逐文件复制 markdown（记忆文件是自包含的），冲突处理：

1. **目标无该记忆** → 直接复制。
2. **同名文件两边都有** → diff；内容一致跳过；不一致时合并（保留双方条目、去重）或问用户。
3. **MEMORY.md 索引** → 行级合并：目标索引追加源索引中目标没有的行。
4. **项目对应**：[CC] 的 `D--Users-x-proj` 与 ZCode 的 `<hash>` 目录名对不上，需用户确认项目实际路径后再落到目标目录；找不到对应项目时先放到一个 `migrated-<源项目名>/` 临时目录并在报告中说明。

### 4.3 时间与事实性

记忆文件里可能有"当前分支是 X"这类时效内容，照搬即可（记忆本就带时间戳语义），但报告中提醒用户抽查。

## 5. 迁移报告模板

```markdown
# 迁移报告：<源> → <目标>（<日期>）

## 已迁移
- skills: a, b, c（3 个，目录整拷，剔除 _user_meta.json）
- MCP: context7（stdio）、figma（HTTP）（2 台，合并进目标 config，1 台同名保留目标版）
- agents/memory: ...

## 跳过（含原因）
- tavily-search: headers 带 token，需用户手工填 key
- ~/.codex/rules/*: Codex 特有格式，无对应物

## 需要用户后续动作
1. 重启 <目标工具>
2. 在 <目标> 重新登录凭据
3. 填入 <REPLACE_ME> 的 API key

## 回滚
删除以下文件即完全回滚：...（逐个列出迁入路径）
```
