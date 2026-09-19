# 演进记录：V1.0 → V2.0 → V3.0 → V3.1

> 本文档回答一个问题：**V3.0 改了什么、为什么改**。每一条都有实测证据支撑——这套工作流的迭代本身就是 EDD（评估驱动开发）的示范。

## 版本总览

| 版本 | 日期 | 主题 | 一句话 |
|------|------|------|--------|
| V1.0 | 2026-07-09 | 流程奠基 | Spec 先行 + 测试用例先行 + EDD 闭环 + 12 铁律门禁 |
| V2.0 | 2026-07-31 | 硬门禁 + 记忆 | L2 Agent-as-Judge、Compound Learning、记忆主动召回 |
| **V3.0** | **2026-09-11** | **收敛与理解** | 专家包唯一入口 + 理解账本 + 多工具归一 + 上下文预算纪律 |
| **V3.1** | **2026-09-19** | **能力扩充与迁移** | 方法论审查四道闸 + craft 组入库 + workflow-migrator 跨机器迁移 + 存量件实战增强 |

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

---

## V3.1：能力扩充与迁移（2026-09-19）

V3.0 收敛了流程；随后一个多月的实战又沉淀出一批**方法论层**能力，且暴露了新的操作性问题："换一台电脑，这套工作流怎么跟过去？" V3.1 把两类都收进种子包（Skill 23 → 33）。

### 1. 方法论审查四道闸（新增 grill-method / doubt-driven-development / idea-vetting，与已有 grill-me 成组）

- **旧**：grill-me 只管需求澄清；"这个做法是不是最优"、"这个决策定稿前谁来反驳"、"这个想法值不值得投入"三类问题没有对应能力，全凭 AI 自觉。
- **新**：按审的对象分工——grill-me 审**需求**（做什么）、grill-method 审**方法**（怎么做是否最优路线，含 Mode A 自我拷问判决卡 / Mode B 交互式三轮拷问）、doubt-driven-development 审**决策**（新上下文对抗审查，CLAIM→EXTRACT→DOUBT→RECONCILE→STOP）、idea-vetting 审**新想法**（向外检索先例与理论，判决必落"采纳/改造/先验证/放弃"）。
- **落点**：AGENTS.md 新增第 7 条工作流原则「方法先审再走」；skill-routing.md 新增「方法论审查类」分区表 + 软触发总纲；S 级小任务明确不触发（防过度仪式，延续 V3.0 轻重双路精神）。

### 2. craft 组入库（code-simplification / memory-find / glossary-builder / context-stacking）

实战验证过的通用单步能力，脱敏后入包：行为不变降复杂度（与 code-review-checklist D0 互补）、记忆关键词召回打分（解决 MEMORY.md 线性索引在 ≥100 条后退化）、代码→术语表/同义词/枚举映射沉淀、三步法精深学习（与理解账本互补：账本管"项目内的理解债"，context-stacking 管"通用知识的学习"）。

### 3. workflow-migrator：仓库→新环境的纵向迁移（V3.1 主交付）

- **问题**：MULTI-TOOL-AUTHORITY 解决"一台机器多工具归一"，ai-tool-migrator 解决"工具 A→工具 B 横向迁移"；但**新电脑第一次拿到种子仓库怎么装**没有标准流程——手动拷贝容易漏占位符适配、覆盖既有资产、留下死链。
- **新**：`skills/workflow-migrator/` 把迁移固化为四个 Phase：拿仓库 → 识别方向与形态（A 拷贝 / B 归一）→ `scripts/scan_migration.py` 只读盘点（冲突矩阵 new/identical/differs）→ 执行 + check-links.py 零死链硬门禁 + 迁移报告（只增不删，回滚=删除迁入项）。深度细节在 `references/migration-playbook.md`（逐工具路径映射、同名冲突裁决流程、Windows junction 坑表、shared-references 处理、报告模板）。
- BOOTSTRAP.md 顶部加「V3.1 提示」分流：新环境恢复走 migrator，首次部署进项目走引导提示词。

### 4. 存量件实战增强（脱敏后入库）

- **api-doc-generator**：五项硬规则（防乱码双层/示例必填/同步确认门禁/网关全路径/更新防重复）+ 网关路由扫描 + tag 粒度约定——来自真实接口平台事故的沉淀，个人环境中的 token/接口 ID/内部系统名已脱敏为占位符。
- **shared-references**：openapi-schema-conventions 补 YApi 两条铁律与 tag 约定；api-security-conventions 补身份获取铁律（禁止直读 Header/Parameter）与 IDOR 归属校验约定（框架专有名改为通用描述）。
- **workflow-optimization-log**：接 comprehension-ledger H4 钩子（Skill/Rule 增删时提醒刷新能力一页纸），与真相源的全局版对齐。
