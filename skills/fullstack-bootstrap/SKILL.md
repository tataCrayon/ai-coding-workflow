---
name: fullstack-bootstrap
description: "【通用/前端/Flutter项目用本包，Java后端请用 backendflow-*】AI Coding 工作流包入口：新项目初始化、docs 真相源结构、规模分级与阶段分流。触发：初始化工作流、按 fullstack 来、新项目脚手架。"
when_to_use: 新项目第一次会话；项目缺 docs/STATUS.md 等真相源；用户说「初始化工作流」「按 fullstack 来」时。
---

# FullStack：可迁移的 AI Coding 工作流（专家包入口）

一个独立开发者 + AI 会话（Claude Code / ZCode 类 CLI agent）做中长期项目的工作流。
从 know-u-time（归期簿）2026-08~09 全程 AI Coding 实战提炼，融合 spec-kit / superpowers /
OpenSpec / Cline Memory Bank / HumanLayer context engineering 的共性机制。

## 包内技能地图（按阶段分流，不重复加载）

| 阶段 | 技能 | 一句话职责 |
|------|------|-----------|
| 定方向 | **fullstack-spec** | 需求→产品文档→变更提案，方案签收门禁（设计丢失的解药） |
| 拆活 | **fullstack-plan** | 文档→任务清单（2-5 分钟粒度、带文件路径与验证命令） |
| 干活 | **fullstack-impl** | 逐任务执行 + 每步证据验证，完成须证据 |
| 收尾 | **fullstack-verify** | 批次收尾 checklist：测试绿/分析零告警/实机走查/提交规范 |
| 换会话 | **fullstack-handoff** | activeContext 交接：每次收工压实状态，下次 30 秒接上 |
| 视觉 | **fullstack-design** | 前端两级 demo 门禁：① UX 灰阶 demo（拍流程）② 视觉 mock（拍观感），未签收不写 UI 码（UX 缺失与 UI 统一的解药） |
| 找码 | **fullstack-trace** | 需求→文档→测试→源码映射地图（重复分析的解药） |
| AI 层 | **fullstack-ai** | 项目含 LLM/Agent 功能时的六支柱轻量门禁（提示词版本化/评估/安全…），深度标准引用全局 agent-dev-standards |

深度参考（按需读，不必常驻上下文）：
[references/fullstack-core.md](references/fullstack-core.md)（原则与分级）·
[references/pitfall-ledger.md](references/pitfall-ledger.md)（坑账本格式与清单）·
[references/ecosystem-map.md](references/ecosystem-map.md)（生态项目对照与选用建议）。

## 第一条铁则：会话开始先读真相源，结束先更新真相源

1. 会话开始：读 `docs/STATUS.md`（当前阶段 + 下一步），再按需读 activeContext；
   看板没有「下一步」就视为未初始化，走下方脚手架。
2. 会话收工：更新 `docs/STATUS.md` 的「当前阶段/下一步」→ 追加 dev-log 一段 →
   durable 的坑写进坑账本 → 按用户习惯提交。
3. 40%-60% 原则：主对话保持研究薄、计划厚、执行短；重活（搜代码、跑测试、实机验收）
   交给子代理，只收结论报告。上下文最坏的是「错误信息」，其次是缺失，再次是噪音。

## 项目分级（防过度仪式）

- **S 级（改一行/修小 bug）**：直接改 + 跑相关测试 + 提交。无文档仪式。
- **M 级（一个可提交的小功能）**：STATUS 下一步里写两行计划 → 执行 → verify checklist → 提交。
- **L 级（新功能/新模块/换肤）**：全流程 spec（含签收门禁）→ 前端页面过 design 两级
  demo（先 UX 后视觉）→ plan → 分批 impl → verify → handoff。
- 分级争议时宁低勿高：仪式感是独立开发者的头号敌人。原话：**小改动直接去 build**。

## 新项目脚手架（10 分钟搭完）

```
<project>/
├── docs/
│   ├── STATUS.md            # 唯一进度真相源：当前阶段 / 里程碑表 / 下一步
│   ├── dev-log.md           # 阶段小节：做了什么/为什么/踩了什么坑（只追加）
│   ├── pitfalls.md          # 坑账本：现象→根因→对策（格式见 references/pitfall-ledger.md）
│   ├── product.md           # 产品文档：需求版本化（fullstack-spec 产出）
│   ├── design.md            # 设计语言：Token + 评审清单（fullstack-design 产出；纯后端可无）
│   ├── test-map.md          # 用例↔测试↔源码映射（fullstack-trace 产出）
│   ├── plans/               # L 级变更提案：YYYY-MM-DD-<slug>.md（fullstack-spec/plan 产出）
│   ├── mockups/             # HTML mock 与实机截图（fullstack-design 产出）
│   └── ai-standards.md      # AI 层体检记录（fullstack-ai 产出；无 AI 功能可无）
└── <code>/
```

初始化动作：按上面建目录与空文件 → STATUS.md 写「当前阶段/下一步」→
把本包 9 技能的存在告知用户（「UI 活会先出 demo 给你拍板」等约定一句话讲清）→
环境类事实（SDK 路径、模拟器名、网络镜像）当场验证后写入坑账本，勿凭记忆编造。
**若项目含 AI/LLM 功能**（依赖里有模型 SDK、或需求里有 AI 叙事）：
追加 `docs/ai-standards.md` 空档 + 跑一次 fullstack-ai 体检。

接手已有项目（无脚手架）：先跑 30 分钟考古（README/git log/入口文件），反推出
product.md 与 STATUS.md 草稿请用户确认，再按上述结构补齐——而不是从零重写。

## 术语对照（用户不熟专业名词时，AI 主动给三级对照）

口语 → 术语 → 落点。用户说「方案老丢」= 需求与设计决策未持久化 → spec/plan 文档体系；
「不好看/不统一」= 缺设计语言约束 → design.md Token + 评审清单；
「验证麻烦」= 缺证据化验收 → verify checklist + 实机走查脚本；
「每次都要重新读代码」= 缺需求-代码映射 → test-map + code-map；
「AI 功能心里没底」= AI 层无标准 → fullstack-ai 六支柱门禁 + ai-standards.md。
AI 回复时用术语，但首次出现给口语解释。
