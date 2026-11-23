# ADR-0003：共享文档的新鲜度门禁

> 状态：已采纳 ｜ 日期：2026-11-19

## 背景

home repo 最大的风险不是「没写文档」，而是**文档过期但看着像权威**。
agent 读本仓文档时默认它是全局事实源，过期的表结构、失效的命令会被直接执行。

前车之鉴：某项目本地的 PRD 库落后上游七十多个 revision 还在被检索，最终只能整个废弃。

## 决策：三重门禁

### 1. 文件头 `verified:` 锚点（强制）

每份 `docs/**/*.md` 首部必须有：

```markdown
> verified: 2026-11-19 ｜ 验证方式: 直连 MySQL / 读源码 / 实跑命令
```

- `verified` 是**上次核对事实**的日期，不是创建日期
- 改内容必须同时更新 `verified`
- 只改措辞不重新核对时，写 `verified: 2026-11-19 (wording only)`——按半阈值放宽

### 2. 分级过期阈值

| 文档类型 | 阈值 | 过期后的处理 |
|---|---|---|
| `runbooks/`（含 SQL、命令） | **30 天** | 标 `STALE`，执行前必须重新验证 |
| `domains/`（业务事实） | **90 天** | 标 `STALE`，读时提示可能已变 |
| `architecture/`（决策） | 不设阈值 | 决策不会过期，只会被新 ADR 取代 |
| `repos/`（仓指针） | 每次进仓校验路径是否存在 | 路径失效立即修 |

### 3. `docs/INDEX.md` 是唯一检索入口

- 只登记 `docs/` 下文档，一主题一行：关键词 → 路径 → verified 日期 → 状态
- 状态值：`OK` / `STALE` / `DEPRECATED`
- agent 检索先读 INDEX，命中 `STALE` 时必须看文件头决定是否重新核对

## 落地检查（可执行）

```bash
# 列出所有超过阈值未核对的文档（runbooks 30 天 / domains 90 天）
python scripts/check-freshness.py
python scripts/check-freshness.py --all   # 打印全部文档的 verified 状态
```

退出码：`0` = 全部健康，`1` = 有过期或缺失锚点。

## 为什么不用自动更新

「自动更新日期」会让门禁彻底失效——日期变成虚假的信任信号。
`verified` 只能由**真正核对过事实的人/agent** 手写更新。
