/**
 * MCP 网关 —— 本机所有 AI 工具（Claude Code / Codex / 其它）共用一份 MCP 服务进程。
 *
 * 为什么需要它：
 *   stdio 型 MCP 是「一个客户端一个进程」。7 个 Claude 会话 = 7 份 cmdb / mysql / feishu 进程，
 *   每份各自持有独立的会话状态与凭证，于是出现两件坏事：
 *     1) 内存与数据库连接数随会话数线性膨胀
 *     2) 共享凭证的 server（CMDB 单会话登录、飞书 token 轮转）互相顶号 → 频繁要求重新登录
 *   改成「网关常驻一次 + 各客户端用 HTTP 连它」后，进程只有一份，会话与凭证也只有一份。
 *
 * 设计要点：
 *   - 网关用 stdio 拉起真实 MCP server 作为后端（不需要改这些 server 的代码）
 *   - 对外只暴露一个 Streamable HTTP 端点 /mcp，工具名统一加前缀 `<后端>__<工具名>` 避免重名
 *   - 多个客户端同时连接时共享同一批后端连接；后端进程挂掉会在下次调用时自动重连
 *   - 后端保持 stdio 是因为 easy-mysql / tavily 这类第三方包只实现了 stdio
 *
 * 用法：
 *   node gateway.js              启动（默认 127.0.0.1:8808）
 *   node gateway.js --status     查看网关与后端状态
 *   node gateway.js --usage 30   近 30 天工具使用情况（读 logs/*.jsonl，不看进程是否在跑）
 *   node gateway.js --stop       停止
 *
 * 环境变量：
 *   MCP_GATEWAY_PORT   监听端口，默认 8808
 *   MCP_GATEWAY_HOST   监听地址，默认 127.0.0.1（只给本机用）
 *
 * 关于「空闲退出」：曾经有 MCP_GATEWAY_IDLE，但它依赖 sessions.size，
 * 而本网关用的是 stateless transport（sessionIdGenerator: undefined，见 handleMcp），
 * 永远不会往 sessions 里写条目 —— 一旦有人设了 IDLE，网关会在启动后立刻自杀。
 * 常驻由 watchdog.ps1 负责，这个开关已删除（2026-11-26）。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const HOST = process.env.MCP_GATEWAY_HOST || '127.0.0.1';
const PORT = Number(process.env.MCP_GATEWAY_PORT || 8808);
const HOME = process.env.HOME || process.env.USERPROFILE || '.';
const STATE_DIR = path.join(HOME, '.claude', 'mcp-gateway');
const PID_FILE = path.join(STATE_DIR, 'gateway.pid');
const LOG_DIR = path.join(STATE_DIR, 'logs');
// 调用日志保留天数。日志本身很小（一次调用一行、约 150 字节），90 天足够看出
// 「哪些工具长期没人用」，过期自动删，避免 logs/ 无限长胖。
const LOG_RETAIN_DAYS = Number(process.env.MCP_GATEWAY_LOG_DAYS || 90);

function readJsonQuiet(p) {
  try {
    // 去掉 UTF-8 BOM：Windows 下用 PowerShell/记事本写的 JSON 常带 ﻿，
    // JSON.parse 会直接报 "Unexpected token"，表现为"配置文件存在但读不出来"。
    const raw = fs.readFileSync(p, 'utf8').replace(/^﻿/, '');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readFileQuiet(p) {
  try {
    return fs.readFileSync(p, 'utf8').trim();
  } catch {
    return '';
  }
}

/**
 * 后端清单：键名即工具前缀。
 *
 * 数据源优先级：
 *   1) ~/.claude/mcp-gateway/backends.json —— 网关自己的定义（推荐，稳定且不受 CLI 配置变动影响）
 *   2) ~/.claude.json 的 _disabledMcpServers —— 从 CLI 配置迁移过来时的存档位置
 *
 * 注意不能读 mcpServers：那里现在只有一个 gateway 条目，用它当后端会自我递归。
 * 这里还额外过滤掉 gateway 自身，双保险。
 */
const BACKENDS_FILE = path.join(STATE_DIR, 'backends.json');

/**
 * 网关级的后端环境变量覆盖。
 *
 * 存在的理由：客户端的 `mcpServers.gateway.env` 是给 Claude Code 自己读的，
 * 网关是个独立常驻进程，启动时并不会拿到它。想让「某个后端在网关里跑成什么行为」
 * （例如 cmdb 不自动登录、避免顶掉用户浏览器里的会话）必须在这里配。
 *
 * 文件格式：{ "cmdb": { "CMDB_ALLOW_RELOGIN": "confirm" } }
 */
const ENV_OVERRIDES_FILE = path.join(STATE_DIR, 'env-overrides.json');

function loadEnvOverrides() {
  const own = readJsonQuiet(ENV_OVERRIDES_FILE);
  return own && typeof own === 'object' ? own : {};
}

function loadBackendSpecs() {
  const own = readJsonQuiet(BACKENDS_FILE);
  if (own && typeof own === 'object') return own;
  const saved = readJsonQuiet(path.join(HOME, '.claude.json')) || {};
  return saved._disabledMcpServers || {};
}

