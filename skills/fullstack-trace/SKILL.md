---
name: fullstack-trace
description: 【通用/前端/Flutter】fullstack 包的可追溯性技能：维护需求→文档→测试→源码的映射地图（test-map/code-map）。解决「每次改动需求都要重新分析、读取代码」。写测试、改动映射涉及文件、找代码定位时使用。
when_to_use: 新增/修改测试时；新增功能模块时；需要从需求定位代码或从代码反查需求时。
---

# FullStack Trace：一张地图回答「这个需求在哪实现」

重复读码考古是 AI Coding 最贵的隐形成本。地图一次建好，每次改动只付增量维护钱。

## 两张地图

**test-map.md（用例 ↔ 测试 ↔ 源码）**：

```markdown
| 用例编号 | 用例名 | 测试文件:group | 源码落点 |
|---------|--------|---------------|---------|
| UC-A3   | 录入兜底解析 | parser/test/parser_test.dart:group('UC-A3') | date_matcher.dart |
| 6.6     | 进度页 | apps/mobile/test/xxx_test.dart:group('进度页（6.6）') | progress_page.dart |
```

**code-map.md（模块 → 职责 → 关键文件）**：

```markdown
## packages/parser
职责：自然语言日期/标题解析（需求 9.3/9.4）
关键文件：date_matcher.dart（五类日期语法）/ festival_table.dart（农历查表）
防漂移护栏：prompts_gen_test / festival 锚点测试
```

## 强制同步点（不做 = 地图开始腐烂）

- 测试名必须对回用例编号：product.md 有编号用编号，没有→需求未定稿，停下先补文档。
- 新增/删除/移动测试或模块时，同 commit 更新对应地图。
- STATUS 的测试基线数变化时，地图行数应能对上（抽查即可，不必逐条）。

## 反向用法（省掉重复考古）

- 接手新需求：先查地图，知道动哪几个文件、牵动哪些测试 → 再读局部代码。
- 改一个函数前：地图反查它被哪些用例盖着 → 改完知道跑哪些回归。
- AI 找不到落点时：先问地图，地图没有才允许全仓搜索（并把新发现补进地图）。

## 可追溯性护栏的其他形态（按项目选配）

- **Prompt as Code**：LLM 提示词外置为版本化 .md（front-matter: name/version/vars）+
  代码生成器 + 金样本回归防漂移；改提示词必须走 md→生成器→回归，禁止手改生成物。
  （know-u-time traceable-engineering Skill 的完整实现，跨语言通用，值得新项目默认带上。）
- **防漂移测试**：凡是「生成的代码/文案/资源」，必有一个测试断言生成物与源一致。
- **决策记录**：重大取舍（选型/结构/命名）在 product.md 决策节留 问题/选项/结论/日期。
