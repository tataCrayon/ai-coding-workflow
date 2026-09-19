---
name: skillhub-ship
slug: skillhub-ship
version: 1.1.1
displayName: SkillHub Ship — 一条命令把 Skill 发上 SkillHub
summary: 零踩坑发布：元数据补齐、dry-run 预检、登录引导、发布核验全流程；实测过 soul/技能包边界与套件分享路线
description: 把本地 skill 目录发布/更新到 SkillHub 社区源（skillhub.cn）的全流程 skill，并回答"能不能发 Agent/技能包"。核心优势：(1) 内置元数据补齐——SkillHub 必填的 slug/version/displayName 标准 skill 没有，直接发布必报"缺少 slug"；(2) 实测过的能力边界——soul 和技能包（skillset）是平台策展内容，社区渠道不可发布，套件走"pack skill"或 GitHub 路线；(3) Windows Git Bash python3 shim、LICENSE 400、BOM 等已踩坑解法；(4) 发布核验含索引延迟与"download 静默返回旧版本"陷阱。当用户说"发布 skill"、"publish 到 skillhub"、"上架 skill"、"更新 skillhub 版本"、"发 Agent/灵魂/技能包到 skillhub"时使用。
tags: [skillhub, publish, release, cli, registry, windows, semver]
license: MIT
compatibility: 需要 skillhub CLI（未装时按 SKILL.md 指引安装）；Windows 下 CLI 依赖 python3 命令
---

# SkillHub Ship — 发布 Skill 到 SkillHub（零踩坑版）

## 为什么是本 skill（与社区其他 publish 类 skill 的差异）

社区里 publish 类 skill 普遍只教"跑 `skillhub publish`"，但实际发布有四个必踩的坑，本 skill 全部内置解法：

| 坑 | 后果 | 本 skill 的解法 |
|----|------|----------------|
| SkillHub frontmatter 要求 `slug`/`version`/`displayName`，标准 skill 格式没有 | 直接发布报"缺少 slug"，新手卡死 | Step 1 自动检测缺失字段并生成合法值（slug 从目录名、version 走 SemVer、displayName Title Case），确认后写入 |
| Windows Git Bash 无 `python3` 命令 | 安装脚本直接失败 | Step 2 给出已验证的 shim 方案（一条命令创建 `~/bin/python3`） |
| 默认安装往 `~/.openclaw/` 塞推广 skill | 侵入用户环境 | 安装参数用 `--cli-only --no-skills --no-self-upgrade`，只装 CLI |
| 同 slug+version 重复发布被拒 / 发布后 install 404 | 用户以为发布失败 | Step 4 冲突时按 SemVer 语义自动递增建议；Step 5 明确"索引延迟 ~1 分钟，404 重试" |

## 心智模型

SkillHub（skillhub.cn）通过 `skillhub` CLI 发布 skill，本质是：
1. 解析 skill 目录下 `SKILL.md` 的 frontmatter 作为元数据
2. 打包全部文件（排除 `.git`/`node_modules`/`__pycache__`/`*.pyc` 等）
3. multipart 上传到 `https://api.skillhub.cn/api/v1/community/skills/publish`

## 能力边界：Skill / Agent(soul) / 技能包(pack) 能不能发？

SkillHub 站上有三种内容形态，但**社区 CLI 只开放第一种发布**（2026-09-18 实测 API 与前端 bundle 确认）：

| 形态 | 站内是什么 | 社区能否发布 | 分享路线 |
|------|-----------|-------------|----------|
| **Skill** | `SKILL.md` 目录，`skillhub install` | ✅ 本 skill 主流程 | `skillhub publish <dir>` |
| **Soul / Agent** | 人格/角色卡（`SOUL.md`），`skillhub soul install` | ❌ 平台策展 | 见下"想分享 Agent 怎么办" |
| **技能包 / SkillSet** | 多 skill 组合包（`manifest.json`+`skillsets/*.md`），`skillhub pack install` | ❌ 平台策展 | 见下"想分享套件怎么办" |