function buildBackends() {
  const node = process.execPath;
  const specs = loadBackendSpecs();
  const overrides = loadEnvOverrides();
  const out = {};

  for (const [name, cfg] of Object.entries(specs)) {
    if (!cfg) continue;
    if (name === 'gateway') continue;                       // 不能把自己当后端
    if (cfg.type === 'sse' || cfg.type === 'http') {
      // 远程端点（如 IDEA 内置 MCP 的 sse）：不启子进程，直接连 URL。
      // 收编它的意义是把散落在各仓 .mcp.json 的这份配置集中到一处，
      // 顺带用 tools 白名单压掉它那 57 个工具 / 138KB 的 schema。
      if (!cfg.url) continue;
      out[name] = {
        transport: cfg.type,                                // 'sse' | 'http'
        url: String(cfg.url),
        optional: !!cfg.optional,                           // 端点不在时静默跳过，不报错
        tools: cfg.tools,
      };
      continue;
    }
    if (cfg.type && cfg.type !== 'stdio') continue;         // 其它未知类型一律跳过
    out[name] = {
      command: node,
      // 原配置里的 command 可能是裸 "node"，统一换成当前 node 绝对路径，避免 PATH 差异
      args: (cfg.args || []).map(String),
      // 覆盖优先于 backends.json 里的 env：这是"网关侧行为开关"
      env: { ...(cfg.env || {}), ...(overrides[name] || {}) },
      tools: cfg.tools,   // 可选的工具白名单
    };
  }
  return out;
}

// ── 后端连接池 ──────────────────────────────────────────
class Backend {
  constructor(name, spec) {
    this.name = name;
    this.spec = spec;
    this.client = null;
    this.connecting = null;
    this.tools = [];
    this.lastError = '';
  }

  async ensure() {
    if (this.client) return this.client;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      let transport;
      if (this.spec.transport === 'sse') {
        transport = new SSEClientTransport(new URL(this.spec.url));
      } else if (this.spec.transport === 'http') {
        transport = new StreamableHTTPClientTransport(new URL(this.spec.url));
      } else {
        transport = new StdioClientTransport({
          command: this.spec.command,
          args: this.spec.args,
          env: { ...process.env, ...this.spec.env },
          stdio: 'pipe',
        });
      }
      const client = new Client({ name: `gateway:${this.name}`, version: '1.0.0' }, { capabilities: {} });
      await client.connect(transport);
      const { tools } = await client.listTools();
      const allow = Array.isArray(this.spec.tools) ? new Set(this.spec.tools) : null;
      this.tools = allow ? tools.filter((t) => allow.has(t.name)) : tools;
      this.client = client;
      this.lastError = '';
      console.error(`[gateway] 后端 ${this.name} 已连接（${this.tools.length} 个工具）`);
      return client;
    })();

    try {
      return await this.connecting;
    } catch (err) {
      this.lastError = err?.message || String(err);
      // optional 后端（如 IDEA 没开着）只记状态，不刷错误日志
      if (!this.spec.optional) {
        console.error(`[gateway] 后端 ${this.name} 连接失败：${this.lastError}`);
      }
      throw err;
    } finally {
      this.connecting = null;
    }
  }

  async call(tool, args) {
    const client = await this.ensure();
    try {
      return await client.callTool({ name: tool, arguments: args });
    } catch (err) {
      // 后端进程挂了：清掉连接，下次调用自动重连。
      // 会话/凭证都在磁盘文件里，重连不丢登录态，也不会触发额外的一次登录。
      this.client = null;
      this.lastError = err?.message || String(err);
      throw err;
    }
  }

  status() {
    const s = backendStats.get(this.name);
    return {
      name: this.name,
      connected: !!this.client,
      tools: this.tools.length,
      type: this.spec.transport ? this.spec.transport : 'stdio',
      ...(this.spec.optional ? { optional: true } : {}),
      last_error: this.lastError || undefined,
      // 自本次启动起的累计计数（跨重启的历史看 /usage）
      ...(s ? { calls: s.calls, fails: s.fails, avg_ms: Math.round(s.ms_total / s.calls) } : {}),
    };
  }
}

let backends = null;
function getBackends() {
  if (!backends) {
    backends = new Map();
    for (const [name, spec] of Object.entries(buildBackends())) {
      backends.set(name, new Backend(name, spec));
    }
  }
  return backends;
}

