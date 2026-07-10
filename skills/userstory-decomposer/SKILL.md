---
name: userstory-decomposer
version: 1.0.0
description: "Breaks structured requirements into standard User Stories with acceptance criteria and coverage matrix. Trigger words: 拆Story, 拆User Story, 需求拆解, US分解, 写User Story, 验收标准, 覆盖矩阵, 拆需求, Story拆分, User Story分解, 需求拆分, 验收标准, Story拆解. Use this skill whenever the user has a structured requirement document and needs to break it into actionable User Stories."
---

# Userstory Decomposer (需求拆解器)

> **核心定位**：将标准化需求文档拆解为可执行的 User Stories，每条 US 包含验收标准引用、优先级、工作量估算和飞书任务标题，并产出 AC-US 双向覆盖矩阵确保无遗漏。
>
> **前置条件**：需要有标准化需求文档（`01-standardized-requirements.md` 或用户提供的需求文本）。如果缺少前置文档，先调用 `req-standardizer` 生成。

---

## 4-Phase 执行流程

### Phase 1：需求理解与 AC 提取

1. **读取需求文档**
   - 读取标准化需求文档（`01-standardized-requirements.md`）
   - 如用户直接提供了需求文本，先将其标准化

2. **提取 Acceptance Criteria（AC）**
   - 从需求文档中逐条提取验收标准
   - 每个 AC 编号：AC-R01, AC-R02, ...
   - 分类标注：功能类 / 非功能类 / 约束类 / 接口类
   - 对模糊的 AC 追加澄清问题（标注"待澄清"）

3. **AC 间依赖关系梳理**
   - 标注 AC 之间的前置依赖（如 AC-R05 依赖 AC-R03）
   - 标注 AC 之间的互斥关系（如 AC-R07 与 AC-R09 不能同时满足）

### Phase 1 完成标志
- AC 清单已提取并编号
- 依赖和互斥关系已标注

---

### Phase 2：US 拆解

基于 AC 清单，按以下维度拆解 User Stories：

#### 2.1 拆解维度选择

优先使用能产生最清晰拆解的维度，不要求覆盖所有维度：

| 维度 | 适用场景 | 拆解策略 |
|------|---------|---------|
| **功能点** | 功能边界清晰的需求 | 每个独立功能点一个 US |
| **用户角色** | 多角色差异化操作的需求 | 每个角色的核心操作一个 US |
| **流程节点** | 链式流程型需求 | 每个流程节点一个 US |
| **数据实体** | CRUD 型需求 | 每个实体的核心生命周期一个 US |

#### 2.2 US 格式

每条 User Story 必须包含以下完整结构：

```
### US-{编号}: {标题}

**Story**: As [{角色}], I want [{功能}], so that [{价值}]

**AC Refs**: AC-R01, AC-R03, AC-R05
**Priority**: P0 / P1 / P2
**Effort**: S / M / L / XL
**Feishu Task Title**: [{简短标题，用于飞书任务同步}]
```

- **Story** 必须严格遵循 "As-I want-So that" 三段式
- **AC Refs** 必须引用 Phase 1 提取的 AC 编号，不允许无引用的 US
- **Priority** 基于业务价值和紧急程度判定
- **Effort** 基于改动点复杂度估算（参考 `changepoint-planner` 产出）
- **Feishu Task Title** 控制在 20 字以内，便于飞书任务卡片展示

#### 2.3 US 间关系标注

- 标注 US 之间的依赖关系（如 US-03 依赖 US-01）
- 标注 US 的执行顺序建议

### Phase 2 完成标志
- 所有 US 已拆解并编号
- 每个 US 都有 AC 引用
- US 间关系已标注

---

### Phase 3：产出确认请求（Skill 输出末尾）

- Skill 输出末尾附带确认请求：列出所有 User Stories，请用户逐条审阅
- 用户可以：
  - 确认全部 US
  - 调整某条 US 的 Story 表述
  - 调整优先级或工作量估算
  - 合并或拆分某条 US
  - 增补遗漏的 US
- **主会话负责等待用户反馈**，确认结果持久化到 `02-user-stories.md`
- > **平台适配**：Skill 工具单次调用，无法暂停。确认由主会话在 Skill 返回后执行。

### Phase 3 完成标志
- 用户已确认所有 US
- `02-user-stories.md` 已更新为确认版

---

### Phase 4：覆盖矩阵与自检

#### 4.1 AC-US 双向覆盖矩阵

生成覆盖矩阵，确保每个 AC 至少被一个 US 覆盖，每个 US 至少引用一个 AC：

```
| AC | US-01 | US-02 | US-03 | US-04 | ... |
|----|:-----:|:-----:|:-----:|:-----:|:---:|
| AC-R01 | ✅ | | | | |
| AC-R02 | | ✅ | | | |
| AC-R03 | ✅ | | ✅ | | |
| ... | | | | | |
```

**覆盖检查规则**：
- 每个 AC 列至少有一个 ✅（无覆盖则标记 ❌，需补 US）
- 每个 US 行至少有一个 ✅（无 AC 引用则标记 ❌，需补 AC 或删除 US）

#### 4.2 自检清单

生成覆盖矩阵后，必须输出以下自检清单逐项确认：

```
US 拆解自检清单：
- [ ] 每个 AC 至少被一个 US 覆盖（覆盖矩阵中无 ❌ 列）
- [ ] 每个 US 至少引用一个 AC（覆盖矩阵中无 ❌ 行）
- [ ] 所有 US 的 Story 格式符合 "As-I want-So that" 三段式
- [ ] 所有 US 的 AC Refs 指向真实存在的 AC 编号
- [ ] US 间依赖关系无循环依赖
- [ ] Priority 和 Effort 估算无空白项
- [ ] Feishu Task Title 长度均 ≤20 字
- [ ] 需求文档中的约束类 AC 有对应 US 覆盖
```

### Phase 4 完成标志
- 覆盖矩阵已生成且无 ❌
- 自检清单全部通过
- `02-user-stories.md` 最终版已持久化

---

## Output

所有产出存放到 `docs/sop-traces/{需求编号}/` 目录：

| 文件 | 说明 |
|------|------|
| `02-user-stories.md` | User Stories 清单 + AC 清单 + 覆盖矩阵 + 自检结果 |

文件格式遵循项目 SOP 留痕规范，包含阶段元信息（执行时间、参与人、确认状态）。

---

## References

| 文件 | 内容 |
|------|------|
| `sop-pipeline-orchestrator/SKILL.md` | 全流程编排器，本技能是 Phase R 的子技能 |
| `req-standardizer/SKILL.md` | 前置技能，产出标准化需求文档 |
| `changepoint-planner/SKILL.md` | 后续技能，基于 US 规划改动点 |
| `code-review-checklist/SKILL.md` | Review 维度与清单参考 |
| `unit-test-master/SKILL.md` | 测试策略参考 |

---

## Collaboration（协作说明）

| 协作对象 | 协作方式 |
|---------|---------|
| `req-standardizer` | 前置技能，本技能消费其产出的标准化需求文档 |
| `sop-pipeline-orchestrator` | 上游编排器，在 Phase R 中调用本技能 |
| `changepoint-planner` | 后续技能，消费本技能产出的 User Stories |
| `task-spawner`（PAUSE 模式） | 断点持久化，对话过长时存档进度 |
