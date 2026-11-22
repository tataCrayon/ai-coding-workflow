---
name: deepseek-harness-installer
description: "一键安装并验收 DeepSeek Harness（dsh）：准备 pnpm、web profile 装插件、交付启动方法与能力介绍。触发：安装 DeepSeek Harness、全局安装 dsh、配置常用插件。"
slug: deepseek-harness-installer
version: 1.3.0
displayName: DeepSeek Harness 一键安装与验收
summary: 检查环境、幂等全局安装 dsh，必要时用 npm 补装 pnpm，验证 Web 服务，批量安装默认插件集；耗时长的全家桶包（cloudflared 下载）在所有任务完成后询问用户再决定，最后交付启动指南、模式与插件能力说明；保留已有实例。
tags: [deepseek, installer, nodejs, developer-tools, plugins]
license: MIT
---

# DeepSeek Harness Installer

把"npm 安装成功"推进到"全局命令可找到、Web 服务可访问、常用插件已就位、用户知道怎么上手"。默认完成安装、插件配置及验收，不把测试服务留在后台。

## 边界

- 安装对象固定为 `@deepseek-ai/dsh`，不是模型权重。`git clone` 和 `npx` 缓存运行不是全局安装；插件安装也必须用已核实的全局 `dsh` 命令，不用 `npx`。
- 全局安装 pnpm 是唯一允许的附加全局安装，且仅在 `dsh plugin` 需要而 pnpm 缺失时执行。除此之外不修改 npm registry、系统 PATH、执行策略或全局脚本审批策略，不自动提权。
- 不配置 API Key，不发送模型请求，不创建开机自启。软件是实验性 agent，可执行命令和访问文件；验收不运行 agent 任务。
- 不自动升级已安装的 dsh 版本。用户明确要求升级或指定版本时才更换版本。
- 不终止已有服务，不按进程名批量杀 Node，不把旧服务的成功响应当成新安装验收结果。
- 社区插件是第三方代码，安装后随 agent 运行并获得同等权限。安装前列出插件名称、用途与来源；用户明确拒绝时跳过对应插件。不安装来源不明的 git/tarball 地址，除非用户点名要求。

## 1. 检查环境和已有安装

运行 `node --version`、`npm --version`、`npm prefix -g`、`npm ls -g @deepseek-ai/dsh --depth=0 --json`。查询包不存在时 npm 非零退出不等于环境损坏。

先确定目标版本：复验使用已安装版本，首次安装/明确升级解析 latest，指定版本则使用指定值。用 `npm view @deepseek-ai/dsh@<目标版本> engines --json` 获取该版本要求；字段缺失时查官方 README 或该版本文档，不能把缺失当成无限制支持。参考本 Skill 验证时的源码要求为 Node `^22.19.0 || >=24.0.0`，但不要写死为所有未来版本要求。Node/npm 缺失或不满足时报告阻塞与官方下载地址 https://nodejs.org/ ，不要顺手安装系统运行时。

检查命令解析：Windows 用 `where.exe dsh`；macOS/Linux 用 `command -v dsh`。如已存在，再运行 `dsh --version`。

- 全局包已存在且命令匹配：默认跳过安装，继续验收；明确要求升级或更换版本时进入安装步骤。
- 命令存在但不是全局包（例如源码链接、其他 Node 管理器或同名命令）：报告路径冲突，不静默覆盖。
- 全局包已存在但命令不可解析：检查全局前缀与 PATH，报告如何修复，不重复安装掩盖问题。

## 2. 全局安装 dsh

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

## 4. 准备 pnpm（插件管理前置）

`dsh plugin` 是对 pnpm 的转发：它在 profile 目录内执行 pnpm 来安装和激活插件包。先检查 `pnpm --version`：

- 已存在：直接进入第 5 步。
- 缺失：这是用户已授权的全局安装，执行 `npm install -g pnpm`，完成后复验 `pnpm --version` 与命令解析路径。失败时报告原因，跳过插件安装，其余验收结论不受影响。

## 5. 安装默认插件集（web profile）

插件管理命令为 `dsh plugin --profile web add <package...>`：首次运行会自动初始化 web profile；pnpm 支持一条命令批量追加多个依赖，随后 CLI 把声明 `dsh.bundle` 的包并入 profile 层栈。