// ── 网关 MCP Server（每个客户端会话一个实例，共享同一批后端）──
function createGatewayServer() {
  const server = new Server({ name: 'mcp-gateway', version: '1.0.0' }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const list = [];
    for (const backend of getBackends().values()) {
      try {
        await backend.ensure();
      } catch {
        continue; // 单个后端不可用不影响其它后端，调用时会给明确报错
      }
      for (const t of backend.tools) {
        list.push({
          name: `${backend.name}__${t.name}`,
          description: `[${backend.name}] ${t.description || ''}`.trim(),
          inputSchema: t.inputSchema || { type: 'object', properties: {} },
        });
      }
    }
    return { tools: list };
  });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const full = req.params.name || '';
    const idx = full.indexOf('__');
    if (idx <= 0) {
      return {
        isError: true,
        content: [{ type: 'text', text: `工具名必须是 <后端>__<工具> 形式，收到：${full}` }],
      };
    }
    const backendName = full.slice(0, idx);
    const toolName = full.slice(idx + 2);
    const backend = getBackends().get(backendName);
    if (!backend) {
      noteCall(backendName, toolName, false, 0, 'unknown backend');
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `未知后端：${backendName}。可用：${[...getBackends().keys()].join(', ')}`,
        }],
      };
    }
    try {
      // 白名单要在调用侧也校验：只过滤 tools/list 的话，被裁掉的工具仍能直接叫通，
      // 白名单就只是"藏起来"而不是"关掉"。
      if (!backend.tools.some((t) => t.name === toolName)) {
        noteCall(backendName, toolName, false, 0, 'not in whitelist');
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `后端 ${backendName} 未暴露工具 ${toolName}${backend.tools.length ? `（白名单：${backend.tools.map((t) => t.name).join(', ')}）` : ''}`,
          }],
        };
      }
      const t0 = Date.now();
      try {
        const result = await backend.call(toolName, req.params.arguments || {});
        noteCall(backendName, toolName, !result?.isError, Date.now() - t0, result?.isError ? 'tool returned isError' : '');
        return result;
      } catch (err) {
        noteCall(backendName, toolName, false, Date.now() - t0, err?.message || err);
        throw err;
      }
    } catch (err) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `后端 ${backendName} 调用失败：${err?.message || err}\n（网关会保留该后端连接用于自动重连）`,
        }],
      };
    }
  });

  return server;
}

// ── HTTP 层 ────────────────────────────────────────────
const sessions = new Map();

async function handleMcp(req, res) {
  const sessionId = req.headers['mcp-session-id'];
  let entry = sessionId ? sessions.get(sessionId) : undefined;

  if (req.method === 'POST' && !entry) {
    const server = createGatewayServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId);
    };
    await server.connect(transport);
    entry = { server, transport };
    if (transport.sessionId) sessions.set(transport.sessionId, entry);
  }

  if (!entry) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: '未知会话，请先 initialize' } }));
    return;
  }

  await entry.transport.handleRequest(req, res);
}

async function handleStatus(req, res) {
  const status = [...getBackends().values()].map((b) => b.status());
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    pid: process.pid,
    listen: `${HOST}:${PORT}`,
    uptime_sec: Math.round(process.uptime()),
    sessions: sessions.size,
    backends: status,
    recent_calls: recentCalls,
  }, null, 2));
}

// ── 调用日志 ────────────────────────────────────────────
// 两个用途，分开存：
//   1) 环形缓冲（内存，50 条）—— /dashboard 的「最近调用」实时看
//   2) JSONL 落盘（logs/calls-YYYY-MM-DD.jsonl）—— 跨重启保留，用来回答
//      「这 80 个工具里哪些三个月没人碰过」「哪个后端天天超时」这类问题，
//      也就是「持续优化 MCP」的依据。内存里的 50 条重启就没了，不够用。
const CALL_LOG_MAX = 50;
const recentCalls = [];

// 每个后端的累计计数（自本次启动起），给仪表盘算调用热度
const backendStats = new Map();

function statOf(name) {
  let s = backendStats.get(name);
  if (!s) {
    s = { calls: 0, fails: 0, ms_total: 0, ms_max: 0, last_at: '' };
    backendStats.set(name, s);
  }
  return s;
}

function logPathFor(d = new Date()) {
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return path.join(LOG_DIR, `calls-${ymd}.jsonl`);
}

let logPruneDay = '';
function pruneOldCalls() {
  const today = new Date().toDateString();
  if (logPruneDay === today) return;
  logPruneDay = today;
  try {
    const cutoff = Date.now() - LOG_RETAIN_DAYS * 86400_000;
    for (const f of fs.readdirSync(LOG_DIR)) {
      const m = /^calls-(\d{4})-(\d{2})-(\d{2})\.jsonl$/.exec(f);
      if (!m) continue;
      if (new Date(+m[1], +m[2] - 1, +m[3]).getTime() < cutoff) {
        fs.rmSync(path.join(LOG_DIR, f), { force: true });
      }
    }
  } catch { /* logs 目录还没建好之类，无所谓 */ }
}

function noteCall(backend, tool, ok, ms, err) {
  const rec = {
    at: new Date().toISOString(),
    backend, tool, ok, ms,
    ...(err ? { error: String(err).slice(0, 200) } : {}),
  };

  recentCalls.unshift(rec);
  if (recentCalls.length > CALL_LOG_MAX) recentCalls.length = CALL_LOG_MAX;

  const s = statOf(backend);
  s.calls++;
  s.ms_total += ms;
  if (ms > s.ms_max) s.ms_max = ms;
  s.last_at = rec.at;
  if (!ok) s.fails++;

  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFile(logPathFor(), JSON.stringify(rec) + '\n', () => { /* 日志写失败不能影响调用 */ });
    pruneOldCalls();
  } catch { /* ignore */ }
}

/**
 * 从落盘日志聚合「工具使用情况」——这是持续优化的数据源。
 *
 * 输出按后端分组，每个工具给：调用次数、失败次数、平均/最慢耗时、最后一次调用时间、
 * 以及 days_since（距今多少天没被调用）。白名单里但 days_since 很大的工具，
 * 就是「可以裁掉」的候选；反过来调用量大的小工具可以考虑提升优先级。
 */
