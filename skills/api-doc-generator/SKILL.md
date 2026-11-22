---
name: api-doc-generator
version: 1.0.0
description: "从代码生成接口文档，含字段核对与设计建议。触发：接口文档、API文档、OpenAPI、Swagger、YApi、生成接口文档、接口设计、API设计。"
---

# API Doc Generator（接口文档生成器）

> **核心定位**：从代码生成 OpenAPI/Swagger JSON 文档，兼容 YApi 导入格式。
> 不仅"把代码转成文档"，更要确保**接口语义清晰、示例完整、错误码覆盖**。
> 金融领域接口有严格的鉴权、幂等和脱敏要求，文档必须准确反映这些约束。

---

## 🔒 接口文档五项硬规则（2026-07-21 新增，07-24 扩展）

> 以下五条为不可协商约束，详情见 `references/openapi-schema-conventions.md` §"接口文档硬规则"。

1. **防乱码（文件+传输双层）**：① OpenAPI JSON 必须 UTF-8 编码，中文禁止 Unicode 转义（如 `中文`），导出前 `file` 命令确认编码；② Windows Git Bash 下 **严禁 `curl -d '直接中文JSON'`**——必须写临时 UTF-8 文件再用 `-d @文件` 传参，否则 YApi 存入不可逆乱码（详见 `openapi-schema-conventions.md` §YApi curl 传输防乱码铁律）
2. **示例值+备注必填**：每个 schema 字段必须有 `example`（非空有业务语义）+ `description`（中文备注，禁纯类型复述）
3. **YApi 同步确认门禁**：调用 `yapi` skill 的 `import` 前必须向用户展示接口清单并等明确确认，未确认禁止执行（见 `yapi` SKILL「Step 3.5 同步确认门禁」）。本 skill 只产出 OpenAPI JSON，落库交给 `yapi`。
4. **接口全路径**：`paths` 写网关全路径而非仅 Controller 路径；网关前缀从实际配置读取，禁止推断；`description` 同时注明网关路径和 Controller 路径
5. **更新防重复（先查再改）**：更新 YApi 目录下接口时，必须先 `list_cat` 查存量接口 ID，按 (path, method) 匹配后用 `import_data merge=good` 覆盖更新，或 `interface/up` 传 `{id}` 更新，严禁直接新增同名接口（详见 `openapi-schema-conventions.md` §YApi 接口更新防重复铁律）

---

## 一、两种运行模式

| 模式 | 代号 | 适用场景 | 输出 |
|------|------|---------|------|
| Standards-only | S | 仅需要接口规范模板和规则，尚无代码 | 接口规范模板 + 命名/格式规则 |
| Code-to-doc | C | 已有 Controller/Handler 代码，需要从代码生成文档 | OpenAPI JSON + 接口说明 |

> 模式选择：用户明确说"生成接口文档"且项目已有接口代码 → C 模式；用户说"接口设计规范"或"接口文档模板" → S 模式；不确定时主动询问。

---

## 二、执行流程

```
用户请求到达
    ↓
Step 0: 模式判定 —— S 模式或 C 模式
    ↓
Step 1: 上下文收集
    ↓ S 模式: 读取 PRD 需求、项目接口规范（如有）
    ↓ C 模式: 扫描 Controller/Handler 代码、DTO/VO/Entity 类、鉴权配置
    ↓
Step 2: 执行文档生成
    ↓ S 模式: 输出接口规范模板 + 规则文档
    ↓ C 模式: 从代码提取接口元数据 → 生成 OpenAPI JSON
    ↓
Step 3: 金融领域合规增强 —— 注入鉴权头、幂等标记、脱敏规则
    ↓
Step 4: 输出 → 07-api-docs/openapi.json
```

---

## 三、S 模式：Standards-only

### 输出内容

1. **接口规范模板**：
   - RESTful 风格约定（URL 命名、HTTP 方法选择、版本管理）
   - 请求/响应体格式约定
   - 错误码体系约定
   - 鉴权头约定（与项目实际鉴权方案对齐）

