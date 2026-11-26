---
name: mcp-gateway
description: "MCP 统一网关：本机所有 AI 工具（Claude Code / Codex / 任何支持 Streamable HTTP 的客户端）共用一份常驻 MCP 进程。解决 stdio 型 MCP「一客户端一进程」导致的内存膨胀，以及共享凭证 server 互顶会话（CMDB 单会话登录、飞书 token 一次性轮转）造成的频繁重新登录。触发：启动网关、网关状态、停网关、mcp 进程太多、mcp 占用高、登录互顶、频繁要求重新登录、几十秒就要重新登录、共享 mcp、mcp 网关。"
---

# mcp-gateway（MCP 统一网关）

## 为什么需要它

stdio 型 MCP 是「一个客户端一个进程」。7 个 Claude 会话 = 7 份 cmdb / mysql / feishu 进程，每份各自持有独立的会话与凭证：

1. **内存与数据库连接数随会话数线性膨胀**（实测 49 进程 / 1.9GB）
2. **共享凭证的 server 互相顶号**——CMDB 单会话登录、飞书 refresh_token 一次性轮转，
   多份进程各登一次就把别人顶掉，表现为「几十秒就要重新登录」

改成「**网关常驻一次 + 客户端用 HTTP 连它**」后，进程、会话、凭证都只有一份。这就是
「登录态统一管理」的本体：凭证的生（登录）、活（续期）、死（互顶）都收敛到一个进程。

完整设计说明见 [`references/design.md`](references/design.md)。

## 用法

```bash
cd ~/.claude/mcp-gateway

node gateway.js              # 启动（默认 127.0.0.1:8808）
node gateway.js --status     # 查看网关与各后端状态（uptime / sessions / 后端列表 / last_error）
node gateway.js --usage 30   # 近 30 天工具使用情况（读日志，网关没起也能跑）
node gateway.js --stop       # 停止
```

客户端配置（`~/.claude.json` 的 `mcpServers`）：

```json
{ "gateway": { "type": "http", "url": "http://127.0.0.1:8808/mcp" } }
```

Codex（`~/.codex/config.toml`）：

```toml
[mcp_servers.gateway]
url = "http://127.0.0.1:8808/mcp"
```

## 安装（新机器部署）

1. 部署文件：`scripts/gateway.js` → `~/.claude/mcp-gateway/gateway.js`
2. 写后端清单：复制 [`references/backends.example.json`](references/backends.example.json)
   为 `~/.claude/mcp-gateway/backends.json`，按本机实际后端修改（**真实凭证只存本机，勿入库**）
3. 可选：复制 [`references/env-overrides.example.json`](references/env-overrides.example.json)
   为 `env-overrides.json`，配置后端行为覆盖（如「会话失效先问再登」）
4. 客户端 `mcpServers` 指向 `http://127.0.0.1:8808/mcp`（原来的 stdio 条目移入 `_disabledMcpServers` 备份）
5. **常驻保障（强烈建议，否则网关是哑的单点）**：
   - `scripts/watchdog.ps1` → `~/.claude/mcp-gateway/watchdog.ps1`，**改顶部的 `$Node` 为本机 node 绝对路径**
     （ps1 必须存成 UTF-8 with BOM，否则 PS 5.1 按 GBK 解析会报语法错）
   - `scripts/autostart.example.cmd` → 启动文件夹快捷方式 / 计划任务指向它
   - 计划任务示例：`schtasks /create /tn McpGatewayWatchdog /tr "<autostart.cmd 绝对路径>" /sc minute /mo 5 /f`
6. **若本机有「定期杀长时间运行的 node 进程」的清理任务**，用 `scripts/zombie-cleanup.ps1`
   替换原逻辑——它把网关及其全部子孙列入白名单，其余规则不变。否则网关每周必被杀一次

## 调用日志与持续优化

每次工具调用落一行 JSONL 到 `~/.claude/mcp-gateway/logs/calls-YYYY-MM-DD.jsonl`，默认留 90 天。
`--usage` / `GET /usage?days=N` 聚合成「每个工具一行」，并单列**白名单里零调用**的工具——
这是「哪些工具该裁」的唯一事实来源（不要凭印象裁）。

```bash
node gateway.js --usage 30      # 网关没起也能跑：直接读日志
```

**样本要够**：日志从启用当天才开始记，头一两周不足以判断「长期不用」，
一周用一次但很关键的工具（搜索、发布）最容易被误裁。

## 运维要点

| 场景 | 处理 |
|---|---|
| 网关没起来，客户端报连接失败 | 跑一次 `watchdog.ps1`（或双击启动文件夹里的快捷方式） |
| 想确认是否健康 | `node gateway.js --status` 或 `curl http://127.0.0.1:8808/health` |
| 看不出来为什么重启 | `watchdog.log`（每次判活/重启都有时间戳） |
| 某个后端挂了 | 网关下次调用自动重连；`--status` 看 `last_error` |
| 改了 `backends.json` | 重启网关（`--stop` 再启动） |
| 想回退「每客户端各自起 MCP」 | 把 `_disabledMcpServers` 条目复制回 `mcpServers`，删掉 `gateway` |
| 想看占用与历史用量 | `--status`（当前）+ `--usage`（历史） |
| 看实时面板 | `http://127.0.0.1:8808/dashboard`（后端状态 / 最近调用 / 工具使用情况 / 日志尾部） |

## 已知限制

- **网关是单点**：它没起来时所有 MCP 工具不可用。靠 watchdog + 计划任务兜底，最长中断约等于巡检间隔
- 工具名统一加了前缀（`<后端>__<工具>`）：skill 里若写死旧工具名（`mcp__cmdb__list_jobs`），
  需同步改成 `mcp__gateway__cmdb__list_jobs`
- 后端进程间隔离、无鉴权：仅监听 127.0.0.1，本机可用
- 日志只记调用元数据，**不记入参与返回值**
