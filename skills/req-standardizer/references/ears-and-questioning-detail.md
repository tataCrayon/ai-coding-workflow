# EARS 语法模式与五层追问详细参考

## 一、EARS 语法模式与示例

| 类别 | 语法模式 | 示例 |
|------|---------|------|
| **Ubiquitous**（普适） | The `{system}` shall `{behavior}` | The **payment system** shall **record every transaction with timestamp, amount, and payer ID**. |
| **Event-Driven**（事件驱动） | When `{event}`, the `{system}` shall `{behavior}` | When **a user submits a withdrawal request**, the **wealth platform** shall **validate available balance before processing**. |
| **State-Driven**（状态驱动） | While `{state}`, the `{system}` shall `{behavior}` | While **the product is in suspended status**, the **display system** shall **hide the product from all client portals**. |
| **Optional**（可选） | Where `{feature}` is enabled, the `{system}` shall `{behavior}` | Where **multi-currency settlement** is enabled, the **accounting system** shall **convert amounts to base currency at the daily rate**. |
| **Exceptional**（异常） | If `{condition}`, the `{system}` shall `{behavior}` | If **the external KYC service returns a timeout**, the **registration system** shall **queue the request for retry and notify the compliance team**. |

**分类原则**：始终成立→Ubiquitous；有触发事件→Event-Driven；持续状态→State-Driven；按配置/租户→Optional；异常/失败→Exceptional。

## 二、五层追问模板（整合自 grill-me）

**第一层：Why**（业务意图）——追问需求存在理由和时机。示例问题：
- 这个需求解决什么业务痛点？不做会怎样？有没有不用改代码的替代方案？
- 成功后可观测的业务指标是什么？为什么现在做而不是下个版本？

**第二层：What Not**（边界排除）——追问反面和停止条件。示例问题：
- 哪些场景明确不属于本次需求？最常见的误触发场景是什么？
- 前置条件不满足时报错还是静默跳过？什么情况下需要回滚？合规红线是什么？

**第三层：When Wrong**（异常路径）——追问失败后的业务期望。示例问题：
- 关键操作失败后业务期望什么——重试/标记/人工介入？部分成功怎么办？
- 用户看到的是"失败提示"还是"处理中"？下游依赖方会怎样？

**第四层：Who & Where**（影响范围）——追问上下游和一致性。示例问题：
- 改了这个接口下游有哪些消费者受影响？不同供应商行为是否一致？
- 存量数据是否需要迁移/修复？是否涉及多租户或多环境差异？

**第五层：How Deep**（隐性约束）——追问默认假设和深层依赖。示例问题：
- 有没有默认假设某条件永远成立？如果它不成立呢？数值精度问题？
- 操作有顺序依赖吗？并发执行会怎样？审批超时/被拒怎么办？

## 三、01-requirements.md 输出模板

```markdown
# 01-requirements.md — {需求名称}

## 需求来源
- 来源：{PRD 文件路径 / 飞书链接 / 自然语言描述}
- 版本/日期：{文档版本} / {分析日期}

## EARS 需求表
| ID | EARS 类别 | 需求描述 | 优先级 | 自审缺陷 | 追问状态 |
|----|----------|---------|--------|---------|---------|

## 自审缺陷清单
| # | 缺陷类型 | 涉及需求 | 严重度 | 处理状态 |
|----|---------|---------|--------|---------|

## 追问答案归档
### 第一层：Why — 结论
### 第二层：What Not — 结论
### 第三层：When Wrong — 结论
### 第四层：Who & Where — 结论
### 第五层：How Deep — 结论

## 非功能需求
| 类别 | 需求 | 约束值 |
|------|------|--------|

## 术语对照表
| 术语 | 定义 | 来源 |
|------|------|------|

## 阻塞项（未闭环的 🔴 问题）
| # | 问题 | 阻塞范围 | 建议动作 |
|----|------|---------|---------|
```

## 四、需求分析 → User Story 拆分过渡指引

需求标准化完成后过渡到 User Story 拆分的规则：
- 每个 EARS 需求项（REQ-NN）对应 1 或多个 User Story
- Event-Driven / Exceptional 类需求拆为独立 Story
- Ubiquitous / State-Driven 类需求合并为跨 Story 的约束
- Optional 类需求按功能开关拆为独立 Story + 配置 Story
- 非功能需求作为各 Story 的验收标准附加项

## 五、红线规则

**涉及资金/资产/权限变更的需求**，以下问题未回答前禁止进入设计/编码：
1. 资金流转完整路径是什么？每一步失败怎么办？
2. 权限变更影响范围是什么？哪些角色失去/获得什么权限？
3. 资产状态变更一致性保证是什么？并发操作怎么处理？
4. 合规红线是什么？触碰后怎么处理？谁负责合规审查？

违反红线 = 未经标准化直接编码 = 高风险行为，AI 必须拒绝执行并提示先完成需求标准化。
