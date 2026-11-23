# FullStack 专家包

可迁移的 AI Coding 工作流：一个独立开发者 + AI CLI 会话做中长期项目的完整方法。
提炼自知归簿（know-u-time）2026-08~09 全程 AI Coding 实战，融合 superpowers /
spec-kit / OpenSpec / Cline Memory Bank / HumanLayer context engineering 的共性机制。

## 装什么

9 个技能 = 1 个入口 + 8 个阶段技能，覆盖 S/M/L 分级下的全生命周期：

```
fullstack-bootstrap   入口：项目分级 + 10 分钟脚手架 + 会话开始/收工铁则（含 3 份深度参考）
fullstack-spec        需求与方案：澄清五问 + 产品文档版本化 + 变更提案五件套 + 签收门禁
fullstack-plan        拆解：2-5 分钟任务粒度，五要素（文件/改法/验证/坑/完成定义）
fullstack-impl        执行：TDD 纪律 + 子代理分工 + 防自由发挥
fullstack-verify      收尾：七项 checklist，一项不过不提交，完成须证据
fullstack-handoff     交接：STATUS 压实 + plan 勾选，换会话/换机器 30 秒接上
fullstack-design      前端：两级 demo 门禁（UX 灰阶拍流程 → 视觉 Token 拍观感）+ 评审清单
fullstack-trace       追溯：test-map/code-map 需求-代码映射地图
fullstack-ai          AI 层：六支柱轻量门禁（提示词版本化/评估/安全…，深度引用 agent-dev-standards）
```

## 解决什么（与 know-u-time 八类实战问题的对应）

| 实战问题 | 解药 | 技能 |
|---------|------|------|
| 设计方案丢失 | 方案落盘 + 签收门禁 + 状态压实 | spec / handoff |
| icon 不好看 | 图标方法论 Skill（寓意先行+48px 验收） | design（引用 ai-app-icon-prompting） |
| UI 不统一没审美 | Token 单一来源 + 两级 demo 门禁 + 评审清单 | design |
| 需求说不清（尤其页面） | UX demo 即澄清工具：灰阶可点击线框先拍流程，再拍观感 | design |
| 测试慢/内存爆/等工具 | 坑账本（确定性对策）+ 子代理隔离 | bootstrap / impl / verify |
| 需求代码无映射 | test-map/code-map + 测试名对齐用例编号 | trace |
| 验证困难 | 七项收尾 + Evidence over claims 门禁 | verify |
| 不懂专业术语 | 口语→术语→落点三级对照 | bootstrap |
| 跨会话失忆 | 磁盘当内存：STATUS+plan+dev-log | handoff |
| AI 功能裸奔无标准 | 六支柱轻量门禁 + 金样本回归 + ai-standards.md | ai（深度引用 agent-dev-standards） |

## 新项目怎么启用

新会话说「按 fullstack 工作流来」或首次干活时触发 fullstack-bootstrap：
10 分钟搭出 docs 真相源骨架，之后各阶段技能按需自动接管。

## 与项目内 Skill 的分工

本包是**跨项目方法论**；know-u-time 仓库内的 traceable-engineering / design-director /
premium-mobile-ui 等是**本项目具体实现**。新项目优先装本包，再按需派生项目级细化。