function aggregateUsage(days) {
  const since = Date.now() - days * 86400_000;
  const tools = new Map();   // "backend\0tool" -> stat
  let files = 0, lines = 0, bad = 0;

  let names = [];
  try { names = fs.readdirSync(LOG_DIR); } catch { /* 目录不存在 */ }

  for (const f of names.sort()) {
    const m = /^calls-(\d{4})-(\d{2})-(\d{2})\.jsonl$/.exec(f);
    if (!m) continue;
    // 文件名按天切分，早于窗口的整天跳过，不用读
    if (new Date(+m[1], +m[2] - 1, +m[3] + 1).getTime() < since) continue;
    files++;
    let raw = '';
    try { raw = fs.readFileSync(path.join(LOG_DIR, f), 'utf8'); } catch { continue; }
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      let r;
      try { r = JSON.parse(line); } catch { bad++; continue; }
      if (!r || !r.at || new Date(r.at).getTime() < since) continue;
      lines++;
      const key = `${r.backend}\u0000${r.tool}`;
      let t = tools.get(key);
      if (!t) {
        t = { backend: r.backend, tool: r.tool, calls: 0, fails: 0, ms_total: 0, ms_max: 0, last_at: '' };
        tools.set(key, t);
      }
      t.calls++;
      t.ms_total += r.ms || 0;
      if ((r.ms || 0) > t.ms_max) t.ms_max = r.ms || 0;
      if (!r.ok) t.fails++;
      if (r.at > t.last_at) t.last_at = r.at;
    }
  }

  const now = Date.now();
  const list = [...tools.values()].map((t) => ({
    backend: t.backend,
    tool: t.tool,
    calls: t.calls,
    fails: t.fails,
    avg_ms: Math.round(t.ms_total / t.calls),
    max_ms: t.ms_max,
    last_at: t.last_at,
    days_since: Math.round((now - new Date(t.last_at).getTime()) / 86400_000),
  })).sort((a, b) => b.calls - a.calls);

  // 白名单里但窗口内零调用的工具 = 「该不该留」的候选
  const idle = [];
  for (const b of getBackends().values()) {
    const allow = Array.isArray(b.spec.tools) ? b.spec.tools : null;
    if (!allow) continue;   // 没有白名单的后端不存在「被裁」的问题
    const used = new Set(list.filter((t) => t.backend === b.name).map((t) => t.tool));
    for (const name of allow) {
      if (!used.has(name)) idle.push({ backend: b.name, tool: name });
    }
  }

  return {
    window_days: days,
    files,
    records: lines,
    unparsable: bad,
    tools: list,
    idle_whitelisted: idle,
  };
}

// ── 只读面板 /dashboard ─────────────────────────────────
function readLogTail(file, lines) {
  try {
    return fs.readFileSync(file, 'utf8').trim().split('\n').slice(-lines);
  } catch {
    return [];
  }
}

