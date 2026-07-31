---
alwaysApply: false
description: Git commit 规范 - 提交代码时加载，强制 AI: 前缀和 type(scope):subject 格式
---

# Git Commit 规范

## 格式

```
AI: <type>(<scope>): <subject>

可选正文
```

- **前缀 `AI: `**：所有 commit message 必须以 `AI: ` 开头，标识由 AI 辅助完成的提交
- **type**：必填，见下表
- **scope**：可选，模块/功能域名称
- **subject**：必填，简洁的祈使句描述，不加句号（英文首字母小写，中文无此限制）

## Type 取值

| type | 说明 |
|------|------|
| feat | 新功能 |
| fix | 缺陷修复 |
| refactor | 重构，既非新功能也非修 bug |
| docs | 文档变更 |
| test | 测试相关 |
| chore | 构建、脚本、依赖等杂务 |
| perf | 性能优化 |

## Scope

- scope 为可选字段，表示改动涉及的模块或功能名称
- 示例：auth、order、payment、config、api 等

## Subject

- 必填，一句话说明本次提交的核心改动
- 使用祈使句（如"增加"而非"增加了"）
- 不加句号
- 英文首字母小写，中文无大小写限制

## 示例

```
AI: feat(auth): 增加登录接口与校验逻辑
AI: fix(order): 修正分页参数为 0 时的边界处理
AI: docs: 补充开发 SOP 使用说明
AI: refactor(utils): 抽取日期格式化公共方法
AI: test(product): 补充产品列表接口单元测试
AI: perf(search): 优化搜索接口响应时间
AI: chore(deps): 升级 Spring Boot 到 3.2
```
