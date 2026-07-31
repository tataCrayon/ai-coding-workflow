---
alwaysApply: false
description: 工具与环境兼容性 - 在 Windows/PowerShell 环境执行命令、MCP 不可用降级时加载。含 bash↔PowerShell 语法对照、MCP 降级策略
---

# 工具与环境兼容性

> 源自 `.cursor/rules/finloop-tool-guide.mdc`。在 Windows + PowerShell 环境运行命令，或 MCP 工具不可用需降级时加载。

## 核心原则

不应只产出文档，必须**实际操作**。产出文档是留痕，操作代码/数据库/测试才是干活。

## PowerShell 兼容性速查

> Agent 运行在 Windows + PowerShell 环境时，必须使用以下替代语法。检测到 `Shell: powershell` 时自动使用，不要输出 bash 专属命令让用户手动转换。

| bash 语法 | PowerShell 替代 | 说明 |
|-----------|----------------|------|
| `cmd1 && cmd2` | 分两次调用，或 `; if ($LASTEXITCODE -eq 0) { cmd2 }` | PowerShell 5.x 不支持 `&&` |
| `<<'EOF'...EOF`（heredoc） | 用 `-m "message"` 传参；多行用 `@"...\n..."@` 或临时文件 | PowerShell 无 bash heredoc |
| `mkdir -p path/to/dir` | `New-Item -ItemType Directory -Force -Path "path/to/dir"` | `-p` 是 bash 参数 |
| `export VAR=value` | `$env:VAR = "value"` | 环境变量语法不同 |
| `rm -rf dir/` | `Remove-Item -Recurse -Force "dir/"` | 参数格式不同 |
| `mvn test "-Dtest=XxxTest"` | 同左，`-D` 参数必须双引号包裹 | 避免 PowerShell 解析 `-D` |
| `rg "pattern" --type java` | 优先用 IDE 内置 Grep 工具 | PowerShell 特殊字符需额外转义 |

> 注：本会话 Shell 为 Git Bash（POSIX sh），可直接用 Unix 语法。上表针对 Cursor/纯 PowerShell 环境。

## MCP 不可用时的降级策略

| 所需 MCP | 降级方案 |
|----------|----------|
| MySQL MCP | 生成 SQL/迁移文件 → 提示用户手动执行 → 留痕注明「需手动执行迁移」 |
| HTTP MCP | 用框架内测试客户端（MockMvc / TestClient）→ 或提示用户用 Postman/curl 验证 |
| `glab` CLI | 用 `git push` 推代码 → 提示用户在 GitLab 网页创建 MR |

**关键原则**：MCP 不可用时**不要跳过该步骤**，而是用降级方案完成，并在留痕中注明。

## 后端专项代码评审清单（速查）

> 完整审查见 `code-review-checklist` / `flp-code-review` Skill，此处仅速查。

| 检查项 | 要点 |
|--------|------|
| SQL 注入 | 参数化查询/预编译，禁止拼接 SQL |
| 事务正确性 | 事务边界合理，有回滚配置 |
| 资源释放 | try-with-resources / finally 关闭连接 |
| 异常处理 | 全局异常处理兜底，不吞异常 |
| 并发安全 | 无可变共享状态，或已加锁 |
| 敏感信息 | 日志不打印密码/Token |
| API 规范 | 与设计文档一致 |
| 性能 | 无 N+1 查询、有分页 |
