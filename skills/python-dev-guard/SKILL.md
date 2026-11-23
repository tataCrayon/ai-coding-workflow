---
name: python-dev-guard
version: 1.3.0
description: "Python 开发门禁：写码前/中/提交前强制检查，按场景路由到测试/异步/错误处理/类型/可观测参考，含注释纪律（禁变更日志式注释）。触发：python 门禁、跑门禁、检查代码、提交前检查、pre-check、guard、写注释、注释太多。"
---

# Python Dev Guard（Python 开发门禁）

> **核心信念**：语法错误不该出现在提交里；业务效果偏差必须在动手前用「验收标准」锁死，
> 而不是写完才发现。门禁的价值在于**机械化拦截**——不依赖记忆和自觉。

## 适用场景

- 任何 `app/` 下 Python 代码的修改/新增
- `bot/skills/*/order_agent` 等随项目分发的 Python 包修改
- 写完一段逻辑自认为完成时、准备声称"已完成"时

**不适用**：纯文档/配置/提示词改动（提示词走 `prompt_eval.py` 门禁）。

---

## 三道闸（按顺序，全绿才算完成）

### 闸 1：静态检查（写完立即跑，≤10 秒）

```bash
# 只查"真 bug"级问题：未定义名 F821、重定义 F811、未用导入 F401、f-string 空占位 F541
python -m ruff check <改动的文件或目录> --select F821,F811,F401,F541,F841,E501 --fix

# 类型检查（增量：只查改动模块 + 它的调用方）
python -m mypy <改动的文件> --ignore-missing-imports --no-error-summary
```

**拦截标准**：F821（未定义名）和 F811（重定义）零容忍——这就是"语法错误"类痛点的
主体；F401/F541/F841 顺手清理；E501 行宽超限不阻断。

mypy 是**增量渐进**的：存量代码不强求全绿，但**本次改动的函数签名/返回值**必须类型自洽。
历史盲区（如 `Optional` 误用、字典取值 None）在改动范围内必须修。

### 闸 2：运行时冒烟（改完必须执行，≤60 秒）

静态检查证明"代码写对了"，冒烟证明"代码能跑起来"：

```bash
# 编译级
python -m py_compile <改动的文件>

# 导入级（能 import 不代表能跑，但 import 失败一定不能上）
python -c "import app.<改动的模块>"

# 装配级（改编排/Handler/registry 必跑：真实 config 装配一遍，不连外部服务）
python -c "
import sys; sys.path.insert(0, '.')
from app.config import load_config
from app.agents.registry import AgentRegistry
from app.orchestrator import CrewOrchestrator
config = load_config()
registry = AgentRegistry(); registry.load()
orch = CrewOrchestrator(cc_client=None, config=config.router,
                        registry=registry, handler_registry=None)
print('assembly OK:', orch.get_graph_info()['node_count'], 'nodes')
"

# 已有测试（tests/ 目录存在且覆盖改动模块时）
python -m pytest tests/ -x -q 2>/dev/null || echo "no applicable tests"
```

**拦截标准**：任何一步 traceback = 未完成，禁止进入"汇报完成"。
补测试的写法（AAA 结构/命名/mock/markers）先读 `.claude/skills-ref/python-testing-patterns.md`。

### 闸 3：业务验收（业务逻辑改动必做，动手前先写）

写代码**之前**，先在回复里明确「验收标准」两层：

**第 1 层：用户时序走查（用户座位，先于一切 AC）**

AI 天然「按功能找着测」——只验证功能存在且管线通，不会自发问「用户看不看得到、
知不知道下一步做什么」。所以业务改动先回答：这个功能**用户从哪一步进来、每步看到什么**：

1. 该功能有 spec 用户操作时序（`docs/specs/_template.md` §二）→ 按时序逐步骤走查，
   填 `docs/checklist/user-journey-walkthrough.md` 的 AI 走查表（四问 + `[用户看到]` 断言 + 证据）
2. 无 spec 时序 → 小功能至少写 3 行微时序（Given/When/Then[用户看到]）再动手；
   复杂功能先补 spec 时序——这是设计缺口信号，不是测试细节

**第 2 层：AC 三要素（系统座位）**

1. **输入样例**：真实的用户消息/数据长什么样（从 logs/tasks/ 或案例库取真样本，不凭空造）
2. **期望输出**：逐字段说清期望行为（不只是"能跑"，而是"路由到 X、输出含 Y、Z 字段等于…"）
3. **验证方式**：怎么证明达标——真实调用一次引擎/Handler？golden 用例？还是双轨对照？

写完代码后两层**真实执行**：时序走查（用户视角，证据=面向用户的输出摘录）
+ AC 对照表（系统视角，证据=断言输出）一起贴在完成汇报里。
**只有 AC 对照表、没有时序走查的业务改动 = 未完成**——功能存在 ≠ 用户走得到、看得懂。
AI 验不了真机的步骤（飞书客户端点按钮等）转入人工走查清单交用户，不允许静默跳过。

历史教训模式（对照自查）：
- 函数签名记错/参数不存在 → 写调用前先 `grep def` 确认真实签名
- 引擎/第三方库行为假设错误 → 先跑一次最小调用看真实返回结构
- 多轮/聚合/异步时序想当然 → 画清状态流转再动手，写完跑并发双消息验证
  （async 改动先读 `.claude/skills-ref/async-python-patterns.md` 的 4 大坑清单）
- 改 A 处 B 处忘了同步 → 用 `docs/project-index.md` 查"派生物（勿手改）"列

---

## 闸 1.5：注释纪律（写注释时即时判，不靠事后整理）