2. **命名与格式规则**：
   - URL 路径命名：`/api/v1/{domain}/{resource}`，snake_case
   - 字段命名：请求体用 camelCase（前端友好），响应体用 camelCase + 脱敏标记
   - 错误码格式：`{domain}-{error_type}-{sequence}`（如 `order-biz-001`）

### 参考来源

- 读取项目 `.notes/` 中已有的接口规范资产
- 读取项目鉴权配置（Session/SM3 签名方案）
- 若无项目级规范，基于金融行业最佳实践生成模板

---

## 四、C 模式：Code-to-doc

### 4.1 代码扫描策略

按以下优先级扫描接口代码：

| 优先级 | 扫描目标 | 说明 |
|:------:|---------|------|
| 1 | `@Controller` / `@RestController` 注解类 | Spring 项目主入口 |
| 2 | `@RequestMapping` / `@GetMapping` 等方法注解 | 提取路径、方法、参数 |
| 3 | DTO / VO / Request / Response 类 | 提取请求体和响应体字段 |
| 4 | `@ApiOperation` / Swagger 注解（如有） | 复用已有文档注解 |
| 5 | 鉴权拦截器 / Filter 配置 | 提取鉴权要求 |
| 6 | 网关路由配置（gateway application.yml / Nacos 路由 / sessionOptionalPaths） | 🔒 提取网关前缀，组装全路径 |

> 🔒 **网关路径提取规则**（硬规则第 4 条）：完整对外路径 = 网关路由前缀 + Controller 类级前缀 + 方法级路径。网关前缀必须从配置文件读取（如 Spring Cloud Gateway 的 `spring.cloud.gateway.routes`、Nacos 路由规则、`sessionOptionalPaths` 中的 path pattern），**禁止凭记忆推断**。项目不走网关的内部接口，path 写 Controller 原路径并标注"内部调用"。

### 4.2 元数据提取清单

对每个接口提取以下元数据：

| 元数据 | 来源 | 金融领域特别注意 |
|--------|------|----------------|
| HTTP Method & Path | 注解 | 硅等写操作必须 PUT/POST |
| 请求参数 | 方法参数 + DTO 类 | 鉴权头参数必须标注 |
| 请求体字段 | DTO 类字段 | 金额字段标注 DECIMAL |
| 响应体字段 | VO 类字段 | 脱敏字段标注 PII |
| 错误码 | 异常类 / 常量类 | 金融错误码必须覆盖业务异常 |
| 鉴权要求 | 拦截器配置 / 注解 | 标注需要的鉴权头和签名方式 |
| 幂等要求 | 注解 / 业务逻辑 | 金融接口必须标注幂等策略 |

### 4.3 OpenAPI JSON 生成

将提取的元数据组装为 OpenAPI 3.0 规范 JSON：

- `info`：项目名称、版本、描述
- `servers`：根据项目配置生成（网关入口地址，如 `https://finhub.example.com/finhub-gateway`）
- `paths`：每个接口一个 path item（🔒 网关全路径，而非仅 Controller 路径）
- `components/schemas`：DTO/VO 类转为 schema 定义（🔒 每个字段必须有 `example` + 中文 `description`）
- `securitySchemes`：根据鉴权配置生成
- `tags`：按业务域分组

> 🔒 **编码硬规则**：JSON 文件必须 UTF-8 编码输出，中文 `description` / `example` 写原样字符，禁止 Unicode 转义。生成后用 `file openapi.json` 确认编码为 UTF-8。

> 🔒 **示例值硬规则**：每个 schema 字段的 `example` 必须非空且有业务语义（如 `"FUIDL"` 而非 `"example"`），`description` 必须是中文备注而非纯类型复述（如 `"产品代号，对应token_symbol"` 而非 `"String类型"`）。

### 4.4 YApi 导入兼容

生成的 JSON 需兼容 YApi 导入格式要求：

- `tags` 必须存在且不为空（YApi 用 tag 做分类）
- 每个 path 必须有 `operationId`（YApi 用做接口唯一标识）
- Schema 定义放在 `components/schemas` 中（YApi 支持 OpenAPI 3.0 引用）
- 响应体必须定义 `200` 状态码的 content

#### 4.4.1 tag 粒度约定（🔒 目录归类硬规则）

