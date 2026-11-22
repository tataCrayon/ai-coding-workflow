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

node gateway.js            # 启动（默认 127.0.0.1:8808）
node gateway.js --status   # 查看网关与各后端状态（uptime / sessions / last_error）
node gateway.js --stop     # 停止
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

1. 部署文件：`gateway.js` → `~/.claude/mcp-gateway/gateway.js`
2. 写后端清单：复制 [`references/backends.example.json`](references/backends.example.json)
   为 `~/.claude/mcp-gateway/backends.json`，按本机实际后端修改（**真实凭证只存本机，勿入库**）
3. 可选：复制 [`references/env-overrides.example.json`](references/env-overrides.example.json)
   为 `env-overrides.json`，配置后端行为覆盖（如「会话失效先问再登」）
4. 客户端 `mcpServers` 指向 `http://127.0.0.1:8808/mcp`（原来的 stdio 条目移入 `_disabledMcpServers` 备份）
5. 开机自启（可选）：复制 [`scripts/autostart.example.cmd`](scripts/autostart.example.cmd)，
   改好本机 node 路径，然后注册计划任务：
   `schtasks /create /tn McpGateway /tr "<autostart.cmd 绝对路径>" /sc onlogon /rl highest /f`

## 运维要点

| 场景 | 处理 |
|---|---|
| 网关没起来，客户端报连接失败 | `node gateway.js` 启动；或靠计划任务自启 |
| 某个后端挂了 | 网关下次调用自动重连；`--status` 看 `last_error` |
| 改了 `backends.json` | 重启网关（`--stop` 再启动） |
| 想回退「每客户端各自起 MCP」 | 把 `_disabledMcpServers` 条目复制回 `mcpServers`，删掉 `gateway` |
| 想看占用 | `--status` 有 uptime / sessions / 后端列表 |

## 已知限制

- **网关是单点**：它没起来时所有 MCP 工具不可用。用开机自启兜底
- 工具名统一加了前缀（`<后端>__<工具>`）：skill 里若写死旧工具名（`mcp__cmdb__list_jobs`），
  需同步改成 `mcp__gateway__cmdb__list_jobs`
- 后端进程间隔离、无鉴权：仅监听 127.0.0.1，本机可用
