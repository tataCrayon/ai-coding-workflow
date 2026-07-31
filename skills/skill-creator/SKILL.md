---
name: skill-creator
version: 1.0.0
description: "Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, update or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy. 触发词：创建Skill、新建Skill、优化Skill、修改Skill、测试Skill、评估Skill、Skill描述优化。"
---

# Skill Creator（Skill 创建器）

用于创建新 Skill 并迭代改进的 Skill。

概而言之，创建一个 Skill 的流程如下：

- 确定你希望 Skill 做什么，以及大致的实现方式
- 撰写 Skill 初稿
- 创建几个测试 prompt，在附带该 Skill 的 claude 上运行它们
- 帮助用户从定性和定量两个维度评估结果
  - 在后台运行的同时，如果没有现成的定量评估，先起草一些，然后向用户解释
  - 使用 `eval-viewer/generate_review.py` 脚本向用户展示结果供其查看，同时提供定量指标
- 根据用户对结果的评估反馈重写 Skill
- 重复此过程直到满意
- 扩大测试集，在更大规模上再次验证

你的职责是判断用户处于流程的哪个阶段，然后帮助他们推进到下一步。

当然，你应该保持灵活——如果用户说"我不需要跑一堆评估，随便聊聊就行"，你完全可以那样做。

Skill 完成之后（顺序同样灵活），你还可以运行 Skill description 优化器来提升 Skill 的触发准确性。

## 与用户沟通

Skill Creator 的使用者可能涵盖从零基础到资深工程师的各种人群。注意上下文线索，判断应该用何种语言风格沟通！如果你不确定对方是否理解某个术语，可以简要解释。

---

## 创建 Skill

### 捕获意图

首先理解用户的意图。当前对话可能已经包含用户希望捕获的工作流（例如用户说"把这个变成 Skill"）。如果是这种情况，先从对话历史中提取答案——使用的工具、步骤序列、用户做的修正、观察到的输入/输出格式。

1. 这个 Skill 应该让 AI 能做什么？
2. 这个 Skill 应在何时触发？（哪些用户用语/上下文）
3. 预期的输出格式是什么？
4. 是否需要设置测试用例来验证 Skill 的有效性？

### 询问与调研

主动询问边界情况、输入/输出格式、示例文件、成功标准和依赖关系。等这部分敲定之后再写测试 prompt。

### 撰写 SKILL.md

根据用户访谈，填写以下组件：

- **name**：Skill 标识符
- **description**：何时触发、做什么。这是主要的触发机制——既要说明 Skill 的功能，也要包含具体的触发上下文。让 description 稍微"强势"一些，以对抗触发不足的问题。
- **compatibility**：所需工具、依赖（可选，极少需要）
- **Skill 的其余内容**

### Skill 撰写指南

#### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### Progressive Disclosure

Skill 使用三级加载体系：
1. **Metadata**（name + description）— 始终在上下文中（约100词）
2. **SKILL.md body** — Skill 触发时加载到上下文（理想情况下<500行）
3. **Bundled resources** — 按需加载（不限量，scripts 可以在不加载的情况下执行）

**关键模式：**
- SKILL.md 控制在 500 行以内；如接近此上限，增加层级结构并给出明确的指引
- 在 SKILL.md 中清晰引用文件，并说明何时需要读取它们
- 对于大型参考文件（>300行），包含目录表

