---
name: req-standardizer
version: 1.0.0
description: "This skill should be used when the user asks to '分析需求', '聊需求', '把需求聊透', '需求文档', 'PRD分析', 'EARS需求', '需求澄清', '需求标准化', '标准化需求', or mentions PRD/需求文档/需求分析. Make sure to use this skill whenever the user provides a PRD or natural language requirement description, even if they don't explicitly ask for requirement analysis. This skill transforms raw requirements (PRD, Feishu docs, natural language) into EARS-format structured requirement documents with integrated five-layer deep questioning (from grill-me). It is the mandatory first step before any design or coding work on a new requirement."
---

> ⚠️ **V3.0 起由专家包模式取代**：本 Skill 从「全流程编排件」降级为「可独立使用的单步工具」。
> 新项目建议按 [docs/EXPERT-PACKAGE-PATTERN.md](../../docs/EXPERT-PACKAGE-PATTERN.md) 用「唯一入口 + 轻重双路」收敛流程 Skill，
> 本文件保留用于单步场景与历史参考。演进原因见 [docs/EVOLUTION-V3.md](../../docs/EVOLUTION-V3.md)。


# Req-Standardizer（需求标准化器）

> **核心定位**：将原始需求（PRD、飞书文档、自然语言描述）转化为 EARS 格式的结构化需求文档，同时通过五层深度追问（Why/What Not/When Wrong/Who & Where/How Deep）发现并消除模糊点。这是任何新需求进入开发流程前的**必经关卡**。

## 什么时候触发

**硬触发**（用户主动要求）：
- 用户说"分析需求"、"聊需求"、"把需求聊透"、"需求文档"、"PRD分析"
- 用户说"需求澄清"、"需求标准化"、"标准化需求"、"EARS需求"
- 用户提供了 PRD 文档或飞书链接，即使未显式要求分析

**软触发**（AI 自觉判断）——以下场景应**主动**切换到本 Skill：
- 新需求描述只有"做什么"，缺少"什么不做"/"异常怎么办"
- 涉及资金/资产/权限变更的操作——未经需求标准化直接编码是高风险行为
- 用户跳过需求分析直接要求设计方案或写代码——应先拦截并建议标准化

## 执行流程

### Step 1: 读取需求输入

从用户提供的来源加载原始需求：
- **PRD 文档**：读取指定文件路径
- **飞书链接**：调用飞书相关 Skill 获取文档内容
- **自然语言描述**：直接使用对话中的需求描述

读取项目知识资产对齐术语：
1. `.notes/foundation/glossary.md`——术语表
2. `.notes/knowledge-index.md`——定位相关已有分析

**🔴 事实校验提示**：如果需求描述中提到具体类名、接口名、方法名或数据库表名（如"扩展 XXService.doSomething"、"新增 t_xxx 表"），必须用 Grep/Glob 验证其在代码库中真实存在后再引用。不验证则不得在输出中使用该实体名——用自然语言描述替代（如"扩展下单服务的新方法"而非"扩展 OrderService.createOrder"），交由后续 changepoint-planner 或 spec-verifier 阶段精确定位。

### Step 2: EARS 分类

将需求中的每个功能点/行为要求归类到 EARS 五类之一：

| EARS 类别 | 适用场景 | 语法模式 |
|-----------|---------|---------|
| Ubiquitous | 始终成立的行为 | The {system} shall {do something} |
| Event-Driven | 由特定事件触发 | When {event}, the {system} shall {do something} |
| State-Driven | 在特定状态下成立 | While {state}, the {system} shall {do something} |
| Optional | 可选功能 | Where {feature} is enabled, the {system} shall {do something} |
| Exceptional | 异常处理 | If {exception}, the {system} shall {do something} |

详细语法模式和示例见 `references/ears-and-questioning-detail.md`。

### Step 3: AI 自审

对 EARS 分类结果执行系统性扫描，标记以下缺陷：

| 缺陷类型 | 扫描内容 |
|---------|---------|
| 遗漏边界场景 | 是否缺少"什么时候不执行"的描述 |
| 模糊措辞 | 是否包含"等"、"相关"、"适当"、"必要时"等无法精确实现的词 |
| 未指定异常处理 | 是否有功能点未覆盖失败/超时/降级场景 |
| 非功能需求缺失 | 是否缺少性能/可用性/安全/合规约束 |
| 隐性假设 | 是否有"所有人都知道但没人写下来"的前提条件 |

扫描结果作为 Step 4 追问的种子。

### Step 4: 五层深度追问

整合 grill-me 的五层追问框架，对每类缺陷和每个 EARS 需求项逐层追问：

1. **Why**：为什么做？为什么现在做？不做会怎样？
2. **What Not**：什么不做？边界在哪？前置条件是什么？
3. **When Wrong**：失败了怎么办？部分成功怎么办？用户体验是什么？
4. **Who & Where**：谁受影响？哪里受影响？上下游依赖是什么？
5. **How Deep**：隐性假设？精度约束？序列化约束？审批超时？

追问问题整理为结构化清单，呈现给用户等待回答。追问模板见 `references/ears-and-questioning-detail.md`。

**红线**：涉及资金/资产/权限变更的需求，🔴 必须回答的问题未解答前，**禁止进入设计或编码阶段**。

### Step 5: 生成结构化需求文档

将 EARS 分类结果、AI 自审发现、追问答案整合为 `01-requirements.md`，输出到任务上下文目录（`.agent/context/`）或知识资产目录（`.notes/analysis/`）。

输出模板见 `references/ears-and-questioning-detail.md`。

## 输出格式

最终产物是 `01-requirements.md`，包含：
- 需求来源与上下文
- EARS 分类需求表（每条需求标注类别、编号、优先级）
- 自审缺陷清单（已解决/未解决）
- 追问答案归档（五层追问的结论）
- 非功能需求清单
- 术语对照表

## 质量自检

生成需求文档后必须执行以下三项自检，未通过则修正后再输出：

1. **EARS 覆盖完整性**：原始需求中的每个功能点是否都有对应的 EARS 需求项？是否有遗漏？
2. **追问闭环性**：🔴 必须回答的问题是否全部有答案？未回答的是否已标注为阻塞项？
3. **可实现性**：每条 EARS 需求是否足够精确，开发者可以直接据此实现而不需要二次追问？

## 与其他 Skill 的协作

| 关联 Skill | 关系 |
|-----------|------|
| `grill-me` | 本 Skill 整合 grill-me 的五层追问框架，追问环节直接复用 |
| `spec-verifier` | 需求文档是 Spec 验证的输入——spec-verifier 校验需求覆盖度 |
| `task-spawner` | 复杂需求分析完成后，可通过 task-spawner 持久化为任务文件 |

**上游输入**：无（req-standardizer 是需求分析入口）
**下游输出**：
- **userstory-decomposer**：结构化需求 → User Story 拆分
- **changepoint-planner**：结构化需求 → 改动点规划

## References

详细参考资料不内嵌于本文件，以保持主文件精简：
- `references/ears-and-questioning-detail.md`——EARS 语法模式、五层追问模板、输出模板、红线规则
