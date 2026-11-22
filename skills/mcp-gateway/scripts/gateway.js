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
 *   node gateway.js --stop       停止
 *
 * 环境变量：
 *   MCP_GATEWAY_PORT   监听端口，默认 8808
 *   MCP_GATEWAY_HOST   监听地址，默认 127.0.0.1（只给本机用）
 *   MCP_GATEWAY_IDLE   无客户端连接时的空闲退出秒数，0=常驻（默认 0）
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const HOST = process.env.MCP_GATEWAY_HOST || '127.0.0.1';
const PORT = Number(process.env.MCP_GATEWAY_PORT || 8808);
const IDLE_EXIT_SEC = Number(process.env.MCP_GATEWAY_IDLE || 0);
const HOME = process.env.HOME || process.env.USERPROFILE || '.';
const STATE_DIR = path.join(HOME, '.claude', 'mcp-gateway');
const PID_FILE = path.join(STATE_DIR, 'gateway.pid');

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
    if (cfg.type && cfg.type !== 'stdio') continue;         // http/sse 型本来就共享，不需要再包一层
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
      const transport = new StdioClientTransport({
        command: this.spec.command,
        args: this.spec.args,
        env: { ...process.env, ...this.spec.env },
        stdio: 'pipe',
      });
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
      console.error(`[gateway] 后端 ${this.name} 连接失败：${this.lastError}`);
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
    return {
      name: this.name,
      connected: !!this.client,
      tools: this.tools.length,
      last_error: this.lastError || undefined,
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
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `未知后端：${backendName}。可用：${[...getBackends().keys()].join(', ')}`,
        }],
      };
    }
    try {
      return await backend.call(toolName, req.params.arguments || {});
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
  }, null, 2));
}

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

  if (IDLE_EXIT_SEC > 0) {
    let idleSince = Date.now();
    setInterval(() => {
      if (sessions.size === 0) {
        if (Date.now() - idleSince > IDLE_EXIT_SEC * 1000) {
          console.error('[gateway] 空闲超时，退出');
          shutdown();
        }
      } else {
        idleSince = Date.now();
      }
    }, 5000).unref();
  }
}