**唯一判据**：这条注释能让下一个改这段代码的人（含 AI）**少做一次错误决定**吗？
答不上来就不写。注释解释**为什么代码必须长成这样**，不记录**它曾经长成什么样**。

| 禁止 | 例子 | 该写去哪 |
|---|---|---|
| 变更日志式 | `# 2026-11-03 用户要求改成先查缓存` | git log / CHANGELOG / `docs/features/` 简报 |
| 谁提的需求 | `# 用户指出行太长，改为换行` | 同上；代码里只留「换行是因为该行会撑到省略号」 |
| 新旧对比 | `# 原来是 table，现在改成 column_set` | 只写改用 column_set 的**约束理由**（table 不支持按钮/分页上限） |
| 事故编号堆叠 | `# 2026-09-30 DATA2026093002 串单事故` | 简报证据锚点；代码里写「不挂回去引用正文会丢」 |
| 裸 TODO | `# TODO: 优化` | 要么立刻做，要么 `TODO(@人/工单号)` |

**该保留的**（正是要写的）：
- 反直觉约束：`# 飞书 table 的 width 只吃百分比，传像素直接 400`
- 为什么不用更"自然"的写法：`# 用字符集包含度而非二元组：中文同义改写二元组几乎不重叠`
- 不可恢复的边界：`# 归属不在候选集里就丢弃——写进别人的 PRD 比漏报代价高`
- 单源指向：`# 判据单源在 bot/prompts/agents/x.md，此处只做校验`

**密度**：一个函数 0～2 条，且只出现在"读代码会读错"的地方。成段文档写在模块 docstring
的顶部（讲清职责与关键取舍），函数体内不重复一遍。

**机械化拦截**（有 lint 的项目）：

```bash
python -X utf8 -m app.eval.comment_lint app/     # portal-bot：0 容忍
```

无 lint 的项目用同等 grep 自查：`grep -rnE "#.*(20[0-9]{2}-[0-9]{2}-[0-9]{2}|用户(要求|指出|反馈|指定))"`

---

## 提交前门禁（git commit 前的最后一步）

```bash
# 全量快速体检（对已改文件）
git diff --name-only | grep "\.py$" | xargs -r python -m ruff check --select F821,F811,F401,F541,F841
git diff --name-only | grep "\.py$" | xargs -r python -m py_compile
```

加上仓库既有门禁：提示词改动 → `python app/scripts/prompt_eval.py`（score < 80% 阻断）；
本仓（portal-bot）另加注释门禁 `python -X utf8 -m app.eval.comment_lint app/`。

---

## 与其他 Skill 的关系

- **agent-engineering-pack**（专家包入口）：本 skill 是其成员，负责代码实现态三道闸；
  完整的 Agent 开发任务链路由见包 SKILL.md 的场景路由表
- **agent-dev-standards**：Agent 设计态标准（6 支柱/gate checklist），与本 skill 互补
  （设计面 vs 代码面）；其 validate 脚本的目录约定与 portal-bot 不同，结论仅供参考
- **challenge**（decision mode）：闸 3 的"验收标准"拿不准时（非平凡决策），先走质疑循环
- **architecture-guard**：跨模块改动前先跑架构守卫，确定改哪里才合规
- **code-simplification**：门禁全绿后若实现偏重，再简化；不为了简化破坏闸 1-3

## 深度参考库（按场景路由，写作/评审时读对应参考）

本仓库 `.claude/skills-ref/` 存有 5 份精选的 Python 工程实践参考
（源自 wshobson/agents 库，MIT，已本地化裁剪价值）。**写对应类型的代码前先读一份**：

| 改动类型 | 先读参考 | 关键要点 |
|---------|---------|---------|
| 写/改测试（闸 3 验证方式） | `python-testing-patterns.md` | AAA 结构、命名 `test_<单元>_<场景>_<期望>`、mock 重试/时间、markers、coverage 阈值 |
| async/并发代码（编排器、Handler） | `async-python-patterns.md` | 同一调用链纯 sync 或纯 async；gather+return_exceptions；wait_for 超时；4 大坑（漏 await/阻塞循环/吞 CancelledError/混用） |
| 异常/校验设计 | `python-error-handling.md` | Fail fast；异常带 what/why/fix；`raise ... from e` 保链路；批量部分失败分开记 |
| 加类型注解/泛型/Protocol | `python-type-safety.md` | 公开签名全注解；`X \| None` 现代联合；narrowing guard 后收窄类型；少用 Any |
| 日志/指标/追踪 | `python-observability.md` | 结构化 JSON 日志；关联 ID 贯穿（本项目已有 trace_id 体系，对齐即可）；指标标签基数有界 |
| **调外部 CLI/HTTP 返回体** | 先真跑一次看原始 JSON | 字段名、列表里第一项是"本体"还是"回复"、某接口只接受哪一类 id——这些都不在文档里。凭印象写的解析会静默返回空串（最坏形态：不报错、只是永远无效） |

**使用规则**：读参考是为了**吸收规则后再写码**，不是写完对照。闸 3 的验收标准
如果参考里有现成模式（如重试逻辑的三个测试），直接套用其结构。

## 给编排器（ZCode/Claude）的指令

修改 Python 代码的任务，默认按本 Skill 流程收尾：
完成闸 1 + 闸 2 并在最终回复中展示命令输出摘要；业务逻辑改动必须附
闸 3 双层结果（用户时序走查表 + AC 对照表）。
声称"完成"前缺任何一闸 → 明确标注"未过门禁"。
改动涉及上表 5 类场景时，先读对应参考再动手。
**写/改注释时按闸 1.5 判**：不写日期、不写"用户要求"、不写新旧对比——那些归 git 与简报。
