# 生态对照：热门 AI Coding 工作流怎么抄

> 2026-09 调研结论。选型原则：独立开发者性价比 = 强制点收益 ÷ 仪式成本。

## 性价比排序（独立开发者视角）

| 项目 | ★量级 | 一句话机制 | 抄什么 | 不抄什么 |
|------|------|-----------|--------|---------|
| obra/superpowers | ~284k | skills 插件即全流程：brainstorm→plan→subagent→TDD→review | 任务 2-5 分钟粒度+内嵌验证；每任务全新 subagent；verification-before-completion 门禁；TDD「先删未测代码」 | worktree 隔离（单人单机收益低） |
| Fission-AI/OpenSpec | ~68k | 轻量 spec：live specs 与 in-flight changes 分离，archive 强制回写 | 变更目录五件套（proposal/specs delta/design/tasks/archive）| WHEN/THEN 全量场景块（个人项目写不全，挑关键行为写） |
| github/spec-kit | ~135k | 7 命令相位门：constitution→specify→clarify→plan→tasks→implement→converge | 一页宪法；/clarify 规划前强制消歧；/converge 收敛闭环 | 固定相位门 + Python 工具链（对小项目过重） |
| claude-task-master | ~28k | PRD→任务 DAG→next 取单任务 | PRD-first；复杂度分析→expand 两段拆解；「永远只看当前任务」防上下文污染 | MCP/CLI 基础设施层（Markdown 清单够用） |
| agent-os | ~5.4k | product/standards/specs 三层目录 | standards 按需注入（index.yml 思路）；「从存量代码反向提取规范」 | standards 全量按领域细分（个人项目用不上） |
| BMAD-METHOD | ~53k | PM/架构/Dev/QA 多角色 | story 文件自带完整上下文；correct-course 纠偏；retrospective 回写 | 多角色全套（企业协同假设） |
| Cline Memory Bank | - | 六文件记忆库，会话开始必读 | **activeContext.md 单文件交接**；分级更新频率 | 「每任务读全部记忆文件」（费 token，按需读） |
| HumanLayer context eng | - | research/plan/implement 三产物 + 压实回 plan | 40-60% 上下文利用率；子代理=上下文控制；每阶段验证后压实 | 容器化跑爆权限那套（本机开发不适用） |

## 跨项目共性 TOP6（= 本包六条原则的出处）

1. 规范文件先行且随代码 commit（没写下来=不存在）
2. 任务拆到极小粒度再执行（没人让 agent 一口气实现整个 feature）
3. 每步验证强制点、完成需证据（Evidence over claims）
4. 状态落盘作为交接（磁盘上的 Markdown 就是 agent 的内存）
5. 上下文隔离：子代理做重活只回结论（主 context 保持 40-60%）
6. 完成后回写/收敛闭环（archive / retrospective / update memory bank）

## Skills 生态使用法（找现成技能，不重复造轮子）

- **skills.sh**（国际目录，按装机量排行）：`npx skills find <query>` 搜索，
  `npx skills add <owner/repo@skill> -g -y` 安装；质量门槛 1K+ 装机或官方源
  （vercel-labs/anthropics/microsoft），<100 装机警惕。搜索页前端渲染抓不到，
  用 CLI 或抓详情页。
- **skillhub.cn**（中文市场）：`skillhub search|install <关键词>`；发布需 frontmatter
  带 slug（kebab-case，发布后不可改）/ version（SemVer）/ displayName。
- 优先装现成的，本项目包只补生态空白：**onboarding/会话交接**、**需求-代码映射追踪**
  是调研确认的空白点，fullstack-handoff 与 fullstack-trace 即为此而设。
- 装第三方技能后先读一遍再启用：确认它的强制点与本包原则不冲突（如某技能允许
  「跳过测试因为难测」→ 与 Evidence 原则冲突，以本包为准）。
