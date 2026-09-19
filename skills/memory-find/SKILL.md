---
name: memory-find
version: 1.0.0
description: "语义记忆检索 Skill。从记忆目录 (memory/) 和知识资产 (.notes/) 中按关键词召回相关记忆，输出优先级排序的候选记忆 + 来源文件路径 + 匹配片段。触发词：之前做过/讨论过/处理过 XX、查记忆、找记忆、记忆里有、search memory、recall memory。也适用于用户需要跨会话回忆之前的决策、踩坑、方案。"
---

# Memory-Find（语义记忆检索）

> 核心信念：记忆不检索等于没有记忆。解决"线性 MEMORY.md 索引在记忆≥100 条后退化"的问题，用关键词多维度召回替代人工翻目录。

## 触发

**硬触发**（用户主动）：
- "之前讨论过 XX"、"之前处理过 XX"
- "查一下记忆"、"记忆里有 XX 吗"
- "search memory XX"、"recall XX"

**软触发**（AI 自觉）——以下场景应主动建议：
- 用户问"我们之前有没有做过 XX"——这类询问天然需要检索记忆
- 用户描述一个场景/问题，AI 怀疑记忆中有相关避坑经验
- 编码阶段遇到"这个坑之前踩过"——主动检索反模式记忆

## 检索范围（两级，按需）

### 一级：记忆目录（快，核心）
工具的记忆目录（部署时确定，如 `.agent/memories/`、`~/.claude/projects/<项目编码>/memory/`、`~/.zcode/cli/memories/projects/<hash>/`）下所有 `.md` 记忆文件。

### 二级：知识资产（深度，按需）
项目 `.notes/` 下所有 .md 文件

> 默认只搜一级。用户说"全局搜"或"也查笔记"时扩展到二级。

## 召回算法

### 1. 关键词提取（从用户查询）
从用户查询中提取关键词，遵循以下规则：
- 中英文混合：中英文分别提取，中文做 2-gram 分词（如"估值折美"→ ["估值", "折美", "估值折", "值折美"]），英文保持原词
- 去除停用词：的、了、是、在、有、和、与、或、the、a、an、is、are、was、were、to、of、in、for、on
- 识别专有名词：API、SQL、DTO、MCP、PRD 等大写缩写保持原样不拆分

### 2. 匹配与打分
对每个记忆文件计算 `relevance_score`：

```
# 关键词加权：2-gram 权重 1.5，单字 0.5，英文缩写 1.0
# 停用词过滤：中文口语词（的/了/怎么/我们/之前/处理/进行…）+ 英文高频词（the/a/is/this/that…）

# 因子1：加权关键词命中密度（权重 0.5）
weighted_density = sum(命中关键词的权重) / sum(全部关键词权重)
base_score += min(weighted_density, 1.0) * 0.5

# 因子2：唯一关键词命中率（权重 0.2）
unique_ratio = 命中不同关键词数 / 关键词总数
base_score += unique_ratio * 0.2

# 因子3：文件名/description 标题匹配（权重 0.3）
# 任意关键词命中文件名或 frontmatter description → +0.3
title_bonus = any(keyword in filename or description) ? 0.3 : 0

# recency boost（时效加成）
# 7天内修改 ×1.2，30天内 ×1.1，更早 ×1.0
score *= recency_multiplier
```

### 3. 输出格式
按 score 降序排列，返回：

```markdown
## 记忆检索结果："{查询原文}"

| # | 分数 | 记忆文件 | 匹配片段 |
|---|------|---------|---------|
| 1 | 0.85 | [[order-valuation-flow]] | "本币市值 = round(quantity × unitPrice, scale(currency))" |
| 2 | 0.72 | [[holding-query-link]] | "canSell = tokenQty.min(shareQty)" |
| ... | ... | ... | ... |

### 摘要
{2-3 句话总结：相关的记忆主要涉及哪些领域、最匹配的是哪条、建议阅读哪个文件}
```

结果数：默认 top 5，查询词超过 3 个关键词时可扩展到 top 10。

## 与现有体系的关系

```
用户查询 → memory-find Skill（本 Skill：关键词召回）
         → 用户看到结果后，可进一步要求 AI 深入阅读具体记忆文件
         → 如需提炼/更新记忆 → memory-manager Agent
         → 如需沉淀新知识 → knowledge-asset Agent
```

**不替代**：MEMORY.md 索引（全局导航仍然有效）、memory-manager Agent（分层/去重/晋升）、knowledge-asset Agent（知识图谱）。

## 约束

- 只读操作，不修改任何记忆文件
- 优先用 Grep（快），Glob 仅用于确认文件存在性
- 绝不编造记忆内容——匹配片段必须来自实际文件内容，用 `[...]` 标注截断
- 如果一级召回结果 0 条，自动扩展搜索二级（.notes/），并告知用户"记忆目录无匹配，已扩展到知识资产"
- 如果两级都无结果，告知用户"记忆和资产中均未找到相关内容"，并建议确认关键词