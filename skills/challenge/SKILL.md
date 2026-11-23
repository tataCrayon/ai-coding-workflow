---
name: challenge
version: 1.0.0
description: "四路拷问，按被审对象选 mode：需求边界/方法最优/想法可行/决策对错。触发：追问我、这个做法最优吗、有没有人做过、这个决策对吗、质疑一下。"
---

# Challenge（四路拷问）

> **为什么要合并**：原来四个 skill 各自的语义边界是清楚的，但四条长描述同时常驻、触发词大量交叉（"质疑/拷问/这个方案对吗"），模型看到四条都在争同一句话。合并后**入口只有一条描述**，正文按 mode 加载——判定成本从"比对 4 条描述"降到"看一张表"。
>
> **能力零丢失**：四个 mode 的方法正文（追问框架、拷问循环、体检循环、DOUBT 循环、红线、验证清单）**原样保留**在 `references/mode-*.md`。唯一改动是把指向**已合并或已退役 skill** 的交叉引用改写成现名（grill-me → requirement mode、grill-method → method mode、DDD → decision mode、req-standardizer/spec-verifier/GDD 等 → 现行 backendflow/fullstack 阶段）。本文件只做路由，不复述任何方法。

## 第一步：判定 mode（先做这一步，不要跳过）

按**被审对象**选，不按用户的措辞选：

| Mode | 被审对象 | 典型触发 | 加载 |
|---|---|---|---|
| **requirement** | 需求：做什么、边界在哪 | "追问我"、"先别动手"、"想清楚再做"、"需求澄清"、新需求描述模糊、涉及资金/资产/权限 | `references/mode-requirement.md` |
| **method** | 方法：这条路线是最优的吗 | "这个做法最优吗"、"有没有更好的做法"、"check my approach"、多步/难回退/路线不显然的工作之前 | `references/mode-method.md` |
| **idea** | 想法：值不值得做、有没有人做过 | "这个想法靠谱吗"、"有没有人做过"、"可行性怎么样"、"别让我重复造轮子" | `references/mode-idea.md` |
| **decision** | 决策：这个具体决策对不对 | "这个决策对吗"、"审查设计"、"质疑一下这个决策"、即将提交非平凡代码/断言不明显结论 | `references/mode-decision.md` |

**四路接力顺序**（同一件事走完全程时）：

```
idea（要不要做 / 有没有人做过）
  → requirement（做什么 / 边界在哪）
    → method（怎么做最优）
      → decision（执行中每个非平凡决策对不对）
```

## 第二步：加载对应 reference

- 只加载**一个** mode 的 reference，不要四个一起读
- reference 里的触发条件、执行流程、红线、常见借口，全部**以原文为准**——不要用本文件复述的版本替代
- 原文中提到的其他三个 skill 名（如"区别于 grill-method"），现在都指向本 skill 的对应 mode

## 消歧（什么时候用错的 mode）

| 症状 | 改用什么 |
|---|---|
| 用 requirement 问出了"这么做是不是最优" | 换成 method |
| 用 method 问出了"这个需求该不该做" | 换成 idea（未验证）或 requirement（需求已定但边界不清） |
| 用 idea 却只做内部推理、没有向外检索 | 不是 idea——那是 method 或 decision |
| 用 decision 但只是自己在自问自答 | 不是 decision——DDD 必须 spawn 新上下文审查者；自问自答用 method 的 Mode A |

## 加载约束（继承自 decision mode）

`references/mode-decision.md` 要求 spawn 子 Agent，因此**不要在 Agent 的 `skills:` frontmatter 中添加本 skill**——Agent 里只用 requirement / method / idea 三个 mode，需要 DDD 时回主会话。

## 已合并的原始 skill

| 原 skill | 去向 |
|---|---|
| `grill-me` | `references/mode-requirement.md` |
| `grill-method` | `references/mode-method.md`（含其 evals/） |
| `idea-vetting` | `references/mode-idea.md`（含其 evals/） |
| `doubt-driven-development` | `references/mode-decision.md` |

原件归档在 `~/.claude/skills-archive/20261022_challenge-merge/`，可回滚。
