# 坑账本：格式与首批沉淀

> 每条坑必须「现象 → 根因 → 对策」三段齐全，可搜索、可对照、可执行。
> 新会话踩到老坑 = 账本失职；对策必须是确定性动作，不是「注意一下」。

## 条目格式

```markdown
### 坑 N：<一句话命名>
- **现象**：什么命令/页面/场景下出现什么错误表现。
- **根因**：确定性的原因（读到过源码/文档/实验证实），写不出根因的先标「未定位」。
- **对策**：可直接执行的命令或代码模式。含糊的对策不许入账。
```

维护规则：
- 收工时把本次会话新踩的坑追加进账本（fullstack-handoff 触发）。
- 每条坑第一次踩记录，第二次踩还没对策 = P0 事故，停下来专门修对策。
- 定期（每个里程碑）重读全账本，把已过时的条目标注「已失效 + 原因」，不删除。

## 首批沉淀（know-u-time 实战，按平台归类；新项目按同格式续写）

### 通用 AI 协作

1. **方案丢失**：会话里聊定的方案，下个会话 AI 不认账 → 根因：方案只存在于对话上下文
   → 对策：L 级变更一律落 docs/plans/ 文件并请用户显式签收，会话开头读 STATUS。
2. **AI 自我合理化**：测试写不出来时 AI 会说「这个不好测所以跳过」→ 对策：预写
   反驳清单（「流难测→用 repository 同步造数据」「时钟难测→注入 fixed clock」），
   测试前已写的生产代码一律删掉重来（superpowers TDD 规则）。
3. **批量改多处调用的脚本化修改出回归**（python 批量 replace 改 10 处漏 2 处）→
   对策：>5 处的同构修改用 AST 工具或逐处 Edit；改完必须定向 probe + 全量回归。

### Windows / MSYS 环境

4. **残留 dart.exe 锁文件**：删 .dart_tool 报「文件被占用」→ 根因：进程未退净，
   Windows 文件锁不释放 → 对策：`taskkill //F //IM dart.exe`（MSYS 双斜杠）。
5. **/tmp 不通**：`adb ... > /tmp/x.xml` 后 Windows Python 读不到 → 根因：MSYS 的 /tmp
   不是 Windows 路径 → 对策：临时产物放项目内 `.tmp/`，用完删。
6. **MSYS 路径转换**：`adb pull /sdcard/x` 报找不到路径 → 对策：前缀
   `MSYS_NO_PATHCONV=1`。
7. **插件配置热改无效**：改 config.json 后行为不变 → 对策：重启 CLI 再验证，
   这是配置类插件的通用规律。

### 测试（Flutter/Dart 特化，跨项目时替换为对应框架条目）

8. **widget 测试 await stream.first 永不返回**：单测挂满 10 分钟 → 根因：fake-async
   zone 里真实异步调度永不投递 → 对策：绝不 await 流，断言 UI 或 repository 同步造数。
9. **enterText 后按钮仍禁用**：根因：enterText 不推进帧，onChanged 的 setState 未跑
   → 对策：enterText → pumpAndSettle → tap 三连，中间步省不得。
10. **测试必须从 package 目录跑**：从 workspace 根跑触发不到 native assets hook，
    sqlite3_initialize 崩 + 内存飙 10G → 对策：cd 包目录内跑，必要时 `-j 1`。
11. **测试种子锚定「真实今天」**：用相对日期造种子，跨天运行全漂移 → 对策：固定时钟
    注入 + 种子用 `clock()` 生成。

### 实机验证（adb/模拟器）

12. **CJK 无法经 adb 输入**：中文丢字/变字面量 → 对策：验证链路用英文占位文本，
    中文文案靠 a11y 树断言。
13. **uiautomator marker 必须页面唯一**：dump 含离屏缓存 widget，宽泛词误命中 →
    对策：用页面专用词做 marker；dump 的 text 换行是 `&#10;` 实体。
14. **采集前收键盘**：IME 工具条入镜 → 对策：`FocusManager.instance.primaryFocus?.unfocus()`。
15. **tap 坐标以 dump bounds 为准**：看截图目测坐标常落空（分辨率/悬浮键盘干扰）。
16. **a11y 优先于像素采样**：能读元素树就不猜坐标（android-emulator 插件/Inspector），
    验证提速一个量级。
17. **screencap 直拉本地路径失败** → 对策：先落设备 /sdcard/ 再 pull。

### 需求与设计

18. **AI 默认 Material/emoji 脸**：不约束就会做出「塑料感」→ 对策：design.md 定
    Token（色板/字阶/间距/圆角/图标成套），评审清单见 fullstack-design。
19. **标题/文案被 AI「好心改写」**：录入原文被纠正 → 对策：提示词写明「保留原话全称，
    打错字也不改写」+ 金样本回归防漂移（know-u-time 提示词 v1.2 教训）。
