# 🚀 一键启动：AI 工作流引导提示词

> 这是本便携包的**核心交付物**。你不需要手动部署——把下面的「引导提示词」整段复制，喂给任意支持自定义规则/技能的 AI IDE（Cursor / Claude Code 等）的对话框，AI 会自动完成：分析你的仓库 → 部署工作流文件 → 适配占位符 → 生成 `.notes/` 知识资产初稿 → 自检验收。

---

## 📋 使用步骤（3 步）

1. **把整个 `portable-workflow/` 目录放到你的目标仓库下**（任意位置，如仓库根目录或 `.agent/`）。
2. **在 AI IDE 中打开目标仓库**，确保 AI 能读到 `portable-workflow/` 目录。
3. **复制下方「引导提示词」整段，粘贴到 AI 对话框发送**。然后按 AI 的提问补充信息即可。

---

## 🤖 引导提示词（复制以下全部内容喂给 AI）

```
你现在是一个「AI Coding 工作流部署助手」。我的仓库里有一个 `portable-workflow/` 目录，它是一套通用的、可移植的 AI Coding 工作流基础设施种子包。请你帮我把它一键部署并适配到当前这个仓库，让这个仓库立即拥有完整的 AI 工作流体系。

请严格按以下阶段执行，每个阶段完成后简要汇报，遇到需要我决策的点再问我：

【阶段 0：探查现状】
1. 读取 `portable-workflow/README.md` 和 `portable-workflow/ai-coding-workflow-architecture.md`，理解这套工作流的设计。
2. 探查当前仓库：读 README、扫描目录结构、识别技术栈（语言/框架/构建工具）、识别核心模块和业务域。
3. 判断当前 AI IDE 类型（Cursor / Claude Code / 其他），确定配置文件的目录约定：
   - Agent 入口：Cursor→根目录 `.cursorrules`；Claude Code→根目录 `CLAUDE.md`；其他→根目录 `AGENTS.md`
   - Rules：Cursor→`.cursor/rules/`；Claude Code→`.claude/rules/`；其他→`.agent/rules/`（或该工具约定的规则目录）
   - Skills：放到对应 IDE 的 skills 目录（如 `.claude/skills/`），无专属约定时放 `.agent/skills/`
   - 记忆/工作目录（工具无关）：记忆 `.agent/memories/`、任务 `.agent/context/`、观测日志 `.agent/eval/logs/`
   汇报：探查到的技术栈、核心模块、IDE 类型、目标部署路径。

【阶段 1：部署文件】
1. 把 `portable-workflow/AGENTS.md` 部署为对应 IDE 的 Agent 入口文件（按阶段 0 判断的路径和文件名）。
2. 把 `portable-workflow/rules/` 下所有 `.md` 复制到对应 IDE 的 rules 目录。
3. 把 `portable-workflow/skills/` 下所有 skill 子目录复制到对应 IDE 的 skills 目录。
4. 在仓库根创建 `.agent/context/`（任务持久化）、`.agent/eval/logs/`（观测日志）两个空目录。
   汇报：已部署的文件清单。

【阶段 2：适配占位符】
扫描所有部署后的文件，把以下占位符替换为当前仓库的实际值（无把握的先问我）：
1. Agent 入口里的 `{项目简述}`、`{交互语言}`（默认中文）、`{领域特定类型约束}`、`{项目特定铁律}`。
2. `coding-standards.md` 里的 `{领域特定约束示例}` 和注释块——根据技术栈补充（如涉及金额计算的项目补"金额用 BigDecimal 避免精度丢失"，前端项目补"组件用函数式写法"）。
3. `knowledge-router.md` 里的场景路由表 `{...}`——根据探查到的业务域和技术栈填充实际的资产路径。
4. `knowledge-index.md` 里的 `{占位符}`——初始阶段至少填好 Foundation 层。
5. `skill-routing.md` 里如有平台相关 Skill（如 CR 平台），替换为我团队实际使用的工具名。
6. `greeting.md`：问我是否有固定称呼偏好，有则填写，无则保持禁用。
   汇报：替换了哪些占位符，还有哪些需要我确认。

【阶段 3：生成 .notes 知识资产初稿】
按 `portable-workflow/templates/.notes-scaffold.md` 的结构，在仓库根创建 `.notes/` 目录，并基于你对仓库的分析生成以下必填文件的初稿（内容要基于真实代码分析，不要编造）：
1. `.notes/foundation/project-brief.md`：项目简报（项目做什么、服务谁、核心价值、核心业务流程）。
2. `.notes/foundation/system-map.md`：系统全景地图（模块总览、依赖关系、代码分层、外部依赖）。
3. `.notes/foundation/tech-context.md`：技术栈上下文（技术栈表、项目结构、构建运行命令、关键配置）。
4. `.notes/README.md`：知识库使用说明。
5. `.notes/knowledge-index.md`：把上面三个 Foundation 文件登记进索引。
   每个文件生成后，标注"⚠️ 本文件由 AI 基于代码分析生成初稿，请人工校对业务描述的准确性"。
   汇报：生成的文件清单 + 需要我重点校对的业务判断点。

【阶段 4：自检验收】
逐项确认并汇报：
- [ ] Agent 入口已部署到正确路径且占位符已填
- [ ] 所有 rules 已部署
- [ ] 所有 skills 已部署
- [ ] `.agent/context/`、`.agent/eval/logs/` 已创建
- [ ] `.notes/foundation/` 三个必填文件已生成
- [ ] `knowledge-index.md`、`knowledge-router.md` 已配置
- [ ] 全局扫描：确认部署后的文件里没有残留 `{占位符}`（除了刻意留作扩展提示的注释块）
最后，请用一个简单的真实任务（如"帮我解释一下 XX 模块的入口逻辑"）做一次冒烟测试，验证工作流能正常路由和响应。

执行约束：
- 这是部署任务，只允许创建/复制/适配工作流文件和 .notes 文档，禁止修改我仓库的任何业务代码。
- 占位符适配时，凡是涉及业务语义判断且你没把握的，必须问我，不要瞎填。
- 全程用中文汇报。
```

