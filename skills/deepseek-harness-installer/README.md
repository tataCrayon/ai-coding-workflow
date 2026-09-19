# DeepSeek Harness Installer

**从“安装成功”到“验证可用”，一句话完成 dsh 全局安装。**

> Install globally. Verify locally. Leave existing services alone.
>
> 一个轻量 Agent Skill：检查 Node/npm，按需全局安装 DeepSeek Harness，并使用临时配置和空闲端口验证带认证的 Web 页面。不只是复制一条 npm 命令。

## 功能特性

- **按需安装**：已有可用的全局版本就复验，不重复安装、不擅自升级。
- **真实验收**：不止检查 `--version`，还验证新启动服务的认证页面返回 HTTP 200。
- **不打扰已有实例**：绑定本机、自动分配空闲端口、不打开浏览器，不占用 3080。
- **测试后清理**：只停止自己创建的测试进程，清理临时配置；无法确认清理时明确报告。
- **克制处理权限**：不自动提权、不改 registry/PATH、不批量批准依赖安装脚本。

## 安装

通过 SkillHub CLI 安装本 Skill（这是安装 Skill，不是直接安装 dsh）：

```sh
skillhub install deepseek-harness-installer --namespace user_cee4a0e2
```

将安装后的目录放入你所用 Agent 的技能目录。手动安装时保留 `SKILL.md` 和 `scripts/verify-web.mjs` 的相对位置。需要支持执行本地命令的 Agent 环境。

## 使用

### 作为 Skill

对 Agent 说：

> 帮我一键全局安装 DeepSeek Harness，并确认 Web 界面能启动。

或：

> 我已经装了 dsh，帮我检查全局安装是否可用，不要影响正在运行的服务。

Skill 完成后会报告版本、安装位置、命令路径、Web 验收和清理结果。之后在你的工作目录运行：

```sh
dsh web
```

打开启动日志给出的带令牌地址。前台服务用 Ctrl+C 停止；关闭浏览器不等于停止服务。验收实例会自动停止，不会为你留下常驻服务。

### 验收示例

```text
状态：已安装并复验
全局版本：0.1.5-rc.1
CLI：通过
隔离 Web 验收：HTTP 200
测试进程及临时目录清理：通过
未测试：模型 API、终端及原生工具
```

版本仅为实测示例，实际以安装结果为准。

## 与相近方式的区别

| 方式 | 作用 |
|------|------|
| `git clone` | 获取源码，不是全局安装 |
| `npx @deepseek-ai/dsh web` | 通过 npx 下载或复用缓存并运行 |
| `npm install -g @deepseek-ai/dsh` | 安装全局命令，本 Skill 使用的安装方式 |
| 本 Skill | 增加环境检查、幂等判断、隔离 Web 验收和结果说明 |

## 常见问题（FAQ）

**没有 Node.js 能直接装吗？**

不能。Skill 会说明阻塞原因并提供 [Node.js 官方下载地址](https://nodejs.org/)，不会擅自修改系统运行时。

**默认会升级吗？**

不会。已有全局安装就先复验；只有明确要求升级或指定版本才更换版本。

**为什么 CLI 成功还要测试网页？**

`--version` 成功不能证明 Web 服务启动成功。验收使用本次进程打印的令牌完成本地认证，裸地址返回 401 不应直接判断为安装失败。

**通过验收就能保证全部功能正常吗？**

不能。这里只验证隔离配置下的 Web 启动，不配置 API Key、不调用模型、不验证终端和所有原生依赖。依赖脚本审批警告仍需披露。

**会影响我的配置和正在运行的服务吗？**

测试使用单独的临时 `DSH_HOME` 和 `--port 0`，不读取你的 dsh 用户配置，不停止已有实例。多次执行 `dsh web` 是否复用服务不在本 Skill 的保证范围内。

## 注意事项

DeepSeek Harness 处于实验性开发者预览阶段，可执行命令和访问文件；使用时按最小权限原则授权。本 Skill 为独立社区工具，并非 DeepSeek 官方发布物。

仅 Windows x64 / Node 24 环境完成实测。macOS/Linux 的脚本分支尚未实机验证，不宣称全平台测试通过。发布到 SkillHub 后，安全扫描和索引可能延迟，发布成功不等于立即可下载。

## 测试

- `scripts/verify-web.mjs`：无第三方依赖的 Node 验收脚本，支持认证重定向、超时及清理。
- `evals/evals.json`：已有安装与端口占用、缺少 Node、安装脚本待审批三个情景。
- 已完成 Windows 全局 `dsh@0.1.5-rc.1` 实测：认证 HTTP 200、清理通过；原有 3080 服务仍响应认证要求。

## License

MIT，详见 [LICENSE.md](LICENSE.md)。

上游：[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) · [npm 包](https://www.npmjs.com/package/@deepseek-ai/dsh)
