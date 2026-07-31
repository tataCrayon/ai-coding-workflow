---
alwaysApply: false
description: 编码美学与领域约束 - 编写或修改代码时加载，包含命名正反例、领域约束、编码自查参考、冲突裁决规则
---

# 编码美学与领域约束

> AGENTS.md 核心原则 2「代码即文档」的完整展开。仅包含 AI 无法从训练数据中自行推断的项目特有约束。
>
> **与 AGENTS.md 编码铁律的关系**：AGENTS.md 编码铁律段包含**通用硬规则**（违反会导致严重后果的条目，如 catch 必须有日志、SQL 禁止拼接注入等），本文件包含**编码美学和领域软约束**（违反会导致代码质量下降但不一定出错的条目）。两者互补，不重复。

---

## 命名正反例

| 维度 | ❌ 避免 | ✅ 期望 |
|------|--------|--------|
| 方法名 | `process()`, `handle()`, `doSomething()` | `calculateShippingCost()`, `validateUserEligibility()` |
| 变量名 | `list`, `map`, `result`, `data` | `activeSubscriptions`, `ordersByCustomerId` |
| 布尔变量 | `flag`, `check`, `status` | `isExpired`, `hasActivePermission`, `requiresManualReview` |
| 常量 | `NUM_3`, `TIMEOUT` | `MAX_RETRY_ATTEMPTS`, `CONNECTION_TIMEOUT_MS` |

> 命名检查的完整违规检测清单详见 `code-review-checklist` Skill 维度1。

## 方法设计补充

- 参数 >3 个建议封装为 Parameter Object（>5 个为铁律硬约束，详见 AGENTS.md 编码铁律），返回 `Optional<T>` 而非 null（适用于支持 Optional 的语言）
- 方法体 ≤20 行，嵌套 ≤2 层
- {领域特定约束示例：金额用 BigDecimal + 显式精度和 RoundingMode，严禁 double/float}

## 文档注释作者约定

新增类的作者标签建议使用版本控制配置的用户名，不使用花名、工号或其他别名，保证可追溯。

## AI 易遗忘的编码约束

### 组合对象赋值
对复杂组合对象（含嵌套属性）赋值时，必须先阅读该对象的**完整结构定义**，杜绝只赋顶层字段导致下层关键数据丢失。

### 日志规范摘要
- 使用 `{}` 占位符（铁律硬约束：禁止字符串拼接，见 AGENTS.md 编码铁律）
- 每条日志包含业务标识（如订单号、用户 ID），外部调用记录耗时
- 完整规范 → `.notes/patterns/playbooks/编码规范-日志.md`（如已沉淀）

### 可测试性设计摘要
- 依赖注入优先、纯函数分离 IO
- 禁止 private 方法藏核心逻辑、禁止构造器重逻辑
- 完整规范 → `.notes/patterns/playbooks/编码规范-可测试性设计.md`（如已沉淀）

## 编码时自查

编码期快速自查参考 `code-review-checklist` Skill 的七维框架精简版（5 问核心子集）。正式 CR 仍需完整执行七维审查。

## 领域约束

> 以下为通用约束示例。请根据项目实际情况补充领域特有约束。

- 枚举/状态值变更必须追溯所有使用场景（switch-case、if-else、DB 查询条件）
- 状态机变更必须追溯所有消费方（消息监听、定时任务、查询接口）
- 跨模块调用必须通过接口（RPC/API），严禁直接依赖实现类
- 新增配置项必须有默认值，确保存量功能不受影响

<!-- 在此添加项目特定的领域约束，例如：
- 金额使用 BigDecimal + 显式指定精度和 RoundingMode，严禁 double/float
- 涉及资金流向的逻辑变更，必须确认正向和逆向（退款/冲销）是否同步处理
- 跨产品差异通过扩展点隔离，严禁在核心流程中硬编码产品特殊逻辑
-->

## 冲突裁决规则

> 当多个原则冲突时，按以下规则裁决：

1. **清晰度 vs 最小改动** → 优先清晰度。但影响文件 >5 个时需与用户确认重构范围
2. **最小改动 vs 可测试性** → ≤3 文件优先可测试性；否则优先最小改动并标注测试债务
3. **扩展性 vs 解耦** → 优先解耦——先确保模块边界清晰，再在模块内部设计扩展点

