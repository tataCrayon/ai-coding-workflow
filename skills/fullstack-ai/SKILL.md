---
name: fullstack-ai
description: "【通用/前端/Flutter】LLM/Agent 工程标准化：按六支柱（提示词版本化/注册/工具调用/评估/观测/安全）体检补齐。触发：AI 功能标准化、agent 工程、上线前 AI 体检。"
when_to_use: 项目新增/修改 AI、LLM 调用、提示词、Agent 功能时；上线前 AI 层体检；用户提到 agent 工程/AI 标准化/评估时。
---

# FullStack AI：六支柱轻量门禁（独立开发者裁剪版）

定位：管项目里「AI 相关代码」的工程标准。其他 FullStack 技能管流程，本技能管
**AI 层不裸奔**。完整版标准与校验脚本见全局 Skill `agent-dev-standards`
（`D:\Users\zigang.wang\.claude\skills\agent-dev-standards\`，六支柱 + 开发生命周期 +
references/ 六份深度文档 + validate_agent_standards.py）——本技能把它裁到个人项目
性价比最高的形态；要深挖某一支柱（如注入防护细节、span 设计）再读原版 references。

## 何时触发体检

1. 新增/修改 LLM 调用、提示词、Agent 功能（设计阶段就该过一遍红线）
2. bootstrap 建项目时检测到 AI 依赖
3. 上线前：AI 功能纳入 verify checklist 的附加项

## 六支柱裁剪对照表

| 支柱 | 原版要求 | 个人项目必做（裁剪版） | 评估落点 |
|------|---------|----------------------|---------|
| Prompt Management | 每条提示词独立版本化文件 | **Prompt as Code**：prompts/*.md 带 front-matter（name/version/description/vars）+ 代码生成器 + 防漂移测试；禁止提示词内联在业务代码里 | grep 业务代码里的内联长字符串 |
| Agent Registry | registry.yaml + 依赖图 | 技术文档里一节「AI 组件清单」：组件名/当前提示词版本/上游模型/调用点；改提示词 bump version 时同步此节 | tech-architecture.md 有无该节且未过期 |
| Tool Calling | 类型化 schema + 四态处理 | 每个外部调用有：超时、重试、**降级路径（AI 挂了主流程还能用）**；错误分「可恢复/不可恢复」两类处理 | 断网/错 key 时 App 行为 |
| Evaluation | ≥10 金样本 + CI 门禁 | **金样本回归测试**（≥10 例：正常/边界/失败态）；提示词任何改动必跑；分数低于阈值不上线 | 提示词改动的 PR 是否跑了回归 |
| Observability | spans + cost tags | 最轻形态：每次调用记一行日志（耗时/ token 用量/成败/提示词版本）；有看板需求再上 tracing | 出问题能否从日志还原现场 |
| Safety | 注入防护 + 权限模型 | key 不入库（.env + gitignore，或用户自配自存）；用户输入不裸拼进 system 提示词（走变量注入 + 长度截断）；外部动作权限最小化 | 搜 key 硬编码；搜提示词拼接方式 |

## 体检工作流（对 AI 层做一次）

1. **圈定 AI 面**：grep 模型调用/提示词加载，列出涉及的文件与包
2. **逐支柱打分**：✅ 达标 / ⚠️ 部分（写差距）/ ❌ 缺失，每条给 file:line 证据
3. **出问题清单**：P0-P2 + 补齐顺序（P0=安全与评估；Registry 可 P1；观测可 P1）
4. **落档**：结论追加到 `docs/ai-standards.md`（若无则建）：日期 + AI 层版本 + 打分表 + 记录
5. **补齐后重验**；此后每次 AI 层改动，verify 阶段加验「金样本回归已跑 + 版本号已 bump」

## 三条红线（不过就别上 AI 功能，无裁剪余地）

1. **金样本回归存在且通过**（Evaluation）——没有评估的 AI 功能 = 不可发布
2. **key 不入库**（Safety）——泄露即事故
3. **AI 失效不影响主流程**（Tool Calling 降级路径）——AI 是增强不是依赖

## 与其他技能的关系

- 提示词外置的具体流程（md→生成器→回归）与 test-map 同步，见 fullstack-trace。
- 金样本测试的用例编号规则，见 fullstack-trace 的测试名对齐约定。
- verify 收尾时，本技能红线作为 AI 功能批次的附加检查节。
