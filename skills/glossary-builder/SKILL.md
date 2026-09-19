---
name: glossary-builder
version: 1.0.0
description: "业务术语表构建器。扫描代码提取业务术语、枚举映射和同义词关系，沉淀到项目 glossary.md。触发词：术语表、glossary、同义词、术语提取、术语沉淀、业务术语、枚举对照。当用户需要构建或更新业务术语表、提取代码中的同义词映射、或需求分析前需要术语对齐数据时使用。"
---

# Glossary Builder（业务术语表构建器）

> **核心定位**：从代码中提取业务术语、枚举映射和同义词关系，沉淀为 `.notes/foundation/glossary.md` 的结构化数据。这是 req-standardizer 同义词检测和 AI友好度评分的**数据基础设施**。

## 🎯 触发场景

| 场景 | 触发词 |
|------|--------|
| 新项目/新模块上手，需要建立术语基线 | "建术语表"、"提取术语"、"glossary" |
| 需求分析前，术语对齐数据缺失 | "同义词梳理"、"术语沉淀"、"业务术语" |
| 代码中同义词混乱，需要整理 | "同义词提取"、"术语对照"、"枚举映射" |
| glossary.md 数据过时，需要刷新 | "更新术语表"、"刷新glossary" |

## 📋 执行流程

### Step 0：确定范围

1. **确认目标项目**：默认当前项目（读取 CLAUDE.md 确认项目路径）
2. **确认扫描范围**：
   - 全项目扫描（首次建表）
   - 指定模块扫描（如"只扫订单模块"）
   - 增量更新（已有 glossary，只更新变化部分）
3. **读取现有数据源**（按项目实际存在情况取用）：
   - 读取 `.notes/foundation/glossary.md`（如已有）
   - 读取 `.notes/` 下已有的表关系/术语对照类分析文档（身份同义词数据）

### Step 1：扫描枚举类

> **目标**：提取所有业务枚举的 code→含义映射，这是术语表的核心数据。

1. **定位枚举目录**：搜索项目所有 `enum` 类（`Glob **/*Enum.java`）
2. **逐类提取**：
   - 枚举类名 + 包路径
   - 每个枚举值的 code（字符串）+ 描述（从注释/字段提取）
   - 业务含义标注（从 JavaDoc + 使用场景推断）
3. **重点关注**：状态枚举、类型枚举、方向枚举——这些是需求文档和代码最常见的术语冲突点

**提取格式**：
```
| 枚举类 | code | 含义 | 使用场景 |
|--------|------|------|---------|
| OrderStatusEnum | PROCESSING | 处理中 | 订单提交后 |
```

### Step 2：扫描同义词映射

> **目标**：识别同一业务概念在代码中使用不同命名的场景。这是需求 AI 友好度评估的关键数据。

1. **身份字段同义词**（最常见、最高风险）：
   - `customerId` / `clientId` / `X-Customer-Id`（Header）
   - `accountId` / `subAccountId` / `subaccount`
   - `userId`（内部ID，通常不等于上述两者——典型高风险混淆点）
   - `productId` / `businessId`
   - `clientName` / `customerName`

2. **状态字段同义词**：
   - 搜索 DTO/Entity 中字段名含 `status`/`Status` 的字段
   - 识别同一状态概念使用不同字段名的情况

3. **动作同义词**：
   - `上架` / `发布` / `PUBLISH`
   - `认购` / `买入` / `BUY`
   - `赎回` / `卖出` / `SELL`

**提取方法**：
- 在 Entity/DTO 类中搜索字段名含 customerId/clientId/accountId/subAccountId/productId/businessId 的字段
- 在 ORM 映射文件（MyBatis XML / JPA 注解）中搜索 column 映射，找出同一值在不同表的不同列名
- 利用 `.notes/` 中已有的表关系分析文档作为输入（如存在）

**提取格式**：
```
| 标准术语 | 同义词1 | 同义词2 | 代码字段/枚举 | 来源表/类 |
|---------|---------|---------|--------------|----------|
| 客户号 | customerId | clientId | X-Customer-Id Header | t_user_info.client_id |
```

### Step 3：扫描业务动作术语

> **目标**：提取业务动作→代码方法名的映射，帮助 AI 理解需求描述与代码实现的关系。

1. **从 Controller/Service 方法名提取**：
   - `bind` → 钱包绑定
   - `verifyOwnership` → 验证所有权
   - `submitOrder` → 提交订单
   - `accept` → 受理
   - `confirmDeal` → 确认成交
   - `settle` → 结算

