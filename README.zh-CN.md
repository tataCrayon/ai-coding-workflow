<p align="right"><a href="./README.md">English</a> · <b>中文</b></p>

# ai-coding-workflow

> **让 AI 像一个真正的高级工程师那样工作。**
>
> 这不只是一套工作流——它是一套**可移植、项目脱敏**的 AI 工程师「认知操作系统」。把它丢进任何代码仓库，喂一段提示词给你的 AI，就能一键长出完整的协作体系：**会先做功课再动手、会自我约束不失控、会记住教训不重蹈覆辙、会随项目一起成长**。
>
> 目标不是「让 AI 帮你写几行代码」，而是「让 AI 具备一个资深工程师的工作方式、判断力和成长性」。

<p align="center">
  <a href="#-为什么需要它">为什么</a> ·
  <a href="#-30-秒上手">30 秒上手</a> ·
  <a href="#-它强在哪">核心亮点</a> ·
  <a href="#-四层架构">架构</a> ·
  <a href="#-文档导航">文档</a>
</p>

<p align="center">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue.svg">
  <img alt="status" src="https://img.shields.io/badge/status-production--proven-success.svg">
  <img alt="ide" src="https://img.shields.io/badge/works%20with-Cursor%20%7C%20Claude%20Code%20%7C%20any%20agent-orange.svg">
</p>

---

## 💡 为什么需要它

市面上的 AI 编程助手很强，但每个用过的人都撞过同样的三堵墙：

| 痛点 | 你一定遇到过 | 本工作流的对策 |
|------|-------------|---------------|
| **AI 健忘** | 换个对话就失忆，每次从零解释项目背景 | 记忆系统 + 知识资产 + 任务持久化，跨会话不丢上下文 |
| **AI 幻觉** | 编造不存在的类和方法，只看一个文件就动手 | 行动前四问 + Spec 先行 + 事实性自动验证 |
| **AI 失控** | 陷入死循环反复改坏代码，或过度发散偏离需求 | 熔断协议 + 可逆性分级 + 上下文隔离的子代理 |
| **AI 不会成长** | 同样的错误反复犯，纠正过的下次照样错 | Compound Learning 闭环 — 每次纠正都沉淀为记忆/规则，越用越懂你的项目 |

> 这不是又一份「Prompt 模板」。它是一套**有约束、能自省、可进化**的认知操作系统——把一个资深工程师的工作方式（先调研、有边界、会复盘、能积累），沉淀成 AI 每一步都会自动遵守的「肌肉记忆」。

---

## 🚀 30 秒上手

```bash
# 1. 把本仓库作为子目录放进你的项目，或直接克隆
git clone https://github.com/<your-name>/ai-coding-workflow.git
```

2. 打开 **[`BOOTSTRAP.md`](./BOOTSTRAP.md)**，复制里面那段「引导提示词」。

3. 粘贴给你的 AI IDE（Cursor / Claude Code / 任意支持自定义规则的 Agent）。

**就这样。** AI 会自动：分析你的仓库 → 部署工作流文件 → 适配占位符 → 生成 `.notes/` 知识资产初稿 → 自检验收。

> 想手动部署或了解每个文件的作用？看 **[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)**。

---

## ✨ 它强在哪

这套工作流不是拍脑袋设计的，而是在**真实的企业级生产项目**中经过无数次迭代打磨出来的。几个真正有价值的设计：

### 🧭 行动前四问 —— 给 AI 装上「下意识」
每次动手前，AI 自动自检四件事：**召回历史教训 → 路由该用的技能 → 查项目知识 → 核验代码是否真实存在**。这一步把「AI 拍脑袋」变成「AI 先做功课」。

### 📐 Spec 先行 + 测试用例先行 —— 在写代码前消灭缺陷
复杂任务不允许直接写代码：先产出**经过事实性验证的技术方案（Spec）**，再经链路验证、一致性检查、反向推演、多视角审视。配套的「测试用例先行」哲学——**设计期写稳定的行为契约，编码期只跑回归，代码定稿后才落地测试类**——彻底解决了「测试随实现反复返工」的顽疾。

### 🧠 会「辅助决策」的记忆 —— 不只是记住，更是主动规避
现在很多 AI 工具都有了记忆功能，但大多停留在「记住你的偏好」。**这套工作流的记忆系统更进一步——它在每次行动前主动召回、参与决策。**

- **分类沉淀**：偏好（preference）/ 反馈纠正（feedback）/ 项目洞察（insight）/ 外部索引（reference）四类，各司其职
- **主动召回（行动前四问的 Q0）**：每次动手前先扫记忆索引，命中相关教训就加载，**在出错之前就规避**，而不是事后才想起
- **晋升机制**：每条记忆都带「为什么」，能判断边界情况；重要的教训还会晋升为强制规则
- **记忆卫生**：自动判断过时、合并同类、控制容量，记忆不会越攒越乱

> 区别一句话：别的记忆是「AI 记得你说过什么」，这里的记忆是「AI 在做每件事之前，先想想自己以前在这类事上栽过什么跟头」。

### 🔄 Compound Learning —— 让 AI 不在同一个坑跌倒两次
用户每一次纠正，都会触发「根因分析 → 记忆晋升评估 → 沉淀为记忆或规则」的闭环。工作流**用得越久越懂你的项目**，错误转化为可复用的资产——这正是资深工程师和新人的本质区别：**经验会积累**。

