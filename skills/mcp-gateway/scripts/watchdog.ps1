<#
  MCP 网关看门狗
  ------------------------------------------------------------
  职责：保证 gateway.js 常驻。
    1) 每次运行先判活：/health 能返回带 pid 的 JSON → 直接退出
    2) 不活就清掉残留 pid、轮转日志、重新拉起，并把 stdout/stderr 落盘

  为什么需要它：网关是单点，它没起来时所有 MCP 工具不可用。2026-11-26 那次
  故障的根因就是「只有开机自启、进程崩了没人管、输出也没落盘」——从外面看
  只知道 ECONNREFUSED，查不出为什么。

  调用方：
    - 计划任务（登录时 + 每 5 分钟）
    - 启动文件夹里的快捷方式（指向本脚本）
    - 手工：powershell -NoProfile -ExecutionPolicy Bypass -File watchdog.ps1

  使用前改一处：
    $Node 必须是本机 node.exe 的绝对路径（计划任务环境里没有完整 PATH）。
    换机器/升级 node 后记得同步改这里。
#>
param(
    [string]$NodePath = '',
    [int]$Port = 8808
)

$ErrorActionPreference = 'Stop'
$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Node = if ($NodePath) { $NodePath } else { 'C:\path\to\node.exe' }
$Gw = Join-Path $Dir 'gateway.js'
$PidFile = Join-Path $Dir 'gateway.pid'
$OutLog = Join-Path $Dir 'gateway.out.log'
$ErrLog = Join-Path $Dir 'gateway.err.log'
$WdLog = Join-Path $Dir 'watchdog.log'
$MaxLogBytes = 5MB

function Write-WdLog([string]$msg) {
    $line = "{0} {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    try {
        if ((Test-Path $WdLog) -and (Get-Item $WdLog).Length -gt $MaxLogBytes) {
            Move-Item -Force $WdLog "$WdLog.1"
        }
        Add-Content -Path $WdLog -Value $line -Encoding utf8
    } catch { }
    Write-Output $line
}

function Get-GatewayProcess {
    # 用命令行而不是单纯 pid 判活：pid 会被复用，Windows 上尤其常见。
    # 匹配两种形态：绝对路径启动（计划任务/快捷方式）、在目录内 relative `node gateway.js` 启动（手工）。
    $all = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine -match 'gateway\.js("|\s)*$' }

    # 优先用 pid 文件里的 pid 精确匹配（同一台机上可能有别的 gateway.js 项目）
    $pidFromFile = 0
    if (Test-Path $PidFile) {
        $raw = "$(Get-Content $PidFile -Raw -ErrorAction SilentlyContinue)".Trim()
        if ($raw -match '^\d+$') { $pidFromFile = [int]$raw }
    }
    if ($pidFromFile -gt 0) {
        $hit = $all | Where-Object { $_.ProcessId -eq $pidFromFile } | Select-Object -First 1
        if ($hit) { return $hit }
    }

    $all | Where-Object { $_.CommandLine -like '*mcp-gateway*gateway.js*' } | Select-Object -First 1
}

function Test-Health {
    # 必须绕过系统代理：本机若开着系统代理（Clash 等本地代理端口），
    # PS 5.1 的 Invoke-RestMethod 会走 WinINET 代理，导致 127.0.0.1 的健康检查也失败，
    # 表现为「网关明明活着，看门狗却一直重启」。
    try {
        $req = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:$Port/health")
        $req.Proxy = $null
        $req.Timeout = 3000
        $req.ReadWriteTimeout = 3000
        $resp = $req.GetResponse()
        try {
            $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
            $body = $sr.ReadToEnd()
            $sr.Close()
        } finally { $resp.Close() }
        return ($body -match '"pid"')
    } catch { return $false }
}

function Rotate-Log([string]$path) {
    if ((Test-Path $path) -and (Get-Item $path).Length -gt 0) {
        Move-Item -Force $path "$path.1"
    }
}

# ── 1. 判活 ─────────────────────────────────────────────
# 两点经验（2026-11-26 踩过）：
#   a) 不能只靠命令行匹配找进程。手工在目录里 `node gateway.js` 起的进程命令行是相对路径，
#      不含 mcp-gateway，匹配不到就会误判成"没起"→ 再起一个 → EADDRINUSE，
#      而老进程的 pid 文件已被新进程启动时覆盖，形成"瞎的看门狗 + 重复拉起"。
#   b) /health 才是唯一权威判据：端口有人答且响应里带 pid，就说明网关活着。
$healthOk = Test-Health

if ($healthOk) {
    $proc = Get-GatewayProcess
    if (-not $proc) {
        # 进程是我们看不见的形态（相对路径启动），但服务是通的 —— 这不算故障
        Write-WdLog '网关健康（进程形态未识别，跳过重启）'
        exit 0
    }
    Write-WdLog "健康，pid=$($proc.ProcessId)，无需干预"
    exit 0
}

$proc = Get-GatewayProcess
if ($proc) {
    # 进程在但 /health 不响应：先给它 5 秒，再判死
    Write-WdLog "进程 pid=$($proc.ProcessId) 存在但 /health 无响应，等待 5 秒"
    Start-Sleep -Seconds 5
    if (Test-Health) { Write-WdLog '复查已恢复，跳过'; exit 0 }
    Write-WdLog "确认僵死，强制结束 pid=$($proc.ProcessId)"
    try { Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop } catch {
        Write-WdLog "结束失败：$($_.Exception.Message)"
    }
} else {
    # 端口不应答、进程也找不到：可能是非 node 形态占着端口（极少），确认一下再起
    $owner = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($owner) {
        Write-WdLog "端口 $Port 被 pid=$($owner.OwningProcess) 占用但 /health 无效，放弃自动启动"
        exit 1
    }
}

# ── 2. 清理残留 pid ─────────────────────────────────────
if (Test-Path $PidFile) { Remove-Item -Force $PidFile -ErrorAction SilentlyContinue }

if (-not (Test-Path $Gw)) { Write-WdLog "❌ 找不到 $Gw，无法启动"; exit 1 }
if (-not (Test-Path $Node)) { Write-WdLog "❌ 找不到 node: $Node（本脚本顶部的 `$Node 默认值需按本机改，或用 -NodePath 传入）"; exit 1 }

# ── 3. 轮转日志并启动 ───────────────────────────────────
Rotate-Log $ErrLog
Rotate-Log $OutLog

try {
    $p = Start-Process -FilePath $Node -ArgumentList "`"$Gw`"" -WorkingDirectory $Dir `
        -RedirectStandardError $ErrLog -RedirectStandardOutput $OutLog `
        -WindowStyle Hidden -PassThru
} catch {
    Write-WdLog "❌ 启动失败：$($_.Exception.Message)"
    exit 1
}

# ── 4. 等待端口就绪 ─────────────────────────────────────
# Start-Process -PassThru 返回的 -Wait 行为在 PS 5.1 + 重定向流下可能一直挂住，
# 这里绝不能对 $p 用 WaitForExit / -Wait：只轮询 HTTP，最多 10 秒就返回。
$ok = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-Health) { $ok = $true; break }
}

if ($ok) {
    Write-WdLog "✅ 网关已启动 pid=$($p.Id)（日志 $ErrLog）"
    exit 0
}

Write-WdLog "❌ 启动后 10 秒内 /health 仍不可达（pid=$($p.Id)），见 $ErrLog"
exit 1