**YApi import_data 机制**：一个 tag 对应一个 YApi 分类目录（源码级确认，取接口 tags 数组第一个非版本号 tag 作为 catname）；`import_data` **不支持 catid 参数**，目录完全由 OpenAPI 的 tags 决定。

**约定：同一需求（一个 REQ）的所有接口共用一个 tag，tag 名 = 需求名/模块名，用每个接口的 `summary` 区分职责。**

- ✅ 正确：3 个接口都用 `tags: ["RWA产品首页"]`，summary 分别为"资产概览"/"推荐"/"搜索" → YApi 归入**一个**目录
- ❌ 错误：按接口功能拆成 `["RWA首页-资产概览"]`/`["RWA首页-推荐产品"]`/`["RWA首页-搜索"]` → YApi 建**三个**散目录

**要点**：
- 一个需求/模块 = 一个 tag = 一个 YApi 目录；接口间的区分交给 `summary`，不要用 tag 细分
- 全局 `tags` 数组只定义这一个 tag（name + description）
- 接口若跨两个模块（少见），YApi 只取第一个 tag 作为目录归属
- 已散成多目录的修复：统一 tag 后重新 `import_data merge=good`（接口会归到新目录），但**旧空目录不会自动删除**，需在 YApi Web 界面手动删（`del_cat`/`interface/up` 需登录态 Cookie，token 不够）

---

## 五、金融领域合规增强

在文档生成后，对金融接口做以下增强检查：

| 检查项 | 说明 | 不合规处理 |
|--------|------|-----------|
| 鉴权头标注 | 写操作接口必须标注需要的鉴权头 | 缺失时标注 ⚠️ 并提醒补充 |
| 幂等标记 | 资金类写操作必须标注幂等策略 | 缺失时标注 ⚠️ 并提醒补充 |
| PII 脱敏 | 响应体中涉及个人信息的字段必须标注脱敏规则 | 缺失时标注 ⚠️ 并建议脱敏方案 |
| 金额精度 | 请求/响应中的金额字段必须标注精度 | 缺失时标注 ⚠️ 并建议精度 |
| 错误码覆盖 | 每个接口必须覆盖至少：成功、参数错误、业务异常、鉴权失败 | 缺失时标注 ⚠️ 并补充模板 |

---

## 六、输出

**输出路径**：`07-api-docs/openapi.json`

**辅助输出**（如用户要求）：
- `07-api-docs/api-spec-rules.md` — S 模式的规范文档
- `07-api-docs/compliance-check.md` — 金融合规检查报告

---

## 七、References（详细规范参考）

| 文件 | 内容 |
|------|------|
| `references/api-naming-conventions.md` | 接口命名规范完整版：URL 命名规则、HTTP 方法选择指南、版本管理策略 |
| `references/openapi-schema-conventions.md` | OpenAPI Schema 约定：请求体/响应体格式规范、错误码体系定义、YApi 兼容性要求 |
| `references/api-security-conventions.md` | 接口安全约定：鉴权头格式规范、SM3 签名参数说明、幂等策略标记规范、PII 脱敏规则 |

> 以上参考文件为共享资源，已 hardlink 进本 skill `references/`（真源 shared-references）。如项目有特有的接口规范沉淀在 `.notes/` 中，优先使用项目规范。

---

## 八、Collaboration（协作说明）

**上游输入**：
- **database-design-guard**: 数据模型定义 → 作为 API 请求/响应体的字段来源和类型依据
- **architecture-guard**: 模块归属判定 → 确定接口应归属哪个业务域的 tag 分组
- **code-business-analyzer**: 业务规则分析 → 作为接口描述和错误码的业务语义来源

**下游输出**：
- **change-documenter**: 接口变更 → 作为变更留痕中的 API 变更部分
- **backendflow-verify**（unit-test-detail）: 接口契约 → 作为 API 层测试的断言依据

**触发条件**：
- 需求涉及新增/修改接口时，建议先完成代码编写再执行 C 模式生成文档
- 需求阶段需要确定接口规范时，执行 S 模式输出规范模板
- 定期执行 C 模式刷新文档，保持代码与文档同步
