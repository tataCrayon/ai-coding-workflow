@echo off
rem 开机自启入口：隐藏窗口启动 MCP 网关（由计划任务 McpGateway 调用）
rem 使用前：1) 把 NODE 改成本机 node.exe 绝对路径；2) gateway.js 部署到 %USERPROFILE%\.claude\mcp-gateway\
rem 注册计划任务（一次性）：
rem   schtasks /create /tn McpGateway /tr "%~dp0autostart.cmd" /sc onlogon /rl highest /f
set NODE=C:\path\to\node.exe
set GW=%USERPROFILE%\.claude\mcp-gateway\gateway.js
start "" /min "%NODE%" "%GW%"