async function handleDashboard(req, res) {
  const status = [...getBackends().values()].map((b) => b.status());
  const payload = {
    pid: process.pid,
    listen: `${HOST}:${PORT}`,
    uptime_sec: Math.round(process.uptime()),
    memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    backends: status,
    recent_calls: recentCalls,
    watchdog_log: readLogTail(path.join(STATE_DIR, 'watchdog.log'), 15),
    gateway_log: readLogTail(path.join(STATE_DIR, 'gateway.err.log'), 15),
    config_file: path.join(STATE_DIR, 'backends.json'),
  };
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

/** /usage?days=30 —— 工具使用情况，持续优化的取数入口 */
async function handleUsage(req, res, days) {
  const d = Math.min(Math.max(Number(days) || 30, 1), 365);
  const payload = {
    generated_at: new Date().toISOString(),
    log_dir: LOG_DIR,
    retain_days: LOG_RETAIN_DAYS,
    ...aggregateUsage(d),
  };
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

// 单文件 HTML 面板：不引框架、不建构建、无外部请求。浏览器直接开 http://127.0.0.1:8808/dashboard
function handleDashboardPage(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(DASHBOARD_HTML);
}

const DASHBOARD_HTML = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>MCP Gateway</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  /* 颜色角色：状态色只用于状态，且永远配 icon + 文字，不靠颜色单独表意 */
  :root{
    color-scheme: light;
    --plane:#f9f9f7; --surface:#fcfcfb; --card:#ffffff;
    --ink:#0b0b0b; --ink-2:#52514e; --muted:#898781;
    --line:#e1e0d9; --rule:#c3c2b7;
    --good:#0ca30c; --warn:#fab219; --bad:#d03b3b; --idle:#898781;
    --accent:#2a78d6; --sel:#e8eefb;
  }
  @media (prefers-color-scheme: dark){
    :root{
      color-scheme: dark;
      --plane:#0d0d0d; --surface:#1a1a19; --card:#1a1a19;
      --ink:#f0efec; --ink-2:#c3c2b7; --muted:#898781;
      --line:#2c2c2a; --rule:#383835;
      --good:#0ca30c; --warn:#fab219; --bad:#d03b3b; --idle:#898781;
      --accent:#3987e5; --sel:#1f2a3d;
    }
  }
  *{box-sizing:border-box}
  body{
    margin:0;background:var(--plane);color:var(--ink);
    font:14px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  header{
    display:flex;align-items:center;gap:14px;flex-wrap:wrap;
    padding:18px 28px;border-bottom:1px solid var(--line);background:var(--surface);
  }
  .brand{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px;letter-spacing:-.01em}
  .brand .mark{width:20px;height:20px;border-radius:6px;background:var(--accent);opacity:.9}
  .meta{display:flex;gap:18px;margin-left:auto;flex-wrap:wrap;color:var(--ink-2);font-size:12.5px}
  .meta b{font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
  .live{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-2)}
  .live .pulse{width:7px;height:7px;border-radius:50%;background:var(--good);animation:pulse 2.4s ease-out infinite}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(12,163,12,.45)}70%{box-shadow:0 0 0 7px rgba(12,163,12,0)}100%{box-shadow:0 0 0 0 rgba(12,163,12,0)}}
  @media (prefers-reduced-motion:reduce){.live .pulse{animation:none}}
  body.stale .live .pulse{background:var(--bad);animation:none}

  main{padding:24px 28px 40px;display:flex;flex-direction:column;gap:22px;max-width:1500px;margin:0 auto}

  /* KPI 行：几个头条数字用 stat tile，不画图 */
  .kpis{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
  .tile{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px 15px}
  .tile .label{font-size:12px;color:var(--muted);margin-bottom:7px}
  .tile .value{font-size:27px;font-weight:600;letter-spacing:-.02em;line-height:1.15}
  .tile .sub{font-size:12px;color:var(--ink-2);margin-top:5px}
  .tile .sub .sep{color:var(--rule);margin:0 6px}

  .grid{display:grid;gap:22px;grid-template-columns:minmax(340px,1.05fr) minmax(360px,1fr)}
  @media (max-width:1080px){.grid{grid-template-columns:1fr}}
  section{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
  .head{display:flex;align-items:baseline;gap:10px;padding:15px 18px 12px}
  .head h2{margin:0;font-size:13px;font-weight:600}
  .head .hint{font-size:12px;color:var(--muted)}
  .head .right{margin-left:auto;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}
  table{width:100%;border-collapse:collapse}
  thead th{
    text-align:left;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;
    color:var(--muted);padding:0 18px 8px;border-bottom:1px solid var(--line);
  }
  tbody td{padding:9px 18px;border-bottom:1px solid var(--line);font-size:13px;vertical-align:middle}
  tbody tr:last-child td{border-bottom:0}
  tbody tr:hover{background:var(--sel)}
  .num{font-variant-numeric:tabular-nums;color:var(--ink-2)}
  .name{font-weight:500}
  .tag{font-size:11px;color:var(--muted);border:1px solid var(--line);border-radius:5px;
       padding:1px 6px;margin-left:7px;vertical-align:1px}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px}

  /* 状态三重编码：形状(icon) + 颜色 + 文字 */
  .state{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:var(--ink-2);white-space:nowrap}
  .state .ic{width:11px;height:11px;flex:none}
  .s-ok   .ic{fill:var(--good)}
  .s-warn .ic{fill:var(--warn)}
  .s-bad  .ic{fill:var(--bad)}
  .s-idle .ic{fill:none;stroke:var(--idle);stroke-width:1.6}
  .errline{display:block;font-size:11.5px;color:var(--ink-2);margin-top:3px;
           font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
           overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:34ch}
  .empty{color:var(--muted);font-size:13px;padding:14px 18px 18px}

  pre{margin:0;padding:0 18px 16px;font:11.5px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
      color:var(--ink-2);overflow:auto;max-height:250px;white-space:pre-wrap;word-break:break-word}
  .logs{display:grid;gap:22px;grid-template-columns:1fr 1fr}
  @media (max-width:1080px){.logs{grid-template-columns:1fr}}
  .filter{display:flex;gap:6px;margin-left:auto}
  .filter button{
    font:inherit;font-size:12px;color:var(--ink-2);background:transparent;
    border:1px solid var(--line);border-radius:6px;padding:3px 10px;cursor:pointer;
  }
  .filter button[aria-pressed="true"]{background:var(--sel);border-color:var(--accent);color:var(--ink)}
  .filter button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}

  /* 使用情况：把「哪些工具真在用」摆出来，作为裁剪/保留的依据 */
  .subhead{padding:0 18px 10px;font-size:12px;color:var(--muted)}
  .bar{display:inline-block;height:6px;border-radius:3px;background:var(--accent);opacity:.55;
       vertical-align:middle;margin-right:8px;min-width:2px}
  .cold{color:var(--muted)}
  .idlewrap{padding:2px 18px 16px;display:flex;flex-wrap:wrap;gap:6px}
  .idlewrap code{font:11.5px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
       border:1px solid var(--line);border-radius:5px;padding:2px 7px;color:var(--ink-2)}
</style></head><body>
<header>
  <div class="brand"><span class="mark"></span>MCP Gateway</div>
  <span class="live"><span class="pulse"></span><span id="livetxt">连接中</span></span>
  <div class="meta">
    <span>pid <b id="m-pid">—</b></span>
    <span id="m-listen">—</span>
    <span>运行 <b id="m-up">—</b></span>
    <span>内存 <b id="m-rss">—</b></span>
  </div>
</header>
<main>
  <div class="kpis">
    <div class="tile"><div class="label">后端在线</div>
      <div class="value" id="k-backends">—</div>
      <div class="sub" id="k-backends-sub">—</div></div>
    <div class="tile"><div class="label">暴露工具</div>
      <div class="value" id="k-tools">—</div>
      <div class="sub" id="k-tools-sub">—</div></div>
    <div class="tile"><div class="label">最近调用</div>
      <div class="value" id="k-calls">—</div>
      <div class="sub" id="k-calls-sub">—</div></div>
    <div class="tile"><div class="label">调用失败</div>
      <div class="value" id="k-fail">—</div>
      <div class="sub" id="k-fail-sub">—</div></div>
  </div>

  <div class="grid">
    <section>
      <div class="head"><h2>后端</h2><span class="hint">按 tools 白名单过滤后</span>
        <span class="right" id="b-sum"></span></div>
      <table>
        <thead><tr><th>名称</th><th>类型</th><th style="text-align:right">工具</th><th>状态</th></tr></thead>
        <tbody id="tb-backends"></tbody>
      </table>
    </section>

    <section>
      <div class="head"><h2>最近调用</h2><span class="hint">最新 50 条</span>
        <div class="filter" id="flt">
          <button data-f="all" aria-pressed="true">全部</button>
          <button data-f="err" aria-pressed="false">仅失败</button>
        </div>
      </div>
      <table>
        <thead><tr><th>时间</th><th>后端 / 工具</th><th style="text-align:right">耗时</th><th>结果</th></tr></thead>
        <tbody id="tb-calls"></tbody>
      </table>
    </section>
  </div>

  <div class="logs">
    <section>
      <div class="head"><h2>Watchdog</h2><span class="hint">看门狗判活记录</span></div>
      <pre id="log-wd"></pre>
    </section>
    <section>
      <div class="head"><h2>Gateway 日志</h2><span class="hint">网关自身输出</span></div>
      <pre id="log-gw"></pre>
    </section>
  </div>

  <section>
    <div class="head"><h2>工具使用情况</h2><span class="hint">来自落盘日志，跨重启累加</span>
      <div class="filter" id="flt-days">
        <button data-d="7" aria-pressed="false">7 天</button>
        <button data-d="30" aria-pressed="true">30 天</button>
        <button data-d="90" aria-pressed="false">90 天</button>
      </div>
    </div>
    <div class="subhead" id="u-sum">加载中</div>
    <table>
      <thead><tr><th>后端 / 工具</th><th style="text-align:right">调用</th>
        <th style="text-align:right">失败</th><th style="text-align:right">平均</th>
        <th style="text-align:right">最慢</th><th style="text-align:right">最近</th></tr></thead>
      <tbody id="tb-usage"></tbody>
    </table>
    <div class="head" style="padding-top:14px"><h2>白名单里零调用</h2>
      <span class="hint">窗口内没被叫过的工具，是「可以裁掉」的候选</span></div>
    <div class="idlewrap" id="u-idle"></div>
  </section>
</main>
<script>
(function(){
  'use strict';
  var ICON = {
    ok:   '<svg class="ic" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5"/></svg>',
    warn: '<svg class="ic" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1 11.2 10.5H.8z"/></svg>',
    bad:  '<svg class="ic" viewBox="0 0 12 12" aria-hidden="true"><rect x="1.4" y="1.4" width="9.2" height="9.2" rx="1.2"/></svg>',
    idle: '<svg class="ic" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4"/></svg>'
  };
  var STATE_TEXT = { ok:'正常', warn:'休眠', bad:'不可用', idle:'空闲' };
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }
  function dur(sec){
    sec = Math.round(sec);
    if (sec < 60) return sec + ' 秒';
    var m = Math.floor(sec/60); if (m < 60) return m + ' 分';
    var h = Math.floor(m/60); return h + ' 时 ' + (m%60) + ' 分';
  }
  function chip(kind, text){
    return '<span class="state s-' + kind + '">' + ICON[kind] +
           '<span>' + esc(text || STATE_TEXT[kind]) + '</span></span>';
  }
  var filter = 'all';
  var last = null;

  function renderBackends(list){
    var ok = 0;
    for (var i = 0; i < list.length; i++) if (list[i].connected) ok++;
    document.getElementById('k-backends').textContent = ok + ' / ' + list.length;
    document.getElementById('k-backends-sub').textContent =
      ok === list.length ? '全部可用' : (list.length - ok) + ' 个未连接';
    document.getElementById('b-sum').textContent = ok + '/' + list.length + ' 在线';

    document.getElementById('tb-backends').innerHTML = list.map(function(b){
      var kind = b.connected ? 'ok' : (b.optional ? 'warn' : 'bad');
      var err = (!b.connected && b.last_error)
        ? '<span class="errline" title="' + esc(b.last_error) + '">' + esc(b.last_error.slice(0,90)) + '</span>'
        : '';
      return '<tr>' +
        '<td class="name">' + esc(b.name) + (b.optional ? '<span class="tag">可选</span>' : '') + '</td>' +
        '<td class="num">' + esc(b.type) + '</td>' +
        '<td class="num" style="text-align:right">' + b.tools + '</td>' +
        '<td>' + chip(kind) + err + '</td></tr>';
    }).join('');
  }

  function renderCalls(calls){
    var fails = calls.filter(function(c){ return !c.ok; });
    document.getElementById('k-calls').textContent = calls.length;
    document.getElementById('k-calls-sub').innerHTML = calls.length
      ? '成功 ' + (calls.length - fails.length) + '<span class="sep">·</span>失败 ' + fails.length
      : '暂无记录，调用一次工具即可看到';
    document.getElementById('k-fail').textContent = fails.length;
    document.getElementById('k-fail-sub').textContent = calls.length
      ? '失败率 ' + Math.round(fails.length / calls.length * 100) + '%' : '—';

    var rows = filter === 'err' ? fails : calls;
    document.getElementById('tb-calls').innerHTML = rows.length ? rows.map(function(c){
      return '<tr>' +
        '<td class="num">' + esc(c.at.slice(11,19)) + '</td>' +
        '<td><span class="mono">' + esc(c.tool) + '</span>' +
          '<div style="font-size:11.5px;color:var(--muted)">' + esc(c.backend) + '</div></td>' +
        '<td class="num" style="text-align:right">' + c.ms + ' ms</td>' +
        '<td>' + chip(c.ok ? 'ok' : 'bad', c.ok ? '成功' : '失败') +
          (c.error ? '<span class="errline" title="' + esc(c.error) + '">' +
                     esc(c.error.slice(0,90)) + '</span>' : '') +
        '</td></tr>';
    }).join('') : '<tr><td colspan="4" class="empty">' +
        (filter === 'err' ? '没有失败记录' : '暂无调用记录') + '</td></tr>';
  }

  function renderLog(el, lines){
    document.getElementById(el).textContent = lines && lines.length ? lines.join('\\n') : '(暂无日志)';
  }

  function rel(iso){
    if (!iso) return '—';
    var d = new Date(iso), now = new Date();
    var mins = Math.round((now - d) / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return mins + ' 分钟前';
    var h = Math.round(mins / 60);
    if (h < 24) return h + ' 小时前';
    return Math.round(h / 24) + ' 天前';
  }

  function renderUsage(u){
    var tools = u.tools || [];
    var max = 1;
    for (var i = 0; i < tools.length; i++) if (tools[i].calls > max) max = tools[i].calls;

    document.getElementById('u-sum').textContent =
      '窗口 ' + u.window_days + ' 天 · 共 ' + u.records + ' 条调用 · ' +
      tools.length + ' 个工具被用过 · 日志 ' + u.files + ' 个文件' +
      (u.unparsable ? ' · ' + u.unparsable + ' 行无法解析' : '');

    document.getElementById('tb-usage').innerHTML = tools.length ? tools.map(function(t){
      var w = Math.max(2, Math.round(t.calls / max * 90));
      var fail = t.fails
        ? '<span class="state s-bad" style="justify-content:flex-end">' + ICON.bad +
          '<span>' + t.fails + '</span></span>'
        : '<span class="num">0</span>';
      return '<tr>' +
        '<td><span class="bar" style="width:' + w + 'px"></span>' +
          '<span class="mono">' + esc(t.tool) + '</span>' +
          '<div style="font-size:11.5px;color:var(--muted)">' + esc(t.backend) + '</div></td>' +
        '<td class="num" style="text-align:right">' + t.calls + '</td>' +
        '<td class="num" style="text-align:right">' + fail + '</td>' +
        '<td class="num" style="text-align:right">' + t.avg_ms + ' ms</td>' +
        '<td class="num" style="text-align:right">' + t.max_ms + ' ms</td>' +
        '<td class="num" style="text-align:right' + (t.days_since >= 14 ? ' color:var(--muted)' : '') + '">' +
          rel(t.last_at) + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="empty">窗口内没有调用记录</td></tr>';

    var idle = u.idle_whitelisted || [];
    document.getElementById('u-idle').innerHTML = idle.length
      ? idle.map(function(x){ return '<code>' + esc(x.backend) + '__' + esc(x.tool) + '</code>'; }).join('')
      : '<span class="cold">没有——白名单里的工具都在用</span>';
  }

  function paint(d){
    last = d;
    document.body.classList.remove('stale');
    document.getElementById('livetxt').textContent = '实时 · 每 3 秒';
    document.getElementById('m-pid').textContent = d.pid;
    document.getElementById('m-listen').textContent = d.listen;
    document.getElementById('m-up').textContent = dur(d.uptime_sec);
    document.getElementById('m-rss').textContent = d.memory_mb + ' MB';

    var tools = 0, i;
    for (i = 0; i < d.backends.length; i++) tools += d.backends[i].tools;
    document.getElementById('k-tools').textContent = tools;
    document.getElementById('k-tools-sub').textContent = d.backends.length + ' 个后端已挂载';

    renderBackends(d.backends);
    renderCalls(d.recent_calls || []);
    renderLog('log-wd', d.watchdog_log);
    renderLog('log-gw', d.gateway_log);
  }

  function fail(msg){
    document.body.classList.add('stale');
    document.getElementById('livetxt').textContent = '网关不可达 · ' + msg;
  }

  function tick(){
    fetch('/dashboard', { headers: { accept: 'application/json' }, cache: 'no-store' })
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(paint)
      .catch(function(e){ fail(e.message); });
  }

  var usageDays = 30;
  function tickUsage(){
    fetch('/usage?days=' + usageDays, { cache: 'no-store' })
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(renderUsage)
      .catch(function(){ /* 面板主视图已报连接状态，这里静默 */ });
  }

  document.getElementById('flt-days').addEventListener('click', function(ev){
    var btn = ev.target.closest ? ev.target.closest('button[data-d]') : null;
    if (!btn) return;
    usageDays = Number(btn.getAttribute('data-d'));
    var all = this.querySelectorAll('button');
    for (var i = 0; i < all.length; i++) {
      all[i].setAttribute('aria-pressed', String(all[i] === btn));
    }
    tickUsage();
  });

  document.getElementById('flt').addEventListener('click', function(ev){
    var btn = ev.target.closest ? ev.target.closest('button[data-f]') : null;
    if (!btn) return;
    filter = btn.getAttribute('data-f');
    var all = this.querySelectorAll('button');
    for (var i = 0; i < all.length; i++) {
      all[i].setAttribute('aria-pressed', String(all[i] === btn));
    }
    if (last) renderCalls(last.recent_calls || []);
  });

  tick();
  tickUsage();
  setInterval(tick, 3000);
  setInterval(tickUsage, 30000);
})();
</script></body></html>`;

// ── 命令行 ──────────────────────────────────────────────
function readPid() {
  const p = Number(readFileQuiet(PID_FILE));
  return Number.isInteger(p) && p > 0 ? p : 0;
}

const argv = process.argv.slice(2);

if (argv.includes('--status')) {
  const pid = readPid();
  if (!pid) {
    console.log('网关未运行（无 pid 文件）');
    process.exitCode = 1;
  } else {
    try {
      const r = await fetch(`http://${HOST}:${PORT}/health`);
      console.log(await r.text());
    } catch (err) {
      console.log(`网关 pid=${pid} 但 /health 不可达：${err.message}`);
      process.exitCode = 1;
    }
  }
} else if (argv.includes('--usage')) {
  // 直接读本地 JSONL，不依赖网关进程活着 —— 网关挂了也能看历史
  const i = argv.indexOf('--usage');
  const days = Number(argv[i + 1]) || 30;
  const u = aggregateUsage(days);
  console.log(`窗口 ${u.window_days} 天 · ${u.files} 个日志文件 · ${u.records} 条调用` +
    (u.unparsable ? ` · ${u.unparsable} 行无法解析` : ''));
  if (!u.tools.length) {
    console.log('（窗口内没有调用记录）');
  } else {
    console.log('\n调用次数  失败  平均耗时  最慢   最近       工具');
    for (const t of u.tools) {
      console.log(
        String(t.calls).padStart(7),
        String(t.fails).padStart(5),
        `${String(t.avg_ms) + 'ms'}`.padStart(9),
        `${String(t.max_ms) + 'ms'}`.padStart(6),
        `${t.days_since} 天前`.padStart(8),
        `  ${t.backend}__${t.tool}`,
      );
    }
  }
  if (u.idle_whitelisted.length) {
    console.log(`\n白名单里零调用（${u.idle_whitelisted.length} 个，可考虑从 backends.json 的 tools 里删掉）：`);
    for (const x of u.idle_whitelisted) console.log(`  ${x.backend}__${x.tool}`);
  } else {
    console.log('\n白名单里的工具都在用。');
  }
} else if (argv.includes('--stop')) {
  const pid = readPid();
  if (!pid) {
    console.log('网关未运行');
  } else {
    try {
      process.kill(pid);
      fs.rmSync(PID_FILE, { force: true });
      console.log(`已停止网关 pid=${pid}`);
    } catch (err) {
      console.log(`停止失败：${err.message}`);
      process.exitCode = 1;
    }
  }
} else {
  await start();
}

