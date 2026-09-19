---
name: deepseek-harness-installer
description: 一键全局安装并验收 DeepSeek Harness（dsh）。当用户要求安装 DeepSeek Harness、全局安装 dsh、让任意目录可运行 dsh web，或检查安装是否可用时使用。不用于下载 DeepSeek 模型、部署推理服务或源码开发。
slug: deepseek-harness-installer
version: 1.0.0
displayName: DeepSeek Harness Installer
summary: 检查环境、幂等全局安装 dsh，并用独立端口和认证请求验证 Web 服务，保留已有实例。
tags: [deepseek, installer, nodejs, developer-tools]
license: MIT
---

# DeepSeek Harness Installer

把“npm 安装成功”推进到“全局命令可找到、Web 服务可访问”。默认完成安装及验收，不把测试服务留在后台。

## 边界

- 安装对象固定为 `@deepseek-ai/dsh`，不是模型权重。`git clone` 和 `npx` 缓存运行不是全局安装。
- 不克隆源码，不构建仓库，不修改 npm registry、系统 PATH、执行策略或全局脚本审批策略，不自动提权。
- 不配置 API Key，不发送模型请求，不创建开机自启。软件是实验性 agent，可执行命令和访问文件；验收不运行 agent 任务。
- 不自动升级已安装版本。用户明确要求升级或指定版本时才更换版本。
- 不终止已有服务，不按进程名批量杀 Node，不把旧服务的成功响应当成新安装验收结果。

## 1. 检查环境和已有安装

运行 `node --version`、`npm --version`、`npm prefix -g`、`npm ls -g @deepseek-ai/dsh --depth=0 --json`。查询包不存在时 npm 非零退出不等于环境损坏。

先确定目标版本：复验使用已安装版本，首次安装/明确升级解析 latest，指定版本则使用指定值。用 `npm view @deepseek-ai/dsh@<目标版本> engines --json` 获取该版本要求；字段缺失时查官方 README 或该版本文档，不能把缺失当成无限制支持。参考本 Skill 验证时的源码要求为 Node `^22.19.0 || >=24.0.0`，但不要写死为所有未来版本要求。Node/npm 缺失或不满足时报告阻塞与官方下载地址 https://nodejs.org/ ，不要顺手安装系统运行时。

检查命令解析：Windows 用 `where.exe dsh`；macOS/Linux 用 `command -v dsh`。如已存在，再运行 `dsh --version`。

- 全局包已存在且命令匹配：默认跳过安装，继续验收；明确要求升级或更换版本时进入安装步骤。
- 命令存在但不是全局包（例如源码链接、其他 Node 管理器或同名命令）：报告路径冲突，不静默覆盖。
- 全局包已存在但命令不可解析：检查全局前缀与 PATH，报告如何修复，不重复安装掩盖问题。

## 2. 全局安装

首次安装执行：

```sh
npm install -g @deepseek-ai/dsh
```

用户明确要求升级时安装 `@latest`；指定版本时先通过 npm 元数据确认版本存在，再安装该版本。不凭空选择版本。

记录退出码、最终版本与警告。权限失败不自动 sudo 或切换安装目录；网络失败先识别原因，不静默换镜像。

如果 npm 提示安装脚本未批准，记录受影响依赖；不直接执行全部审批、不禁用策略。可以先验收；若原生依赖导致失败，报告具体依赖、脚本和影响，再让用户决定是否授权针对性审批。不得把 CLI 帮助成功等同于所有原生功能正常。

## 3. 验证全局命令和 Web 服务

在源码目录之外重新检查命令路径、`dsh --version` 和 `dsh web --help`。确认当前版本支持 `--host`、`--port 0` 和 `--no-open`；不支持时停止自动测试，报告不兼容，不能回退到占用默认 3080 端口。

从 `npm root -g` 返回的目录读取 `@deepseek-ai/dsh/package.json`，确认包名及 `bin.dsh`，拼出实际 CLI 入口的绝对路径。检查它与 PATH 中的全局命令属于同一安装；不能误用源码入口或 npx 缓存入口。

执行本 Skill 附带脚本（将占位符替换为已核实的绝对路径，路径加引号）：

```sh
node "<skill-dir>/scripts/verify-web.mjs" "<global-package-dir>/<bin.dsh>"
```

脚本使用当前 Node 启动已核实的全局包入口，参数为 `web --host 127.0.0.1 --port 0 --no-open`；以本次创建的临时 `DSH_HOME` 隔离用户配置、认证和会话。读取本次子进程日志中的访问令牌 URL，处理认证重定向和 cookie，验证 HTML 返回 200。日志和令牌只在内存中处理，不发布令牌。

测试有超时和 finally 清理：只停止本次创建且尚存活的进程树，只删除本次创建的临时目录。无法确认进程已停止时保留目录并报告，禁止通过端口寻找并杀死其他进程。无需替换或停止用户的 3080 服务。

测试失败时报告失败阶段和脱敏错误；保留安装，不无授权卸载。首次安装和幂等复验都遵循同样验收标准。

## 4. 交付

简明报告：

- 状态：安装完成 / 已安装并复验 / 安装或验收受阻。
- 版本、全局包位置和命令解析路径。
- CLI 验证、认证 Web HTTP 验证和测试进程清理是否通过。
- 仍未验证：模型 API、终端/原生工具、第三方插件等，及本次警告。
- 使用方法：在目标工作目录运行 `dsh web`，打开它输出的带令牌链接，前台用 Ctrl+C 停止。测试实例已关闭，未设置常驻或自启。

多个浏览器标签页可以连接同一个服务；不要声称多次执行 `dsh web` 会自动复用实例，除非对当前版本已有实证。

## 来源与验收范围

- 官方仓库：https://github.com/deepseek-ai/deepseek-harness
- 官方 npm 包：https://www.npmjs.com/package/@deepseek-ai/dsh
- 本 Skill 提供独立安装流程，不是 DeepSeek 官方发布物。
- Windows x64 / Node 24 验证；macOS/Linux 分支需在对应平台实测后才能宣称支持已验证。
