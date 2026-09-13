# 演进记录：V1.0 → V2.0 → V3.0

> 本文档回答一个问题：**V3.0 改了什么、为什么改**。每一条都有实测证据支撑——这套工作流的迭代本身就是 EDD（评估驱动开发）的示范。

## 版本总览

| 版本 | 日期 | 主题 | 一句话 |
|------|------|------|--------|
| V1.0 | 2026-07-09 | 流程奠基 | Spec 先行 + 测试用例先行 + EDD 闭环 + 12 铁律门禁 |
| V2.0 | 2026-07-31 | 硬门禁 + 记忆 | L2 Agent-as-Judge、Compound Learning、记忆主动召回 |
| **V3.0** | **2026-09-11** | **收敛与理解** | 专家包唯一入口 + 理解账本 + 多工具归一 + 上下文预算纪律 |

## V3.0 的五个转变（每条：旧 → 新 → 证据）

### 1. 开发流程：平行 Skill 群 → 专家包唯一入口（OPT-035）

- **旧**：20+ 流程 Skill 靠 description 描述路由；三层嵌套（任务执行 → SOP 管道 → 阶段管道），3-8 改动点任务膨胀到 30+ subagent。
- **新**：1 个专家包（入口+分级+阶段技能），S/M/L 轻重双路，S 级任务不进包零仪式。
- **证据**：盘点出 33 对同名漂移 Skill（req-standardizer 两版差 1.8KB）；209 行路由表描述着不存在的能力；用户自述"Skill 太多，AI 并没有真正用到"。**路由可靠性取决于入口数量，不取决于 description 质量。**

### 2. 人的位置：审批者 → 学习者（OPT-036，理解账本）

- **旧**：全流程产出物都是 AI-facing 的（plan/SOP/CR 报告），用户是签章机器。
- **新**：comprehension-ledger 四钩子把"人的理解"变成有借有还的账：H1 签收前边界问答、H2 收尾三件套（一页纸+实码时序图+自测）、H3 Leitner 间隔复习、H4 能力保鲜。账本人类可直读（markdown），不评分不 KPI。
- **证据**：用户自述"AI 帮我做完了，但我对需求业务没有印象"；"Skill 太多了，我都不知道有哪些了"——业务债与工作流债同源。学习科学依据（testing effect / spaced repetition / pretesting / generation / dual coding）见 [skills/comprehension-ledger/references/design-notes.md](../skills/comprehension-ledger/references/design-notes.md)。

### 3. 部署形态：每工具一份 → ~/.agents 单一真相源（OPT-037）

- **旧**：Claude Code / ZCode 各一份配置，静默漂移。
- **新**：`~/.agents/` 唯一权威，工具目录退化为 junction 壳；格式分裂的资产（MCP/Memory）用 ai-tool-migrator 迁移。
- **证据**：路由表真相修正时发现多处死条目；junction 化后配置修改点归一，修改"改哪里不再需要想"。详见 [MULTI-TOOL-AUTHORITY.md](./MULTI-TOOL-AUTHORITY.md)。

### 4. 上下文预算：全量注入 → 分层按需（OPT-033）

- **旧**：规则全量常驻，裸开场 50-60K tokens，没干活先烧一大笔。
- **新**：规则分 `core/`（8 件常驻）与 `methodology/`（12 件按需显式加载）；SKILL.md ≤500 行、深度内容下沉 references；方案交付 1 页主文档 + 附录分层。
- **证据**：实测必读注入 113K→46K 字节（-60%）；用户反馈"方案有时候信息太多了"。

### 5. 质量观：防 AI 幻觉 → 同时防"人的理解债"（P5 实测，sess_2e277706）

首个 L 级需求全流程实测结论：
- **赚到**：现状摸底发现约七成已在历史分支实现（255+87 commits），需求从"全量开发"修正为"合分支+增量"，提前探出 10 文件双改冲突——"先查真相源再动手"一条规则回本。
- **门禁忠实**：方案未签收，零生产代码落地。
- **暴露并已修**：H1 边界问答 9 题连发，用户只逐条回答前 3 → 修正为**按重要性选材、数量不设硬上限**（预算上限=用户愿意逐条应答）；**问答题（Q）与默认决策（D）分开编号**，默认决策签收时显式复述，**沉默不当作同意**。

## V3.0 配套资产

| 资产 | 说明 |
|------|------|
| [EXPERT-PACKAGE-PATTERN.md](./EXPERT-PACKAGE-PATTERN.md) | 专家包模式定义 + 迁移方法 + 实战案例 |
| [MULTI-TOOL-AUTHORITY.md](./MULTI-TOOL-AUTHORITY.md) | ~/.agents 归一 + junction 落地坑 + 迁移器 |
| [skills/comprehension-ledger/](../skills/comprehension-ledger/) | 理解账本（已发布 GitHub/SkillHub 的通用版） |
| [scripts/check-links.py](../scripts/check-links.py) | 死链三层巡检（断链/缺 SKILL.md/幽灵引用） |
| [skills/audit-slim/](../skills/audit-slim/SKILL.md) | 工作流审计瘦身：触发证据分级 + **Step 0 版本升级一致性巡检** + 防回潮闸门 |
| 第一代流程 Skill ×9 | 打弃用横幅保留，可单步使用 |

## 治理原则（V3.0 起生效）

1. **路由透明化**：加载非显而易见的能力时输出"用了 X，因为 Y"。
2. **归档不删除**：退役能力进归档区，回滚=移回。
3. **单一真相源**：内容只存一处，他处用链接（junction/hardlink）；改副本=错误。
4. **巡检常态化**：check-links.py 进 H4 节奏（Skill 增删时 + 月度）。
5. **评估驱动**：工作流变更必须带证据立项（OPT 编号留痕），禁止凭感觉重构。
