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
                                          ├─stdio─→ feishu-kb
                                          └─sse───→ ide-mcp（IDE 内置 MCP，可选）
```

- 后端**多数保持 stdio**：easy-mysql / tavily 这类第三方包只实现了 stdio，改不动
- 远程后端（`type: "sse"` / `"http"`）不启子进程，网关直接连它的 URL；配 `optional: true`
  时端点不在（IDE 没开）静默跳过，不刷错误日志、不影响其它后端
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
**白名单在 `tools/list` 和 `tools/call` 两侧都生效**——被裁掉的工具既看不到也调不通。
只过滤 `tools/list` 的话，白名单就只是"藏起来"而不是"关掉"。

### 远程（sse / http）后端

```json
{
  "ide-mcp": {
    "type": "sse",
    "url": "http://127.0.0.1:64343/sse",
    "optional": true,
    "tools": ["get_file_problems", "lint_files", "..."]
  }
}
```

**为什么值得收编**：IDE 内置 MCP 一类服务常常一上来就暴露几十个工具、上百 KB schema
（实测 57 工具 / 138KB ≈ 42k tokens），真正常用的不到十几个。走网关可以用 `tools`
白名单裁到十几个（≈3KB），同时把这些配置从各个仓的 `.mcp.json` 收到一处。
代价：工具前缀从 `mcp__idea__*` 变成 `mcp__gateway__idea__*`，写死旧名字的脚本要改。

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

## 常驻保障

网关是单点，所以常驻要做成三层，而不是只靠"开机自启"：

| 层 | 机制 | 说明 |
|---|---|---|
| 开机/登录 | 启动文件夹快捷方式 → `autostart.cmd` → `watchdog.ps1` | 判活，健康则什么都不做 |
| 周期巡检 | 计划任务（每 5 分钟）→ `watchdog.ps1` | 网关崩了 5 分钟内自动拉起 |
| 日志 | `gateway.err.log` / `gateway.out.log` / `watchdog.log` | watchdog 每次重启前轮转，保留一份 `.1` |

`watchdog.ps1` 的判据只有一条：`/health` 是否返回带 `pid` 的 JSON。进程在但端口不应答 →
等 5 秒复查 → 仍不应答则强杀重启；端口被别的进程占着 → 放弃并记日志（不盲目拉第二个）。

### 三个 Windows / PowerShell 坑（踩过，别改回去）

1. **PS 5.1 的 `Invoke-RestMethod` 会走系统代理**。本机开着系统代理时，连 `127.0.0.1` 的健康检查也会失败，
   表现为"网关明明活着，看门狗却一直重启"——所以 `Test-Health` 用 `HttpWebRequest` 并显式 `Proxy = $null`。
2. **ps1 里有中文必须存成 UTF-8 with BOM**。无 BOM 时 PS 5.1 按 GBK 解析，字符串内的引号会被吃掉，
   报一堆莫名其妙的 `字符串缺少终止符`。
3. **不能用 `-Wait` / `HasExited` 等带 `-RedirectStandard*` 的子进程**。PS 5.1 下会挂住，
   让看门狗自己变成僵尸。只轮询 HTTP 就够。

另外：若同时有「定期杀长时间运行的 node 进程」的清理任务，**必须把网关及其子孙进程列入白名单**
（见 [`zombie-cleanup.ps1`](zombie-cleanup.ps1)），否则网关每周必被杀一次。

## 调用日志与持续优化

「哪个工具真在用、哪个后端老失败」不能靠拍脑袋。每次 `tools/call` 都会落一行 JSONL：

```
~/.claude/mcp-gateway/logs/calls-YYYY-MM-DD.jsonl
{"at":"2026-11-26T07:58:07.883Z","backend":"feishu-kb","tool":"knowledge_status","ok":true,"ms":4}
```

- **按天一个文件**，默认保留 **90 天**（`MCP_GATEWAY_LOG_DAYS` 可改），过期文件在写入时顺手删掉
- 写失败一律忽略——日志不能反过来影响调用
- 内存里另有最近 50 条的环形缓冲，只服务面板的「最近调用」，重启即清空；
  **跨重启的统计一律读落盘 JSONL**

`/usage?days=N` 把日志聚合成「每个工具一行」，另外把**白名单里但窗口内零调用**的工具单独列出来——
这就是持续优化的抓手：

| 现象 | 动作 |
|---|---|
| 白名单工具长期零调用 | 从 `backends.json` 的 `tools` 里删掉，schema 少一点 |
| 某工具失败率高 / 耗时长 | 看是不是后端问题，或换更轻的替代工具 |
| 某后端整体零调用 | 考虑整个后端下线 |
| 某工具调用量大 | 保持别动；判断它是否该提到更显眼的位置 |

**必须跑够样本再裁**：日志从启用那天开始记，头一两周的数据不足以判断「长期不用」——
一周用一次但很关键的工具（搜索、发布）最容易被误裁。

## 只读面板

```
http://127.0.0.1:8808/dashboard        # 浏览器打开（HTML，每 3 秒自刷新）
curl -H 'accept: application/json' http://127.0.0.1:8808/dashboard   # 脚本取 JSON
curl 'http://127.0.0.1:8808/usage?days=30'                            # 工具使用情况（跨重启）
```

面板内容：网关 pid / uptime / RSS、各后端类型与状态、最近 50 次调用、工具使用情况
（次数 / 失败 / 平均与最慢耗时 / 距今多久没叫）、白名单零调用清单、watchdog 与 gateway 日志尾部。
单文件 HTML 内嵌在 `gateway.js`，无前端依赖、无外部请求。

## 运维要点

| 场景 | 处理 |
|---|---|
| 网关没起来，客户端报连接失败 | 跑一次 `watchdog.ps1`（或双击启动文件夹里的快捷方式） |
| 想确认是否健康 | `node gateway.js --status` 或 `curl http://127.0.0.1:8808/health` |
| 看不出来为什么重启 | 看 `watchdog.log`（每次判活/重启都有时间戳） |
| 某个后端挂了 | 网关下次调用自动重连；`--status` 看 `last_error` |
| 改了 `backends.json` | 重启网关（`--stop` 再启动） |
| 想回退到「每个客户端各自起 MCP」 | 把 `~/.claude.json` 里 `_disabledMcpServers` 的条目复制回 `mcpServers`，删掉 `gateway` |
| 想看历史用量 | `node gateway.js --usage 30` |

## 已知限制

- **网关是单点**：靠 watchdog + 计划任务兜底，最长中断约等于巡检间隔（默认 5 分钟）
- 工具名变了（加了前缀），如果某个 skill 里写死了旧工具名（如 `mcp__cmdb__list_jobs`），需要同步改成 `mcp__gateway__cmdb__list_jobs`
- 只有后端进程间隔离，没有鉴权：监听 127.0.0.1，仅本机可访问
- 日志只有调用元数据（后端/工具/耗时/成败），**不记入参与返回值**——要排查具体参数得另开调试日志