**领域组织**：当一个 Skill 支持多个领域/框架时，按变体组织：
```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

#### 无意外原则

Skill 不得包含恶意代码、漏洞利用代码或任何可能危及系统安全的内容。如果 Skill 的描述已清楚说明了意图，其内容不应让用户感到意外。

#### 撰写模式

在指令中优先使用祈使句形式。

**定义输出格式：**
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**示例模式：**
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### 撰写风格

尽量向模型解释事情为何重要，而非大量使用 MUST 式的强硬指令。运用心智理论（Theory of Mind），尽量让 Skill 具备通用性。先写初稿，然后以全新视角审视并改进。

### 测试用例

写完 Skill 初稿后，构思 2-3 个真实的测试 prompt。与用户分享以供审核。将测试用例保存到 `evals/evals.json`。

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

---

## 运行和评估测试用例

本节是一个连续流程——不要中途停下来。

将结果放在 `<skill-name>-workspace/` 中，与 Skill 目录同级。在工作空间内，按迭代组织结果（`iteration-1/`、`iteration-2/` 等）。

### Step 1：在同一轮次中启动所有运行

对每个测试用例，启动两个子 agent——一个附带 Skill，一个不附带（基线）。同时启动所有运行，使它们大约在同一时间完成。

为每个测试用例编写 `eval_metadata.json`，使用基于测试内容的描述性名称。

### Step 2：在运行进行中起草断言

为每个测试用例起草定量断言。好的断言应可客观验证，并具有描述性名称。

### Step 3：记录计时数据

每个子 agent 完成时，将 `total_tokens` 和 `duration_ms` 保存到运行目录中的 `timing.json`。

### Step 4：评分、汇总并启动查看器

1. **评分每条运行** — 根据输出评估每个断言
2. **汇总为基准报告** — 运行汇总脚本生成 `benchmark.json` 和 `benchmark.md`
3. **分析师通读** — 发掘聚合统计可能掩盖的模式
4. **启动查看器** — 同时呈现定性输出和定量数据

### Step 5：读取反馈

当用户完成审核后读取 `feedback.json`。空反馈意味着用户认为结果可以接受。

---

## 改进 Skill

### 如何思考改进

1. **从反馈中泛化。** 我们的目标是创建可在许多不同 prompt 下多次使用的 Skill。不要过度拟合特定示例，尝试不同的隐喻或模式。

2. **保持 prompt 精简。** 删除没有发挥作用的内容。阅读 transcript，看 Skill 是否让模型在无效的事情上浪费时间。

3. **解释原因。** 尝试解释指令背后的推理。当前的 LLM 很聪明——当给出良好上下文时，它们能超越刻板指令行事。

4. **寻找跨测试用例的重复工作。** 如果所有测试用例都独立编写了类似的辅助脚本，就把该脚本打包到 Skill 中。

### 迭代循环

改进 Skill 之后：

1. 将改进应用到 Skill
2. 在新的 `iteration-<N+1>/` 目录中重新运行所有测试用例
3. 使用 `--previous-workspace` 指向上一轮迭代来启动审核器
4. 等待审核，再次改进，重复

持续迭代直到用户满意、反馈全部为空、或无法取得实质性进展。

---

## Description 优化

SKILL.md frontmatter 中的 description 字段是决定 AI 是否调用 Skill 的主要机制。创建或改进 Skill 之后，主动提议优化 description 以提升触发准确性。

### Step 1：生成触发评估查询

创建 20 条评估查询——混合应触发和不应触发的场景。查询应贴近真实情况并包含具体细节。**应触发查询**（8-10条）应覆盖不同表述方式。**不应触发查询**（8-10条）应聚焦于近边界误触场景。

### Step 2：与用户审核

将评估集呈现给用户审核。

### Step 3：运行优化循环

优化循环将评估集拆分为 60% 训练集和 40% 测试集，评估 description、提出改进并迭代（最多5轮）。按测试集得分选择最优方案以避免过拟合。

### Step 4：应用结果

将最优 description 更新到 Skill 的 SKILL.md frontmatter。展示修改前后的对比并报告得分。

---

## 高级：盲测对比

如需对两个版本进行严格对比，可使用盲测对比系统——将两个输出交给一个独立 agent，不告知它哪个是哪个，让它评判质量。这是可选功能，大多数用户不需要。

---

## 参考文件

agents/ 目录包含专用子 agent 的指令：
- `agents/grader.md` — 如何根据输出评估断言
- `agents/comparator.md` — 如何进行盲测 A/B 对比
- `agents/analyzer.md` — 如何分析一个版本胜过另一个版本的原因

references/ 目录包含额外文档：
- `references/schemas.md` — evals.json、grading.json 等的 JSON 结构定义

---

## 核心循环总结

1. 弄清楚 Skill 的目标
2. 撰写或编辑 Skill
3. 在测试 prompt 上运行带 Skill 的 AI
4. 与用户一起评估输出（定性 + 定量）
5. 重复直到满意
6. 优化 description 以提升触发准确性
7. **⚠️ 提醒用户执行同步**：Skill 修改完成后，提醒用户运行 `bash {ai-coding-workflow路径}/scripts/sync-skills.sh` 同步到全局+项目级
