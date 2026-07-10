# 扩展指南

> 如何在通用工作流基础上，为你的项目创建特定的规则、技能和知识资产。

---

## 一、创建项目特定 Skill

### 何时需要创建新 Skill

- 项目有重复出现的编码模式，需要 AI 每次都遵循特定步骤（如"新增 XX 类的 SOP"、"YY 配置接入指南"）
- 项目有特有的质量检查维度（如合规检查、数据一致性检查）
- 通用 Skill 无法覆盖的场景（如特定业务域的规则解读）

### 创建流程

1. **使用 `skill-creator` Skill**（硬约束）：所有 Skill 创建必须通过 `skill-creator`，遵循测试评估流程，不允许直接写 SKILL.md 跳过评估
2. **命名规范**：
   - 通用 Skill 用 `code-{能力描述}` 或 `{领域}-change-impact-analyzer` 格式
   - 项目特定 Skill 用 `{项目简写}-{能力描述}` 格式（如 `wealth-fund-nav-analyzer`）
   - 避免与通用 Skill 名称冲突
3. **与通用 Skill 协作**：项目特定 Skill 在协作章节声明与通用 Skill 的上下游关系
4. **版本管理**：所有 SKILL.md 必须包含 `version` 字段（遵循语义化版本）

### Skill 大小建议

- SKILL.md 推荐控制在 **500 行以内**
- 超过 500 行时，将详细指南拆分到 `references/` 子目录，SKILL.md 只保留概览和流程
- `references/` 文件按需加载，不常驻 context

---

## 二、沉淀知识资产

### 什么时机沉淀

| 触发时机 | 沉淀什么 | 放在哪一层 |
|---------|---------|-----------|
| 项目部署完成后 | 项目简报、系统地图、技术栈、术语 | Foundation |
| 代码分析完成某业务域后 | 链路分析报告、规则解读 | Analysis |
| CR 发现重复出现的编码问题时 | 编码范本、反模式 | Patterns |
| 需求变更/架构决策后 | ADR、SOP 更新 | Foundation/Patterns |
| Bug 修复/用户纠正后 | 教训记忆 | Memory |

### 什么粒度沉淀

- **Foundation 层**：每个资产一个文件，覆盖全局
- **Patterns 层**：每种编码模式一个范本文件；每种常见问题一个排查文件
- **Analysis 层**：每个业务域一个子目录，每条核心链路一个分析文件
- **避免过度拆分**：一个文件应覆盖一个完整的概念，不要把一个概念拆成 3 个小文件

### 沉淀流程

1. 使用 `knowledge-asset-manager` Skill 的工作流 A（增量创建）进行沉淀
2. 每个资产必须包含 TL;DR 摘要段（3-5 行）
3. Analysis 层资产必须包含 `last_verified` 日期字段
4. **必须同步更新 `knowledge-index.md` 索引**

---

## 三、裁剪不需要的 Skill

### 退役流程

1. **退役判定**：连续 2 次工作流回顾零触发 **且** 功能可被其他 Skill 完全替代
2. **影响评估**：检查 `skill-orchestration.md` 中是否有编排协议依赖该 Skill；检查 `skill-routing.md` 中是否有路由条目指向该 Skill
3. **退役执行**：
   - 在 `skill-routing.md` 中标注退役日期和替代者
   - 在 SKILL.md frontmatter 中标注 `status: deprecated`
   - 退役的 Skill 文件保留在目录中（不删除），便于追溯
4. **归档**：连续 3 次工作流回顾确认退役 Skill 无回归需求后，移入 `skills/_archived/` 目录

---

## 四、团队规范与通用框架的关系

### 多层架构的协调

通用工作流与团队规范（如 SDD-Toolkit、公司编码规范等）可能同时存在于项目中。协调原则：

1. **冲突裁决**：团队铁律 > 通用框架规则 > 项目个人效率层
2. **互补而非覆盖**：团队规范定义"底线"，通用框架提供"增强"
3. **显式声明关系**：在平台适配层（如 CLAUDE.md）中声明与团队规范的冲突裁决规则

### 典型场景

| 场景 | 处理方式 |
|------|---------|
| 团队规范有"禁止 @Autowired"铁律，通用框架 coding-standards.md 也有 | 保留团队铁律为权威，通用框架标注"参见团队规范" |
| 通用框架有 Spec 先行流程，团队有 SOP 流程 | 在平台适配层声明：团队 SOP 为强制流程，Spec 先行为增强方法论 |
| 团队有统一的 CR 平台 Skill，通用框架有 code-review-checklist | 使用团队 Skill 替代通用 Skill，在 skill-routing.md 中标注替代关系 |

---

## 五、知识分流决策树（新增知识放哪里）

```
新知识 → Q1: 违反会导致严重后果（数据错误/数据丢失/用户体验崩坏）？
          YES → Rule（alwaysApply=true）
          NO → Q2: 每次做这类任务都需要遵守？
                 YES → Q3: 是行为约束还是操作指南？
                        行为约束 → Rule（alwaysApply=false，场景触发）
                        操作指南 → Knowledge Asset（.notes/patterns/）
                 NO → Q4: 跨会话有复用价值？
                        YES → Memory（feedback/preference/insight）
                        NO → 仅保留 eval 日志，不持久化
```

**Rule ↔ Memory 关系**：关键信息可同时存在于 Rule（高保障）和 Memory（丰富上下文），这是 intentional redundancy，不视为冗余。
