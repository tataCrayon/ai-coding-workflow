# 仓指针表模板（`repos/INDEX.md`）

> verified: 2026-11-23 ｜ 验证方式: 模板占位

> 复制为 `<home-repo>/repos/INDEX.md` 后按实际填写。
> 规则见 [ADR-0004](../docs/architecture/decisions/ADR-0004-session-start-and-pointers.md)。

## 用法

- 路径存在就直接用；不存在就 clone 到该路径（agent 默认动作，无需额外指令）
- 一仓一行，必须含三要素：**定位 + 磁盘路径 + clone 源**
- 进仓前若有 `repos/<repo>.md`，先读它

## 按产品线分组

### <产品线 A>

| 仓 | 定位 | 栈 | 路径 | clone |
|---|---|---|---|---|
| `<repo-1>` | <一句话：它是什么、边界在哪> | <JDK8 / Spring Boot 2.6> | `~/work/<line>/<repo-1>` | `ssh://git@git.example.com/<line>/<repo-1>.git` |
| `<repo-2>` | <一句话> | <Java 21 / SB 3.5> | `~/work/<line>/<repo-2>` | `ssh://git@git.example.com/<line>/<repo-2>.git` |

### <产品线 B>

| 仓 | 定位 | 栈 | 路径 | clone |
|---|---|---|---|---|
| `<repo-3>` | <一句话> | <Go / Fiber> | `~/work/<line-b>/<repo-3>` | `ssh://git@git.example.com/<line-b>/<repo-3>.git` |

## 工具与资产仓

| 仓 | 定位 | 路径 | clone |
|---|---|---|---|
| `vibe-coding-workflow` | 工作流种子包（本包上游） | `~/work/vibe-coding-workflow` | `https://github.com/<user>/vibe-coding-workflow.git` |

## 非 git 的工作区目录（不 clone，本地自有）

`~/work/<line-a>`、`~/work/<line-b>`

这些是**容器目录**，本身不是 git 仓，只用来放子仓。

## 维护

- 增删仓：**同一提交**内更新本表
- 本地目录名与 clone 源不一致时，以本地目录为准并在备注里说明（不要因为拼写不一致就重建目录）