默认安装以下插件（名称与描述于 2026-09 经 npm 元数据核实）：

| 包名 | 作用 |
|------|------|
| `dshmarket` | 图形化插件市场入口：在 Web UI 内搜索、浏览、一键安装社区插件，之后不必手敲命令 |
| `dsh-better-sidebar` | VS Code 风格侧边工作台：文件树、终端、子 Agent 状态监控 |
| `@js2hou/dsh-mcp-manager` | MCP 服务器图形化管理：设置页内热挂载/卸载，免手改配置 |
| `dsh-at-file` | 输入框 `@` 模糊搜索并引用工作区文件/目录路径 |

`@linxin666/dsh-web-all`（Web UI 全家桶：任务看板、Git 图谱、Token 统计、主题中心）不随默认批次安装：它经 `@linxin666/dsh-remote-web-ui` 引入 `cloudflared@0.7.3`，postinstall 从 GitHub Releases 下载约 52 MB 二进制，国内直连实测约 19 KB/s、单独占用 45 分钟以上，pnpm 需等全部脚本结束才完成整批。处理顺序：

1. 先批量安装上表 4 个包并完成构建脚本审批（见下）。
2. 环境检查、Web 验收、pnpm 准备与默认批次全部完成后、出最终交付报告前，向用户提问一次，措辞参考："环境基本都准备好了。还剩 Web UI 全家桶（dsh-web-all：任务看板 / Git 图谱 / Token 统计 / 主题中心）未装，它捆绑远程访问功能（cloudflared），首次安装需从 GitHub 下载约 50 MB，本网络环境实测可能耗时四十分钟以上。是否继续安装？"
3. 用户同意：单独执行 `dsh plugin --profile web add @linxin666/dsh-web-all`，放后台运行并告知耗时预期，交付时注明其安装状态；若用户不需要远程访问功能，可提议改用市场中拆分的单项子插件以绕开 cloudflared。
4. 用户拒绝或超时未答：跳过，不擅自安装，交付报告将其列为"未安装的可选增强"并附上述单条命令，日后想装随时执行。

**批量执行与构建脚本审批**：插件安装的耗时主项是 pnpm 解析与原生构建脚本，逐包 `add` 会重复多次。执行方式：

1. 读取 profile 的 `package.json`（`$DSH_HOME/profiles/web/`，Windows 默认 `%USERPROFILE%\.dsh`），只把不在 `dependencies` 中的缺失包收集成一批；已安装的（含上次测试遗留）直接跳过。
2. 缺失包用**一条** `add` 命令装完，pnpm 解析只做一遍。默认批次含原生依赖（node-pty、ssh2、cpu-features，随 dsh 版本与插件依赖变化），pnpm 会拦截构建脚本并报 `ERR_PNPM_IGNORED_BUILDS`、`dsh plugin` 退出非零。
3. 构建脚本审批前置处理：向用户列出被拦截的具体依赖，获得授权后把 profile `pnpm-workspace.yaml` 的 `allowBuilds` 对应占位值改为 `true`，再重跑同一条批量命令。一次授权、一次重跑，不逐包试错。
4. 原生 gyp 编译在 Windows 实测约 1-2 分钟，属正常耗时。ssh2 的可选加密绑定（cpu-features）在部分 Windows 环境编译失败但有纯 JS 回退，构建日志含 `Failed to build optional crypto binding` 且整体 Done 时不算失败，交付时如实披露。

按需选装（用户提出相应需求时才装，不在默认集内）：

- 视觉增强/OCR：`@liustack/modlens`。社区反馈版本兼容性敏感，安装前用 `npm view @liustack/modlens versions --json` 确认并锁定具体版本号（如 `@liustack/modlens@<x.y.z>`），不用 `@latest`。
- 跨会话记忆：npm 无 `dsh-memory-lite`；实际存在 `dsh-memory`（SQLite FTS5 检索）与 `dsh-memory-eternal`（Markdown Vault + 知识图谱）等，安装前向用户展示各自描述并确认选择，不默认代选。

