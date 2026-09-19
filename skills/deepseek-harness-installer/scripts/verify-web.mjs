import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, isAbsolute } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const entry = process.argv[2];
if (!entry || !isAbsolute(entry)) {
  console.error('Usage: node verify-web.mjs <absolute-global-dsh-bin-path>');
  process.exit(2);
}
await access(entry);
const home = await mkdtemp(join(tmpdir(), 'dsh-install-check-'));
const env = { ...process.env, DSH_HOME: home };
delete env.DEEPSEEK_API_KEY;
let child;
let exited = false;
let spawnError;
let output = '';
let interrupted = false;
let report = { status: 'failed', phase: 'startup' };
const onSignal = () => { interrupted = true; };
process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);
const redact = text => text.replace(/([?&]token=)[^\s&"']+/gi, '$1[REDACTED]')
  .replace(/sk-[A-Za-z0-9_-]+/g, '[REDACTED]');

try {
  child = spawn(process.execPath, [entry, 'web', '--host', '127.0.0.1', '--port', '0', '--no-open'], {
    cwd: home, env, stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32', windowsHide: true,
  });
  child.on('error', error => { spawnError = error; });
  child.on('exit', () => { exited = true; });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', data => { output = (output + data.toString()).slice(-131072); });
  }
  const deadline = Date.now() + 90000;
  let url;
  while (Date.now() < deadline) {
    if (interrupted) throw new Error('Interrupted');
    if (spawnError) throw spawnError;
    if (exited) throw new Error('Test process exited before readiness');
    const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/\?token=[A-Za-z0-9_-]+/);
    if (match) { url = new URL(match[0]); break; }
    await delay(200);
  }
  if (!url) throw new Error('No authenticated loopback URL within 90 seconds');
  report.phase = 'authenticated-http';
  const origin = url.origin;
  const cookies = new Map();
  let response;
  for (let redirects = 0; redirects <= 5; redirects++) {
    if (interrupted || exited) throw new Error('Test process stopped during HTTP check');
    response = await fetch(url, {
      redirect: 'manual', signal: AbortSignal.timeout(10000),
      headers: { cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; ') },
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0];
      const equals = pair.indexOf('=');
      if (equals > 0) cookies.set(pair.slice(0, equals), pair.slice(equals + 1));
    }
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get('location');
    if (!location) throw new Error('Redirect has no Location');
    const next = new URL(location, url);
    if (next.origin !== origin) throw new Error('Refusing non-local or cross-origin redirect');
    await response.body?.cancel();
    url = next;
  }
  if (response.status !== 200) throw new Error(`Authenticated HTTP status ${response.status}`);
  if (!response.headers.get('content-type')?.includes('text/html')) throw new Error('Response is not HTML');
  const html = await response.text();
  if (!/<title>\s*DeepSeek Harness\s*<\/title>/i.test(html)) throw new Error('Unexpected page title');
  report = { status: 'passed', phase: 'authenticated-http', httpStatus: 200, origin,
    scope: 'Isolated Web startup only; model APIs and native tools not tested' };
} catch (error) {
  report.error = redact(error.message);
  // Raw application logs can contain credentials beyond the known token pattern.
  report.logHint = 'Startup logs withheld; rerun locally for targeted diagnosis if needed';
  process.exitCode = 1;
} finally {
  let stopped = !child?.pid || !!spawnError;
  if (child?.pid && !spawnError) {
    if (process.platform === 'win32') {
      if (!exited) {
        const result = spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
          stdio: 'pipe', windowsHide: true, timeout: 10000,
        });
        stopped = result.status === 0;
      } else {
        stopped = false;
      }
    } else {
      try {
        process.kill(-child.pid, 'SIGTERM');
        await delay(1000);
        try { process.kill(-child.pid, 'SIGKILL'); } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
        stopped = true;
      } catch (error) { stopped = error.code === 'ESRCH'; }
    }
    for (let i = 0; !exited && i < 25; i++) await delay(200);
    stopped = stopped && exited;
  }
  report.cleanup = stopped ? 'passed' : 'unconfirmed';
  if (stopped) {
    try { await rm(home, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 }); }
    catch { report.cleanup = 'temporary-directory-retained'; report.temporaryHome = home; process.exitCode = 1; }
  } else {
    report.temporaryHome = home;
    report.testPid = child?.pid;
    report.status = 'failed';
    process.exitCode = 1;
  }
  process.removeListener('SIGINT', onSignal);
  process.removeListener('SIGTERM', onSignal);
  console.log(JSON.stringify(report, null, 2));
}
