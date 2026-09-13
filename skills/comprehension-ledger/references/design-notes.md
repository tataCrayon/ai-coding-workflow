# 设计笔记：为什么是这四个钩子

记录理解账本的设计依据，供想改进本 Skill 的人理解每个决定背后的理由。核心洞察来自一次真实工作流治理（OPT-036）：**理解债不只是业务债，也是工作流自身的债**——用户曾面对自己几十个 Skill 说"我都不知道有哪些了"。

## 症状诊断

AI 编码时代的理解债有三层：

| 层 | 症状 | 传统解法为何失效 |
|----|------|------------------|
| 业务理解债 | "AI 帮我做完了，但我对需求和业务没有印象" | 写文档没用——文档是 AI-facing 的，写完没人读；人是**审批者**不是**学习者**，没有学习动作发生 |
| 工作流理解债 | "Skill 太多了，我都不知道有哪些了，也不知道有没有利用好" | 清单会被写，但会漂移（实测 33 对重复 Skill、路由表描述不存在的 Skill）——没有保鲜机制 |
| 反馈债 | 答错的点没人知道，文档继续缺那块信息 | 事后文档"求全"，而非"按理解缺口补" |

## 学习科学依据（每个钩子对应一个机制）

| 钩子 | 机制 | 来源 |
|------|------|------|
| H1 边界问答 | **Pretesting effect**：提问在先，即使答错也加深后续学习 | Kornell et al. 2009；放在签收前 = 分歧暴露成本最低的时机 |
| H2 三件套 | **Generation effect**（自己讲一遍）+ **Dual coding**（图+文）+ **Testing effect**（自测） | Slamecka & Graf 1978; Paivio; Roediger & Karpicke 2006 |
| H3 间隔复习 | **Spaced repetition**：提取练习间隔化，效果远优于集中重复 | Leitner 盒经典调度；Cepeda et al. 2006 meta-analysis |
| 补课模式 | 区分「遗忘」与「没懂」：连错 2 轮 = 编码失败，需重讲（重编码），不是再考 | 直接教学（Direct Instruction）的 re-teach 判据 |
| 毕业即止 | 测试的目的是形成稳定记忆，不是维持考试压力；过度测试引发回避 | 期望效应：流程若令人痛苦，人会用沉默绕开它 |

## 关键设计决定与被排除的方案

### 为什么调度单位是"需求次数"而不是天数？

天级间隔重复（Anki 式）要求人主动打开卡片——**行为不会发生**。而每个需求开工必经方案阶段，复习搭车在这个必然节点上，零额外意志力成本。代价是粒度粗（隔 1/2/5 个需求 ≈ 天数不定），但对"不靠意志力"这个目标，粗粒度是特性不是缺陷。

### 为什么不评分？

实测过评分制的团队流程（KPI 化）会催生"应试行为"：用户开始准备答案而不是理解链路。理解账本只记 ✓/✗ 和题目本身，错题是**回填文档的信号**，不是对人的评价。

### 为什么钩子是"寄生"而不是独立命令？

独立命令（"每天复习一次"）依赖人记得调用——和 Anki 同样死法。寄生在既有流程节点上（签收前/收尾/开工），由 AI 主动发起，人只需口答。铁律"钩子只插一行"保证宿主工作流不被侵入。

### 被排除的方向（为什么不做）

| 方向 | 排除理由 |
|------|----------|
| 接入 SM-2/FSRS 等成熟 SRS 算法 | 精确调度收益 < 复杂度成本；需求次数三盒已够用，且账本必须人可直读手改 |
| 自动生成"知识图谱"/向量库 | 又一个 AI-facing 产物，不产生人的理解；违背"账本 human-facing"铁律 |
| 强制考试门禁（答不对不许合码） | 与"不评分不 KPI"冲突；强门禁会让人开始讨厌需求本身 |
| 给团队共享的排行榜 | 直接违反目标——这是个人理解资产，不是绩效工具 |

## 实测锚点

原始实现（本 Skill 的前身）在 Java 金融工作区（RWA 业务）验证：
- 触发点：用户自述"做完需求没印象" + "Skill 太多不知道有哪些"。
- 同一机制同时治理业务债（ledger.md）与工作流债（capability-map.md + H4）。
- Token 预算实测：常驻 ~150 tokens（仅 description），每次钩子 ≤2K。

## 引用

- Roediger & Karpicke (2006). Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention.
- Kornell, Hays & Bjork (2009). Unsuccessful Retrieval Attempts Enhance Subsequent Learning.
- Cepeda et al. (2006). Distributed Practice in Verbal Recall Tasks: A Review and Quantitative Synthesis.
- Paivio (1971). Mental Imagery and Verbal Processes. （Dual Coding Theory）
