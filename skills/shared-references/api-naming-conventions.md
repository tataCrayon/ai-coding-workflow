# 接口命名规范（通用版）

> 通用 API 命名规范，供 `api-doc-generator` Skill 引用。项目有特有规范时以项目 `.notes/` 为准。

## URL 命名规则
- 资源名用**名词复数** + 小写 + 连字符（kebab-case）：`/api/v1/order-items`
- 层级表达资源关系：`/api/v1/orders/{orderId}/items`
- 避免动词入 URL（动作由 HTTP 方法表达）；确需动作用子资源：`/orders/{id}/cancel`
- 查询/过滤用 query 参数：`/orders?status=paid&page=1`

## HTTP 方法选择指南

| 方法 | 语义 | 幂等 |
|------|------|------|
| GET | 查询，无副作用 | 是 |
| POST | 创建资源 / 非幂等动作 | 否 |
| PUT | 全量更新 / 幂等替换 | 是 |
| PATCH | 部分更新 | 否（视实现） |
| DELETE | 删除 | 是 |

## 版本管理策略
- URL 路径版本：`/api/v1/`、`/api/v2/`（推荐，直观）
- 破坏性变更升版本号，非破坏性变更（加字段）不升版本
- 旧版本保留兼容期，明确废弃时间表

## 命名一致性
- 请求/响应字段用统一风格（camelCase 或 snake_case，全项目一致）
- 分页参数统一（如 `page`/`size` 或 `start`/`count`），全项目一致
- 布尔字段用 `is`/`has` 前缀