### 🛡️ 熔断协议 —— 给 AI 装上「断路器」
连续 3 次没解决就强制停下来换思路，外显进度计数器 + 五级行动阶梯，根治「AI 反复改坏代码」和「重复搜索轰炸」两类死循环。

### 🧩 四层架构 + 13 个可插拔技能 —— 既是宪法，也是工具箱
从「宪法」（AGENTS.md）到「路由」到「技能」到「闭环」，分层清晰、各司其职。13 个 Skill 按需裁剪，从单测、CR 到架构守护、知识沉淀、深度追问，覆盖研发全流程。

### 🔌 工具无关 —— 不绑定任何 IDE，不绑定任何业务
全部用中性约定和占位符设计，Cursor、Claude Code 或任意 Agent 都能跑；剥离了所有业务耦合，任何语言、任何领域的项目都能适配。

---

## 📐 四层架构

```
┌─────────────────────────────────────────────────────────┐
│  第四层 · 闭环与持久化层  任务持久化 · 熔断 · 观测 · 记忆    │  ← 越用越聪明
├─────────────────────────────────────────────────────────┤
│  第三层 · 领域技能层      13 个 Skill · 子代理 · 编排  │  ← 工具箱
├─────────────────────────────────────────────────────────┤
│  第二层 · 路由与决策层    Skill 路由 · 知识路由 · 复杂度判定 │  ← 大脑调度
├─────────────────────────────────────────────────────────┤
│  第一层 · 基础规则层      AGENTS.md · 编码标准 · 行为边界    │  ← 宪法
└─────────────────────────────────────────────────────────┘
```

完整设计理念与数据流见 **[`ai-coding-workflow-architecture.md`](./ai-coding-workflow-architecture.md)**。

---

## 📂 仓库结构

```
ai-coding-workflow/
├── README.md                              # 英文门面
├── README.zh-CN.md                        # 本文件 — 中文门面
├── BOOTSTRAP.md                           # ⭐ 一键启动引导提示词
├── ai-coding-workflow-architecture.md     # 四层架构说明
├── AGENTS.md                              # Agent 入口（身份/原则/边界/闭环）
├── LICENSE                                # MIT
├── docs/
│   └── DEPLOYMENT.md                          # 手动部署指南 + 按需裁剪 + 检查清单
│
├── rules/                                 # 基础规则层（10 个）
│   ├── greeting.md                            # 问候/称呼偏好（可选）
│   ├── coding-standards.md                    # 编码美学 + 编码自查十问
│   ├── task-execution.md                      # 任务执行框架（Spec 先行 + 测试用例先行）
│   ├── circuit-breaker.md                     # 熔断协议（防死循环）
│   ├── knowledge-router.md                    # 知识资产场景路由
│   ├── knowledge-index.md                     # 知识资产关键词索引
│   ├── eval-observer.md                       # AI 交互观测 + 摩擦点记录
│   ├── task-persistence.md                    # 任务持久化 + 多轮收敛
│   ├── skill-routing.md                       # Skill 消歧路由表
│   └── skill-orchestration.md                 # Skill 编排 + Agent 数据流转
│
├── skills/                                # 领域技能层（13 个，每个含 SKILL.md）
│   ├── task-spawner/                          # 任务派生 + 上下文压缩
│   ├── unit-test-master/                      # 单元测试引擎
│   ├── code-review-checklist/                 # CR 自查 + 生产就绪
│   ├── architecture-guard/                    # 架构合规检查
│   ├── code-business-analyzer/                # 业务分析引擎
│   ├── code-concept-tracer/                   # 概念追踪器
│   ├── java-change-impact-analyzer/           # 变更影响分析
│   ├── spec-verifier/                         # Spec 事实性验证
│   ├── cr-review-pipeline/                    # CR 评审流水线
│   ├── knowledge-asset-manager/               # 知识资产管家
│   ├── workflow-retrospective/                # 工作流回顾引擎
│   ├── skill-creator/                         # Skill 创建器
│   └── grill-me/                              # 深度追问（需求澄清）
│
└── templates/                             # 脚手架模板
    └── .notes-scaffold.md                     # .notes 知识资产目录结构
```

---

## 📖 文档导航

| 我想… | 看这里 |
|-------|--------|
| **立刻上手** | [`BOOTSTRAP.md`](./BOOTSTRAP.md) — 复制提示词喂给 AI |
| **手动部署 / 按需裁剪** | [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) |
| **理解设计理念** | [`ai-coding-workflow-architecture.md`](./ai-coding-workflow-architecture.md) |
| **看 AI 的「宪法」** | [`AGENTS.md`](./AGENTS.md) |

---

## 🤝 贡献与扩展

这套工作流的核心设计哲学就是**可进化**——欢迎 fork、裁剪、扩展。

- 加规则：在 `rules/` 新建 `{语义名}.md`
- 加技能：用 `skills/skill-creator` 创建新 Skill
- 加知识：按 Foundation / Patterns / Analysis 三层沉淀到 `.notes/`

遵循 AGENTS.md 中的「知识分流决策树」决定新知识该放哪一层。

---

## 📄 License

[MIT](./LICENSE) © crayon

> 这是我在无数次真实项目迭代中打磨出来的体系，凝结了对一个问题的全部思考：**怎样才能让 AI 不只是「会写代码」，而是真正像一个高级工程师那样去工作——会调研、有判断、守边界、能复盘、肯成长。**
> 现在把它开源，希望它能帮到每一个想认真用好 AI Coding 的人。Enjoy. 🚀