---

## 💡 部署后你会得到什么

| 产物 | 位置 | 作用 |
|------|------|------|
| Agent 入口 | IDE 对应路径 | AI 的身份、核心原则、行为边界、Compound Learning 闭环 |
| 9 个 Rules | IDE rules 目录 | 编码标准、任务执行（Spec 先行）、熔断、知识路由、观测、任务持久化、Skill 路由与编排 |
| 12 个通用 Skills | IDE skills 目录 | 任务派生、单测、CR、架构守护、业务分析、概念追踪、影响分析、Spec 验证、CR 流水线、知识管理、工作流回顾、Skill 创建 |
| `.notes/` 知识资产 | 仓库根 | 三层架构（Foundation/Patterns/Analysis），AI 的项目长期记忆 |
| `.agent/` 工作目录 | 仓库根 | 任务持久化（context）+ 行为观测日志（eval） |

## ⚠️ 注意事项

- **业务初稿必须人工校对**：阶段 3 生成的 `.notes/` 文件是 AI 基于代码的推断，业务语义描述可能有偏差，务必人工过一遍。
- **Patterns / Analysis 层渐进沉淀**：初次部署只生成 Foundation 层，编码范本、链路分析等随项目演进逐步用 `knowledge-asset-manager` Skill 沉淀。
- **Skill 按需裁剪**：12 个 Skill 不一定全用得上，详见 `README.md` 的「按需裁剪」章节。
- **跨 IDE 差异**：不同 AI IDE 对 rules/skills 的加载机制略有不同，如部署后某些 Skill 不生效，检查 IDE 的 Skill 注册方式。