## 场景专属准则

### 分析与排查
- 排查五步法（排查前必须确认）：① 环境（开发/测试/预发/生产）→ ② 时间窗口（首次/最近出现）→ ③ 完整异常堆栈 → ④ 关联上下游日志 → ⑤ 最近变更（代码/配置/环境）

### SQL 编写
- 编写 SQL（含 ORM 映射文件中的 SQL）前，必须先定位对应的实体类/映射文件，确认实际字段名后再编写
- 严禁凭直觉猜测表字段名；严禁 SQL 拼接注入

<!-- 在此添加项目特定的场景准则，例如配置文件/状态机/工作流定义文件的编辑约束 -->

---

## Java / Spring Boot 工程硬约束（可选模板）

> 本章节为服务端 Java/Spring Boot 项目的通用工程约束模板。非 Java 项目可删除本章节；Java 项目应按实际框架补充项目专属约定（框架名、模块名、工具类名等）。

### 分层与依赖
- **单向依赖**：Controller → Service → Repository/Mapper，禁止 Service 循环依赖；互调时提取第三 Service 或用 Event/MQ 解耦
- **Controller 薄**：只做参数校验、上下文处理、调用 Service、返回 DTO；不写业务逻辑
- **对象隔离**：DO 仅限数据库映射；DTO 用于 Service 间及 RPC；VO 仅用于前端返回，禁止透传密码/盐值等敏感字段
- **能力解耦**：核心逻辑（支付/上传/短信等）定义 Interface 并用策略/工厂模式，禁止硬编码具体厂商

### 并发与线程模型
- **ThreadLocal**：仅用于单次请求线程模型；必须成对 set/clear（在过滤器或 AOP 的 finally 中统一清理）；异步线程需通过 TaskDecorator 复制上下文
- **线程池**：禁止 `new Thread()` 或 `Executors.newCachedThreadPool()`；统一用受管线程池（配置核心线程数/队列大小/拒绝策略/命名前缀）；禁止 `CompletableFuture.runAsync()` 不指定 Executor
- **锁**：`synchronized` 禁止跨进程使用；关键操作（充值回调/退款/幂等）用分布式锁，锁 Key 带业务 ID，`tryLock` 必须有超时，`finally` 中释放前判断持有者
- **读-改-写竞态**：不在无锁下 get→改→set，应在分布式锁内修改或用原子操作/版本号/悲观锁

### 资源管理
- 数据库连接（非框架管理）、文件句柄、网络连接等能用 try-with-resources 的必须使用；禁止手动 close() 无 finally
- 长生命周期 Executor 需有 shutdown 钩子；大文件流须明确大小上限并分批 flush

### 边界条件与健壮性
- 对外部输入必须做空值检查与默认值兜底；Controller 入参加 `@Validated`/`@Valid`
- 集合查询严禁返回 null，应返回 `Collections.emptyList()`
- **金额/计数绝不信任请求值**：由服务端重新计算并与前端值比对，不一致以服务端为准
- 查询接口必须约束分页参数并对 size 设上限；`while(true)` 循环必须有退出条件与次数上限

### 状态变更与幂等
- 扣款/审核等状态变更须配合 SQL 乐观锁（`SET status='PAID' WHERE id=? AND status='UNPAID'`）
- 所有 POST/PUT 接口须通过 Token/BusinessKey/`@Idempotent` 防重复提交
- `@Transactional` 内禁止长耗时 RPC、大文件 IO（短事务原则）

### 错误处理与日志
- 区分业务异常（可预期、明确错误码）与系统异常（需监控告警）；禁止透传 SQL 原始异常给前端
- 禁止吞异常（空 catch / 只 printStackTrace）；catch 后必须记录关键业务主键和上下文
- 日志禁止输出敏感明文（密码/密钥/token 只打掩码）

### 通用反例速查
- 吞异常返回 null，调用方未做 null 校验
- 拼接外部输入构造 SQL/JSON（应参数化查询）
- for 循环内单独 RPC/SQL/加锁（应批量查询或粗粒度加锁）
- `@Transactional` 方法内含长耗时 RPC 或大文件 IO（连接池枯竭）
- 硬编码数字/字符串（应定义 Constant/Enum）