失败处理：插件安装报错指向 dsh 核心版本不兼容时，报告冲突的包与版本，建议升级 dsh（需用户确认后才执行 `npm install -g @deepseek-ai/dsh@latest`）。非原生构建类的批量失败（如某个包名解析错误）才回退到逐包安装以隔离坏包。

插件改变 profile 组成：正在运行的 `dsh web` 服务不会自动加载新插件，交付时必须提醒重启。

用户点击 Web UI"检查更新"失败（安装版本不变、日志只有 `-10 added 0`）时，按序排查：一是 pnpm 的 `minimumReleaseAge` 供应链门禁会静默跳过发布不足时限（约 24 小时）的新版本，在 profile `pnpm-workspace.yaml` 加入 `minimumReleaseAgeExclude` 列出已装插件包名后重跑 `dsh plugin --profile web update`；二是 `dsh plugin update` 遵守 package.json 的 semver 范围，`0.x` 的 `^` 前缀跨不过次版本（`^0.3.24` 装不到 `0.4.1`），需要 `update --latest <pkg>` 提升。两者都完成后复跑一次隔离端口启动验证再交付。

## 6. 交付

简明报告：

- 状态：安装完成 / 已安装并复验 / 安装或验收受阻；pnpm 与插件集的安装结果逐项列出。
- 版本、全局包位置和命令解析路径。
- CLI 验证、认证 Web HTTP 验证和测试进程清理是否通过。
- 仍未验证：模型 API、终端/原生工具、第三方插件等，及本次警告。
- 使用方法：在目标工作目录运行 `dsh web`，打开它输出的带令牌链接，前台用 Ctrl+C 停止。测试实例已关闭，未设置常驻或自启。新装插件需重启 `dsh web` 后生效；已运行的服务不会自动加载。

必须随交付说明附上以下上手信息（面向新用户，用用户的语言）：

**模式选择**：
- `dsh web` — 图形界面，日常主力；带令牌 URL 在浏览器打开。
- `dsh --profile headless "任务内容"` — 无界面跑单个任务，打印结果后退出，适合脚本化。
- `dsh --profile sdk` — 以 JSON-RPC SDK 服务启动，供程序集成。
- `dsh --profile acp` — ACP（Agent Client Protocol）自动化接入，供编辑器等宿主调用。
- 自定义 profile：`dsh --profile <名字> --from-default-profile web` 从模板派生。

**基础能力（dsh-base，所有模式共享，无需配置）**：DeepSeek 模型连接（provider/model 可配置）、完整工具集（文件读写编辑、shell 命令、web 搜索与公开 HTTP 抓取、子 Agent 委派、任务/目标跟踪）、跨重启的持久会话、默认权限策略（文件写入限制在工作区内、高风险操作先征求同意）。首次使用前需在设置或环境变量配置 `DEEPSEEK_API_KEY`。

**已装插件一句话作用**：按第 5 步表格逐项复述，并说明后续可在 设置 → 插件市场（dshmarket）里浏览安装更多社区插件；全家桶按用户选择报告"已装 / 已选装后台安装中 / 未安装及单条安装命令"三种状态之一。

多个浏览器标签页可以连接同一个服务；不要声称多次执行 `dsh web` 会自动复用实例，除非对当前版本已有实证。

## 来源与验收范围

- 官方仓库：https://github.com/deepseek-ai/deepseek-harness
- 官方 npm 包：https://www.npmjs.com/package/@deepseek-ai/dsh
- 默认插件为社区第三方包（dshmarket、dsh-better-sidebar、@js2hou/dsh-mcp-manager、dsh-at-file；选装 @linxin666/dsh-web-all），非 DeepSeek 官方发布物；本 Skill 安装前经 npm registry 元数据核实其存在，未验证其与最新版 dsh 核心的兼容性。
- Windows x64 / Node 24 实测：dsh-web-all 的 cloudflared postinstall 下载耗时约 45 分钟，是整批安装的主要瓶颈；据此全家桶改为完成询问后选装。
- 本 Skill 提供独立安装流程，不是 DeepSeek 官方发布物。
- Windows x64 / Node 24 验证；macOS/Linux 分支需在对应平台实测后才能宣称支持已验证。