**实测证据**：`POST/PUT /api/v1/souls`、`/api/v1/skillsets`、`/api/v1/community/{souls,skillsets}/publish` 全部返回 **405**；前端 bundle 只有 `community/skills/publish` 一个写接口，soul 仅有活动抽奖接口（`activity/.../souls/draw`）、skillset 仅有只读 `GET /api/v1/skillsets`。CLI 的 `soul`/`pack` 子命令**只有 install、没有 publish**。结论：soul 和 pack 是平台运营侧内容，个人渠道无法上传。

### 想分享 Agent（soul 形态）怎么办

soul 本质是"角色人格 + 绑定的 skill 组合"。个人能分享的是它的**载体**：
- 把角色写成 **SKILL.md**（`description` 里定义人设与触发），走正常 `publish`——这是社区唯一可发的"类 Agent"形态。
- 想要真正的 soul 卡上架，只能联系平台运营投稿（无自助接口）。

### 想分享技能包（多 skill 套件）怎么办

平台 pack 不可自助发布，但**套件本身照样能分享**，两条已验证路线：
1. **pack skill 路线（推荐）**：做一个"入口 skill"，`SKILL.md` 列出成员 skill 与安装顺序，成员各自单独 `publish`。用户装入口 skill 后按清单逐个 `skillhub install`。本包的 `workflow-migrator` 就是这种结构的变体（清单直接指向仓库）。
2. **GitHub 仓库路线**：整个套件放一个 repo，README 给 `npx skills add <user>/<repo>` 或软链接说明；顺带解决个人渠道无平台分类的问题（GitHub 中转的 skill 由平台 pipeline 自动归类，CLI 直发渠道无分类字段）。

## 工作流

### Step 0 — 确认对象

明确要发布的 skill 目录路径和本次意图（首次上架 or 版本更新）。用户没给路径时，问清楚；不要猜。

### Step 1 — 元数据预检（发布前必做）

读取目标 skill 的 `SKILL.md` frontmatter，检查 SkillHub 必填项：

| 字段 | 要求 | 缺失时动作 |
|------|------|-----------|
| `slug` | kebab-case，2-128 字符，`^[a-z0-9](-?[a-z0-9])*$` | 从目录名生成（目录名已 kebab-case 则同目录名），和用户确认后写入 |
| `version` | SemVer `x.y.z`（可带 `-beta`/`+build`） | 首发用 `1.0.0`；更新时看 git tag 或问用户递增哪一位 |
| `displayName` | 非空展示名 | 从 name 生成 Title Case，和用户确认 |

推荐写法（标准 `name`/`description` 保留不动，SkillHub 字段追加在后）：

```yaml
---
name: my-skill
description: 原有描述不变
slug: my-skill          ← SkillHub 用，决定社区 URL
version: 1.0.0          ← SkillHub 用，SemVer
displayName: My Skill   ← SkillHub 用，列表展示名
summary: 一句话简介（可选但推荐）
tags: [tag1, tag2]      ← 可选
license: MIT            ← 可选
---
```

> `version` 建议同步打 git tag（如果 skill 仓库有版本管理），但 SkillHub 版本以 frontmatter/`--version` 参数为准。

改完 frontmatter 后跑官方预检（不发起网络请求）：

```bash
skillhub publish <skill-dir> --dry-run
```

### Step 2 — 确认 CLI 可用

```bash
command -v skillhub && skillhub --version
```

未安装时的安装指引（推荐 `--cli-only` 减少侵入）：

```bash
curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash -s -- --cli-only --no-self-upgrade
```

- Windows Git Bash 若报 `python3 is required`：建一个 shim（`mkdir -p ~/bin && printf '#!/bin/sh\nexec python "$@"\n' > ~/bin/python3 && chmod +x ~/bin/python3`，前提 `~/bin` 在 PATH）。
- 安装脚本默认会往 `~/.openclaw/workspace/skills/` 装 find-skills skill，`--cli-only` 可跳过。