2. **从 PRD 术语提取**（如已有 onboarding 术语表）：
   - 认购 = 买入 = BUY
   - 赎回 = 卖出 = SELL
   - 受理 = accept
   - 成交 = deal

### Step 4：整合写入 glossary.md

> **核心产出**：将扫描结果按结构化格式写入 `.notes/foundation/glossary.md`。

1. **读取当前 glossary.md**（空壳或已有数据）
2. **按以下结构组织数据**：

```markdown
# 业务术语表（Glossary）

> 最后更新：YYYY-MM-DD
> 扫描范围：{模块列表}

## 1. 核心枚举体系

### 1.1 订单状态（OrderStatusEnum）

| code | 含义 | APP展示 | 需求文档用语 |
|------|------|---------|------------|
| PROCESSING | 处理中 | 处理中 | 提交中 |
| PENDING_ACCEPT | 待受理 | 待受理 | — |

### 1.2 产品类型（ProductTypeEnum）
...

## 2. 缩写与别名（同义词映射）

| 标准术语 | 同义词 | 代码字段/枚举 | 来源表/类 | 风险等级 |
|---------|--------|-------------|----------|---------|
| 客户号 | customerId, clientId, X-Customer-Id | Header | t_user_info.client_id | 🔴 高（易混淆） |
| 柜台账户ID | accountId, subAccountId, subaccount | AccountInfo.accountId | t_account_info | 🔴 高（易混淆） |
| 产品编码 | productId, businessId | Product.productId | t_product | 🟡 中 |
| 上架 | 发布, PUBLISH | PublishStatusEnum.PUBLISHED | — | 🟢 低 |

> **风险等级**：🔴=身份/权限相关，混淆会导致越权；🟡=业务逻辑相关，混淆会导致逻辑错误；🟢=展示相关，混淆只影响理解

## 3. 代码入口

| 业务动作 | Controller方法 | Service方法 | 模块 |
|---------|--------------|-----------|------|
| 钱包绑定 | WalletController.bind | WalletBindServiceImpl.bindCreate | wallet |
| 提交订单 | OrderController.submit | OrderService.submit | order |
```

3. **写入文件**：替换 glossary.md 全部内容（保留 frontmatter 元信息）

4. **质量自检**：
   - [ ] 枚举体系是否覆盖核心业务枚举（订单状态/产品类型/交易方向）
   - [ ] 同义词映射是否包含所有已知高风险同义词（身份字段）
   - [ ] 代码入口是否覆盖主要业务动作
   - [ ] 每条同义词是否有来源标注（表/类/字段）
   - [ ] 风险等级是否正确标注

## 📊 产出物

| 产出物 | 路径 | 说明 |
|--------|------|------|
| 术语数据 | `.notes/foundation/glossary.md` | 结构化术语+同义词+枚举映射 |
| 扫描日志 | `.agent/eval/logs/YYYYMMDD_HHmm_glossary-scan.md` | 记录扫描过程和发现（可选） |

## 🔗 与其他 Skill 的协作

**上游输入**：
- **knowledge-asset-manager** → glossary.md 格式规范
- 项目已有的表关系分析文档（`.notes/analysis/`）→ 身份同义词速查表（如已有数据）

**下游输出**：
- **req-standardizer** → Step 1 读取 glossary 对齐术语 + Step 1B 同义词冲突检测
- **code-business-analyzer** → 业务术语参考
- **us-coding-engine** → 编码时术语对齐
- **code-review-checklist** → CR 时术语一致性检查

## ⚠️ 约束

- **以代码为事实源**：术语提取必须基于实际代码（枚举类、Entity、DTO），不凭推测
- **同义词必须标注来源**：每条同义词映射必须说明来自哪个表/类/字段
- **不修改代码**：本 Skill 只产出知识资产，不修改任何业务代码
- **增量更新**：已有 glossary 时，合并新数据而非覆盖旧数据（除非旧数据已被验证为错误）
- **跨项目注意**：不同项目的 glossary 独立维护，不跨项目合并

## 质量自检

每次写入 glossary.md 后，必须检查：
- 枚举覆盖度：核心业务枚举是否都提取了？
- 同义词完整性：已知高风险同义词（身份字段）是否都记录了？
- 来源可追溯：每条数据是否有代码来源标注？
- 前端可理解：非技术人员能否看懂同义词映射？
