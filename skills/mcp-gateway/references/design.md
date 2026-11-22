# MCP 网关设计说明（mcp-gateway）

本机所有 AI 工具（Claude Code / Codex / 任何支持 Streamable HTTP 的客户端）**共用一份 MCP 服务进程**。

## 为什么

stdio 型 MCP 是「一个客户端一个进程」。7 个 Claude 会话 = 7 份 cmdb / mysql / feishu 进程，每份各自持有独立的会话与凭证，于是：

1. **内存与数据库连接数随会话数线性膨胀**（实测 49 进程 / 1.9GB）
2. **共享凭证的 server 互相顶号**——CMDB 单会话登录、飞书 refresh_token 一次性轮转，
   多份进程各登一次就把别人顶掉，表现为「几十秒就要重新登录」

改成「网关常驻一次 + 客户端用 HTTP 连它」后，进程、会话、凭证都只有一份。

## 架构

```
Claude 会话 A ─┐
Claude 会话 B ─┼─ HTTP /mcp ─→ [ gateway.js ] ─stdio─→ internal-cmdb
Codex        ─┤                           ├─stdio─→ mysql-a
其它 AI 工具 ─┘                           ├─stdio─→ mysql-b
                                          ├─stdio─→ mysql-c
                                          ├─stdio─→ tavily-search
                                          ├─stdio─→ figma
                                          └─stdio─→ feishu-kb
```

- 后端保持 **stdio**：easy-mysql / tavily 这类第三方包只实现了 stdio，改不动
- 对外只暴露 **一个 Streamable HTTP 端点** `/mcp`
- 工具名统一加前缀 `<后端>__<工具>`，如 `internal-cmdb__list_jobs`、`mysql-a__query`
- 多个客户端并发调用同一后端时，网关内部串行化，不会把 stdio 管道写乱

## 后端清单

后端定义在 `~/.claude/mcp-gateway/backends.json`（独立于 CLI 配置，避免自我引用）。
格式与 MCP 配置一致（模板见 [`backends.example.json`](backends.example.json)）：

```json
{
  "internal-cmdb": {
    "command": "node",
    "args": ["/path/to/cmdb-mcp/index.js"],
    "env": { "CMDB_BASE_URL": "https://cmdb.example.internal" }
  }
}
```

可选字段 `tools`：字符串数组，只暴露白名单内的工具（用于只读场景收敛攻击面）。

### 后端环境变量覆盖（`env-overrides.json`）

```json
{ "cmdb": { "CMDB_ALLOW_RELOGIN": "confirm" } }
```

**为什么需要它**：`.claude.json` 里 `mcpServers.gateway.env` 是给 **Claude Code 客户端**读的，
网关是独立常驻进程，启动时并不会拿到 —— 在那里配后端行为不生效。
想让「某个后端在网关里跑成什么行为」，只能写 `env-overrides.json`。

典型用途：cmdb 会话失效时**先问再登**（`confirm`）。CMDB 是单会话登录，后台登一次会把用户浏览器里的
会话顶掉，所以默认只跟随本机会话文件，失效时返回 `needsConfirm` 让调用方去问用户。
取值：`confirm`（默认，先问）/ `false`（永不登录）/ `true`（失效即登）。改完需重启网关。

## 运维要点

| 场景 | 处理 |
|---|---|
| 网关没起来，客户端报连接失败 | `node gateway.js` 启动；或靠开机自启（autostart + 计划任务） |
| 某个后端挂了 | 网关下次调用自动重连；`--status` 看 `last_error` |
| 改了 `backends.json` | 重启网关（`--stop` 再启动） |
| 想回退到「每个客户端各自起 MCP」 | 把 `~/.claude.json` 里 `_disabledMcpServers` 的条目复制回 `mcpServers`，删掉 `gateway` |
| 想看占用 | `--status` 有 uptime/sessions/后端列表 |

## 已知限制

- **网关是单点**：它没起来时所有 MCP 工具不可用。用开机自启兜底（autostart.cmd + 计划任务）
- 工具名变了（加了前缀），如果某个 skill 里写死了旧工具名（如 `mcp__cmdb__list_jobs`），需要同步改成 `mcp__gateway__cmdb__list_jobs`
- 目前只有后端进程间隔离，没有鉴权：监听 127.0.0.1，仅本机可访问