### Step 3 — 登录检查

```bash
skillhub whoami 2>&1 || true
```

未登录时提示用户执行（**token 是凭据，AI 不经手**）：

```bash
skillhub login --key skh_xxx   # 个人社区版 token，从 skillhub.cn 个人页获取
```

也可以用环境变量 `SKILLHUB_TOKEN` 代替（同样由用户自己在终端设置）。AI 不得索要、记录或转写 token。

### Step 4 — 正式发布

```bash
# 版本更新时带上 changelog，便于社区页展示
skillhub publish <skill-dir> --changelog "<本次变更说明>"
```

- 首次上架/更新都走同一条命令，服务端按 slug+version 处理。
- `--version x.y.z` 可临时覆盖 frontmatter 的 version（不改文件）。
- 输出 `✓ Published: skillId=... status=...` 即成功。
- **报"slug 冲突: 版本已存在"**：递增 version 再发（补丁 +0.0.1，新功能 +0.1.0，破坏性 +1.0.0），不要静默覆盖旧版本；改动内容与递增位不匹配时问用户。

### Step 5 — 发布后核验

```bash
skillhub search <slug 或关键词>          # 搜索可见性（可能有索引延迟）
skillhub install <slug> --namespace <你的namespace> --dir /tmp/skh-verify  # 实测可安装
```

- 搜索/安装刚发布后可能有 **~1 分钟索引延迟**（实测最长约 4 分钟）：search 找不到或 install 404 都不是发布失败，等 1 分钟重试。
- **download 接口在安全扫描排队期间会静默返回旧版本包而不是报错**（2026-09-18 实测）：核验不能只看 install 成功，必须 `grep '^version' <下载目录>/SKILL.md` 比对版本号；detail API `GET /api/v1/skills/<slug>?namespace=<ns>` 的 `latestVersion.version` 为空或 `securityReports.*.status=queued` 即仍在排队。
- 核验完删除临时目录。
- 把安装命令（含 `--namespace`）报给用户——同名 skill 多的 slug 必须带 namespace 才能装到正确版本。

### Step 6 — 收尾

- 若 skill 目录是 git 仓库：提醒用户 `git add SKILL.md && git commit`（frontmatter 被我们改过）。
- 报告格式：发布的 slug@version、changelog、skillId、安装命令、改动了哪些文件。

## 现场应变

- **`--dry-run` 报 slug 不合法**：slug 只允许小写字母数字和中划线，不能有大写、下划线、中文。
- **publish 报 `400 不允许的文件类型: LICENSE`**（2026-09-17 实测）：打包器拒绝无扩展名的 LICENSE 文件。解法：发布时临时 `mv LICENSE /tmp/`，成功后移回；仓库里保留 LICENSE 不受影响（用 `LICENSE.md` 命名可绕开）。
- **frontmatter 解析失败**：检查 SKILL.md 是否带 UTF-8 BOM（Windows 常见），BOM 会破坏 `---` 起始行识别；发布前转 UTF-8 无 BOM。
- **HTTP 401/403**：token 失效或没登录，回到 Step 3。
- **zip 输入**：`skillhub publish xxx.zip` 也支持（≤10MB 压缩 / ≤50MB 解压），但日常推荐目录直发。
- **Windows python3 报错**：见 Step 2 的 shim 方案。
- **用户想同时发 GitHub**：SkillHub 发布与 git push 互不依赖；可顺带推送，但版本 tag 以 frontmatter 为准。
- **想改已发布 skill 的名字**：slug 即身份，发布后不可改；换名=新 skill。所以首发前值得按 Step 1 把 slug 定好（可检索、无重名歧义）。
- **网页改过 displayName 后再用 CLI 发新版**：publish 会用 frontmatter 的 displayName **覆盖**平台显示名（2026-09-18 实测）。用户先在网页改成中文名时，发布前必须把中文名同步进 frontmatter，否则改名丢失。
