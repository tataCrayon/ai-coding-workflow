@echo off
rem ------------------------------------------------------------------
rem Startup / manual fallback entry: probe gateway health, start it only if unhealthy.
rem Put it in the Startup folder (shortcut to this file) and/or register a scheduled task:
rem   schtasks /create /tn McpGatewayWatchdog /tr "%~dp0autostart.cmd" /sc onlogon /rl highest /f
rem
rem 2026-11-26: the previous version ran `start node gateway.js` directly -- nobody restarted
rem it when it died and nothing was logged. Now it delegates to watchdog.ps1
rem (probe -> restart -> logs into gateway.err.log / watchdog.log).
rem Note: no non-ASCII inside the parentheses above -- cmd.exe parses them in the OEM codepage.
rem ------------------------------------------------------------------
set "WD=%USERPROFILE%\.claude\mcp-gateway\watchdog.ps1"
if not exist "%WD%" (
    echo [auto-start] watchdog.ps1 not found: %WD%
    exit /b 1
)
rem Run synchronously: the watchdog hides node.exe itself and waits at most ~10s,
rem so logs are already on disk before this script exits.
powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%WD%"
exit /b %ERRORLEVEL%