async function start() {
  const existing = readPid();
  if (existing) {
    try {
      process.kill(existing, 0);
      console.error(`网关已在运行 pid=${existing}（端口 ${PORT}）。如需重启先 --stop`);
      process.exitCode = 1;
      return;
    } catch {
      // 进程已不存在，继续启动
    }
  }

  const httpServer = http.createServer(async (req, res) => {
    try {
      if (req.url === '/health' || req.url === '/status') return await handleStatus(req, res);
      if (req.url === '/dashboard' && req.headers.accept?.includes('text/html')) return await handleDashboardPage(req, res);
      if (req.url === '/dashboard') return await handleDashboard(req, res);
      if (req.url?.startsWith('/usage')) {
        return await handleUsage(req, res, new URL(req.url, 'http://x').searchParams.get('days'));
      }
      if (req.url === '/mcp' || req.url?.startsWith('/mcp?')) return await handleMcp(req, res);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } catch (err) {
      console.error('[gateway] 请求处理异常：', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err?.message || String(err) }));
      }
    }
  });

  await new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(PORT, HOST, resolve);
  });

  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');

  // 预热后端：让第一个客户端连上来时工具列表已就绪
  for (const b of getBackends().values()) {
    b.ensure().catch(() => { /* 单后端失败不影响网关整体 */ });
  }

  console.error(`[gateway] 已启动 http://${HOST}:${PORT}/mcp  pid=${process.pid}`);
  console.error(`[gateway] 后端：${[...getBackends().keys()].join(', ')}`);

  const shutdown = () => {
    console.error('[gateway] 正在退出…');
    for (const entry of sessions.values()) {
      try { entry.transport.close(); } catch { /* ignore */ }
    }
    for (const b of getBackends().values()) {
      try { b.client?.close(); } catch { /* ignore */ }
    }
    fs.rmSync(PID_FILE, { force: true });
    httpServer.close();
    process.exitCode = 0;
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
