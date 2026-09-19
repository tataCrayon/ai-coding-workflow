# dsh 适配说明（DeepSeek Harness）

> 依据：官方仓库 0.1.6-alpha.1 源码 + 本机安装的 npm 0.1.5-rc.1 实测核对（2026-09-17）。dsh 处于快速迭代期，迁移前用当前版本复核关键路径。

dsh 是 all-plugin 的 agent harness（npm 包 `@deepseek-ai/dsh`，bin 为 `dsh`）。它能消费其他工具的**部分**资产，但配置体系（Cordis 分层 patch）与权限模型（沙箱/审批）和六家工具差异大。**迁移 = 复制 + 显式声明，不是等价替换。**

## Skills（可迁，先做）

发现顺序（后写入覆盖先写入，customSkillDirs 最高，超出六工具经验，需逐版本复核；rc.1 与 0.1.6 实测相同）：

| 优先级 | 路径 |
|--------|------|
| 100 | `<project>/.dsh/skills/` |
| 200 | `<project>/.agents/skills/` |
| 300 | `customSkillDirs` 配置项 |
| 400 | `$DSH_HOME/skills/`（默认 `~/.dsh/skills`） |
| 500 | `$DSH_AGENTS_HOME/skills/`（默认 `~/.agents/skills`） |

- 迁入首选 `$DSH_HOME/skills/`（用户级，优先级高）。项目根取最近含 `.git` 的祖先目录；就近作用域的优先级可覆盖跨注册点的 rank 比较。若已有共享目录（如 `~/.agents/skills`），先盘点避免重复；`.claude/skills`、`.zcode/skills` **不在**默认发现根里。
- frontmatter 需 `name` + `description`，name 必须过 dsh 的 kebab-case 校验；可选调用字段仅 `disable-model-invocation` 与 `user-invocable`（camelCase 会被拒）。支持 `<name>/SKILL.md` 目录或 `<name>.md` 单文件，不递归扫描。校验方式同通用规则。
- **工具名 ≠ 可用工具**：源 Skill 里的工具引用（如 Read/Bash/Edit）在 dsh 对应不同插件（fs/bash 等），迁移后需人工核对可用性，不能只改文件。

## MCP（需转换，格式完全不同）

**没有 `mcp.json` / `mcpServers`。** 用户级 MCP 以 Cordis YAML patch 写入 `$DSH_HOME/cordis.patch.yml`（所有 profile 生效）或 `$DSH_HOME/profiles/<name>/cordis.patch.yml`（单 profile）。分层顺序（rc.1 实测）：bundles → profile patch → `$DSH_HOME/cordis.patch.yml` → `--patch`，**home patch 优先于 profile patch**。

每台服务器的 schema（rc.1 与 0.1.6 一致）：

```yaml
- insert:
  - id: memory-my-server            # Cordis plugin id，唯一
    name: '@deepseek-ai/dsh-mcp-client'
    config:
      serverName: my-server
      transport: stdio            # 或 streamable-http
      command: npx                # stdio 型
      args: ["-y", "pkg"]
      env: {}
      cwd: ''
```

- HTTP 型用 `transport: streamable-http` + `url` + `headers`；`serverName` 限 `[A-Za-z0-9_-]{1,32}`。旧版 rc.1 无 `maxInstructionBytes`（0.1.6 文档才有），别照新文档照抄全部字段。
- **`env` 必须显式写**：dsh 默认剥离子进程的凭据类环境变量（含 `DSH_*`），源里靠系统环境变量传递的 key 不会自动透传。
- **凭据**：secret 走 `!!js process.env.MCP_TOKEN` 表达式；`!!js`（两个叹号）是合法标签，`!js` 不是。子进程环境默认剥离凭据类变量（名字命中 `KEY|PASSWORD|SECRET|TOKEN` 及 `DSH_*`），显式 `config.env` 再叠加覆盖。迁移中**不内联明文 secret**，用 env 引用占位并提醒用户自填。
- **id 冲突 = 整体替换 config（不是深合并）**：同名 id 会整段替换，不是字段合并。合并目标已有 patch 时按 id 逐台比对，冲突先报告。
- **禁用语义**：MCP config 无 `disabled` 字段；禁用要作用在 Cordis 插件 entry 上（`disabled: true`），语义与 Cursor/WorkBuddy 相反。
- YAML 中的 `!!js` 会执行 JS：**迁移工具不得求值 YAML，只做文本级插入**；写入前提示用户检查。

## Agents / 子代理（不等价，需人工）

dsh 的等价物是 **agent preset**：`$DSH_HOME/.agent-presets/<id>/agent.cordis.yml` + `preset.yml`（展示元数据），不是 Claude 式 `.md` 文件。内置 preset id 优先于用户同名 id。没有官方 `.md` → preset 自动转换器；已有工具的 agents 文件不直接可用，需手工构建 preset，工具/沙箱/审批限制需逐项映射。**不能自动迁移，只能生成草稿 + 人工确认。**

## Memory / 全局指令

- **项目记忆**：dsh 无原生 memory store，官方推荐外接 memory MCP server。其他工具的 memory 文件**不能作为 dsh 记忆直接生效**；可作为参考文档放入项目，或迁给外部 memory MCP。
- **全局指令**：`$DSH_HOME/AGENTS.md`（固定单文件）。
- **项目指令**：项目根到 cwd 逐层读 `AGENTS.md` / `CLAUDE.md`，再附加 `AGENTS.local.md` / `CLAUDE.local.md`；宽→窄合并，相邻层级内容完全相同的小节去重。此为 0.1.6 文档行为，rc.1 未逐项核对，用前复核。
- 语义迁移原则同通用规则；引用源工具本地路径的行改写或删除。

## 盘点

`scan_inventory.py dsh [--dsh-project <项目根>]`：
- 只列文件与候选路径，**不求值 Cordis YAML**（避开 `!!js` 副作用），MCP count 返回 `null` + `manual-review-required`。
- 区分 `~/.dsh` 与 `~/.agents`（共享目录，可能是其他工具的 skill 来源），报告 skill 来源路径避免误判。
- 凭据、会话、配置值一律不读。

## 明确不支持自动迁移

- Hooks（各工具私有，dsh 有自己的 hook 插件体系）
- 权限/沙箱/审批策略的等价换算（模型不同，只能人工映射）
- 凭据、OAuth、token（含 patch YAML 里的明文 secret——迁移时替换为 env 引用）
- 其他工具的 agents 目录直迁（见上，需人工构建 preset）
- 项目记忆 → dsh 原生记忆（无此概念）

## 迁移报告必须包含

除通用模板外，dsh 迁移额外声明：目标 dsh 版本、patch 文件写入位置与层级、`!!js`/env 占位清单（需用户自填）、skill 工具名核对结果、agent preset 是否仅生成草稿。写入 patch 前 `cp cordis.patch.yml cordis.patch.yml.bak-<ts>`，回滚先删迁入项再还原备份。
