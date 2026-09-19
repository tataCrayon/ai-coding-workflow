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

### 🔒 YApi curl 传输防乱码铁律

> Windows Git Bash 下 curl `-d` 直接传含中文的 JSON body 会因编码转换（本地 GBK → 服务端 UTF-8 不匹配）导致 YApi 存入不可逆乱码。此坑已实证 3 次。

**铁律：严禁 `curl -d '直接中文JSON'` 传含中文的请求体**

正确做法：
```bash
# 1. 写入临时 UTF-8 JSON 文件
cat > /tmp/api_update.json << 'JSONEOF'
{"id":<接口ID>, "title":"<接口标题>", ...}
JSONEOF

# 2. 用 @文件 传参（curl 自动按文件编码发送）
curl -s -X POST 'http://<平台地址>/api/interface/up' \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d @/tmp/api_update.json
```

适用于所有 YApi API：
- `/api/interface/up`（单接口更新）→ `-d @文件`
- `/api/open/import_data`（批量导入）→ `--data-urlencode "json@openapi.json"`
- `/api/interface/get`（查询）→ 无风险（只读）

### 🔒 YApi 接口更新防重复铁律

> 更新指定分类目录下的接口时，必须先查存量再按 ID 更新，严禁直接新增同名接口。
> 更新既有接口推荐 `import_data merge=good`（保留原 ID 和 catid），而非逐个 `interface/up`。

**铁律：更新接口必须传 `id` 参数，禁止无 ID 新增同名接口**

正确做法（更新流程三步法）：
1. **查存量**：`GET /api/interface/list_cat?catid={catid}&token={token}&limit=100` → 获取目录下所有接口的 {_id, path, method, title}
2. **匹配 ID**：按 (path, method) 在存量列表中查找对应接口的 `_id`
3. **按 ID 更新**：`POST /api/interface/up` 传 `{id: 存量_id, ...}` → 更新而非新增

判断逻辑：
- 存量中有 (path, method) 匹配 → **传 id 更新**（默认场景），或 `import_data merge=good` 批量覆盖更新（merge=good 保留原 catid 和 ID，无需事后修正）
- 存量中无匹配（全新接口）→ **不传 id，走新增**
- 一个目录下更新多个接口 → **推荐 `import_data merge=good`**（比逐个 interface/up 更高效，且自动写 `res_body_is_json_schema=true`）

### tag 粒度约定（目录归类硬规则）

**YApi import_data 机制**：一个 tag 对应一个 YApi 分类目录（取接口 tags 数组第一个非版本号 tag 作为 catname）；`import_data` **不支持 catid 参数**，目录完全由 OpenAPI 的 tags 决定。

**约定：同一需求（一个模块）的所有接口共用一个 tag，tag 名 = 需求名/模块名，用每个接口的 `summary` 区分职责。**

- ✅ 正确：3 个接口都用 `tags: ["产品首页"]`，summary 分别为"资产概览"/"推荐"/"搜索" → 归入**一个**目录
- ❌ 错误：按接口功能拆成 `["首页-资产概览"]`/`["首页-推荐"]`/`["首页-搜索"]` → 建**三个**散目录
- 接口跨两个模块（少见）时，YApi 只取第一个 tag 作为目录归属
- 已散成多目录的修复：统一 tag 后重新 `import_data merge=good`（接口会归到新目录），但**旧空目录不会自动删除**，需在平台 Web 界面手动删


## 幂等与约定标记
- 幂等接口在 description 标注幂等键（如 `X-Idempotency-Key`）
- 需鉴权接口标注 `security`
- 分页/排序/过滤参数统一风格
