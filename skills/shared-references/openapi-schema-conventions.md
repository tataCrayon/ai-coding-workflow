# OpenAPI Schema 约定（通用版）

> 通用 OpenAPI 文档约定，供 `api-doc-generator` Skill 引用。项目有特有规范时以项目 `.notes/` 为准。

## 请求体/响应体格式规范
- 每个接口必须定义 request/response schema，字段有 `description` 和 `example`
- 必填字段列入 `required`
- 统一返回包装（如 `{ code, message, data }`）在 schema 中显式定义
- 分页响应统一结构（如 `{ total, list, page, size }`）

## 错误码体系定义
- 错误码分层：`{业务域}{模块}{序号}`（如 `ORD1001`）
- 每个错误码有：码值、HTTP 状态码、消息模板、触发场景
- 通用错误（400/401/403/404/500）统一定义，业务错误单独定义
- 错误响应 schema 与成功响应结构一致（便于客户端统一处理）

## OpenAPI 版本与工具
- 优先 OpenAPI 3.0；导入 YApi 等工具时确认兼容性
- 从代码生成时（SpringDoc/Swagger 等）确保注解完整：接口分组、摘要、参数说明、响应示例
- 生成的 `openapi.json` 可直接导入接口管理平台

## YApi 兼容性要求
- 导出 OpenAPI 2.0/3.0 JSON
- 确保 `paths`、`definitions`/`components.schemas`、`tags` 完整
- 中文 description 需 UTF-8 编码正确
- 枚举字段列出所有取值 + 含义

## 幂等与约定标记
- 幂等接口在 description 标注幂等键（如 `X-Idempotency-Key`）
- 需鉴权接口标注 `security`
- 分页/排序/过滤参数统一风格
