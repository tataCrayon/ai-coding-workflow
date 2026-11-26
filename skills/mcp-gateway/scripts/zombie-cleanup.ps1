<#
  僵尸进程清理（原「每周日杀 24 小时以上的 node/cmd/claude」的加固版）
  ------------------------------------------------------------
  原逻辑：每周定时杀掉所有启动超过 24 小时的 node/cmd/claude 进程，
          防止它们长期占用内存、拖慢提交、让 IDEA 的 git askpass 失效。

  问题：MCP 网关（~/.claude/mcp-gateway/gateway.js）是设计为常驻的进程，
        被这条规则每周必杀一次，客户端随后报 gateway ECONNREFUSED。

  本版改动：只加白名单，不放松其它规则 ——
    · 命令行以 gateway.js 结尾的 node 进程不杀
    · 这些进程的所有子孙进程（各 MCP 后端：cmdb / easy-mysql / tavily / figma / feishu-kb）不杀
  白名单之外的判定与原来完全一致：StartTime 早于 24 小时前 → Stop-Process -Force。

  部署：放到 ~/.claude/scripts/zombie-cleanup.ps1，计划任务指向它。
        路径若不同，改下面的 $Log 即可（日志目录不存在时 Add-Content 会静默失败，不影响清理）。
#>
$ErrorActionPreference = 'SilentlyContinue'
$Log = Join-Path $PSScriptRoot '..\mcp-gateway\zombie-cleanup.log'
function Log([string]$m) {
    $line = "{0} {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m
    Add-Content -Path $Log -Value $line -Encoding utf8
}

$all = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue

# ── 白名单：网关进程及其全部子孙 ────────────────────────
$protected = New-Object 'System.Collections.Generic.HashSet[int]'
# 只认 node 进程 + 命令行以 gateway.js 结尾（相对或绝对路径均可）；
# 不能只写 *gateway.js*：会命中所有命令行里提到该字符串的 bash/powershell 包装进程，
# 把 AI 工具自己的 shell 也算进白名单，并把它们的父链一路保护起来。
$gwRoots = @($all | Where-Object {
    $_.Name -eq 'node.exe' -and $_.CommandLine -and $_.CommandLine -match 'gateway\.js("|\s)*$'
})
foreach ($g in $gwRoots) { [void]$protected.Add([int]$g.ProcessId) }

# 沿 ParentProcessId 向下展开（深度优先，最多 10 层，防环）
$frontier = @($protected)
for ($depth = 0; $depth -lt 10 -and $frontier.Count -gt 0; $depth++) {
    $next = @()
    foreach ($p in $frontier) {
        foreach ($c in $all | Where-Object { [int]$_.ParentProcessId -eq [int]$p }) {
            if ($protected.Add([int]$c.ProcessId)) { $next += [int]$c.ProcessId }
        }
    }
    $frontier = $next
}

# ── 清理：保留原有的 24 小时规则，只排除白名单 ──────────
$cutoff = (Get-Date).AddHours(-24)
$targets = @()
foreach ($name in @('node', 'cmd', 'claude')) {
    $targets += Get-Process -Name $name -ErrorAction SilentlyContinue |
        Where-Object { $_.StartTime -lt $cutoff -and -not $protected.Contains([int]$_.Id) }
}

if ($targets.Count -eq 0) {
    Log "无僵尸进程（白名单含网关及其子孙共 $($protected.Count) 个进程，网关根 $($gwRoots.Count) 个）"
    exit 0
}

foreach ($t in $targets) {
    try {
        Stop-Process -Id $t.Id -Force -ErrorAction Stop
        Log "已结束 $($t.ProcessName) pid=$($t.Id) 启动于 $($t.StartTime)"
    } catch {
        Log "结束失败 $($t.ProcessName) pid=$($t.Id)：$($_.Exception.Message)"
    }
}
