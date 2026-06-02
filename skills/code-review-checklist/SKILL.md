---
name: code-review-checklist
version: 1.1.0
description: "Code Review 自查清单。系统化检查代码质量、可读性、可维护性和安全性，输出 Review 清单。触发词：帮我 CR、Code Review、提交代码。"
---

# Code Review Checklist

> **执行目标**：以代码质量和可维护性为首要目标审视代码。
> 不是在逐条打勾，而是**先感受代码的整体设计是否优雅，再检查细节**。

**铁律**：提交代码前 → 必须执行本 skill → 输出 Review 清单 → 确认无问题 → 再提交。无例外。

---

## 触发时机

用户要求提交以下内容时**必须调用**：
- Git 提交（commit）
- Code Review 申请
- 代码合并请求（PR/MR）

---

## 统一输出清单格式

> 每个维度检查时，按以下格式输出检查结果：

```markdown
□ [检查项名称]:
  - `UserService.findById()`: ✅ [通过理由]
  - `UserService.findById()`: ❌ [问题描述] → [改进建议]
  - `UserService.findById()`: ⚠️ [警告信息] → [可选改进]
□ 需要同步修改：是/否
```

---

## 七维检查框架

> **执行顺序**：先执行维度 0（设计品味），建立整体印象，再逐项检查维度 1-6 的细节。

### 维度 0：设计品味（Design Taste）

> **核心理念**：这是区分"机械检查"和"有品味的 Review"的关键维度。
> 一个有经验的 Reviewer 拿到代码，第一反应不是数行数、查嵌套，而是**感受代码是否"读起来舒服"**。

**铁律**：代码应该让读者觉得"这是一个有品味的工程师写的"。如果读完代码的第一感觉是"能跑但别扭"，说明设计品味有问题。

**检查项**：
1. **抽象层次一致性（SLAP）**：同一方法体内的语句是否处于同一抽象层次？高层编排和低层细节是否混搭？
2. **代码坏味道识别**：
   - Feature Envy：方法是否大量访问另一个对象的字段？
   - Primitive Obsession：是否用基本类型表示业务概念（金额、状态）？
   - Long Parameter List：方法参数是否 >3 个？
   - God Method：方法是否超过 20 行？
   - Magic Number：是否有裸数字 `if (status == 3)`？
   - Data Clump：多个方法是否总是一起传递同一组参数？
3. **SOLID 原则符合度**：
   - 单一职责：类/方法是否只有一个变更理由？
   - 开闭原则：新增功能是否通过扩展而非修改实现？
   - 依赖倒置：是否依赖抽象而非具体实现？

**输出清单**：
```
□ 抽象层次一致性：
  - `OrderService.placeOrder()`: ✅ 方法体是清晰的流程编排，每步同一抽象层次
  - `OrderService.process()`: ❌ 参数校验、字段拷贝、业务逻辑混搭 → 需按抽象层次拆分
□ 代码坏味道：
  - Feature Envy: ✅ 无 / ❌ `ReportService.buildReport()` 大量访问 `Order` 字段
  - Primitive Obsession: ✅ 无 / ❌ 用 String 表示订单状态
  - Magic Number: ✅ 无 / ❌ `if (retryCount > 3)` → 需提取为 `MAX_RETRY_ATTEMPTS`
□ SOLID 原则：
  - 单一职责: ✅ / ❌ `OrderService` 同时负责校验和持久化
  - 开闭原则: ✅ 通过扩展实现 / ❌ 用 if-else 堆砌产品差异
□ 需要同步修改：是/否
```

---

### 维度 1：代码质量（Code Quality）

**铁律**：代码必须符合高质量标准：无 TODO 占位符、无上帝类、无深层嵌套、无重复代码。

**理解目标**：代码的函数/类设计是否合理？命名是否体现业务语义？是否有重复代码或异常处理缺陷？

**常见关注点**（按需检查，非逐条打勾）：
- **函数设计**：职责单一、嵌套 ≤2 层、使用 Guard Clause 提前返回
- **类设计**：无上帝类（>500 行）、方法 ≤20 个
- **命名规范**：变量名有意义、符合语言惯用命名约定，**且体现业务语义**（避免 `process()`/`handle()` 等模糊命名，避免 `list`/`map`/`result`/`data`/`temp` 等无业务含义命名）
- **代码复用**：无重复代码、复用现有 API 和设计模式
- **异常处理**：catch 块有日志 + 堆栈、不吞异常，且必须有对应的处理动作

**输出清单**：
```
□ 函数设计：
  - `UserService.findById()`: ✅ 职责单一、嵌套 1 层
  - `UserService.updateProfile()`: ⚠️ 嵌套 3 层 → 需重构
□ 类设计：
  - `UserService.java`: ✅ 450 行、15 个方法
  - `UserController.java`: ❌ 600 行、25 个方法 → 需拆分
□ 命名规范：
  - `UserService.findById()`: ✅ 变量名有意义
  - `UserService.updateProfile()`: ⚠️ 变量名 `n` → 需改为 `numRecords`
□ 代码复用：
  - `UserService.findById()`: ✅ 复用 `UserRepository.findById()`
  - `UserService.updateProfile()`: ❌ 重复查询逻辑 → 需提取
□ 异常处理：
  - `UserService.findById()`: ✅ catch 块有日志 + 堆栈
  - `UserService.updateProfile()`: ❌ catch 块无日志 → 需添加
□ 需要同步修改：是/否
```

---

### 维度 2：可读性（Readability）

**铁律**：代码必须易于理解，注释准确、逻辑清晰、避免魔法值。

**理解目标**：代码读起来是否流畅？是否有误导性注释、魔法值或未完成的 TODO？

**常见关注点**（按需检查）：
- **注释质量**：注释与代码一致、无误导性说明
- **逻辑清晰**：避免复杂的三元表达式、避免过长的链式调用
- **魔法值**：避免硬编码、使用常量或枚举
- **代码格式**：符合项目代码风格、缩进一致
- **TODO/FIXME**：无 TODO 注释、代码完整

**输出清单**：
```
□ 注释质量：
  - `UserService.findById()`: ✅ 注释准确
  - `UserService.updateProfile()`: ⚠️ 注释与代码不符 → 需更新
□ 逻辑清晰：
  - `UserService.findById()`: ✅ 逻辑清晰
  - `UserService.updateProfile()`: ⚠️ 复杂三元表达式 → 需重构
□ 魔法值：
  - `UserService.findById()`: ✅ 使用常量
  - `UserService.updateProfile()`: ❌ 硬编码 "APPROVED" → 需提取为常量
□ 代码格式：
  - `UserService.java`: ✅ 符合项目风格
  - `UserController.java`: ⚠️ 缩进不一致 → 需调整
□ TODO/FIXME：
  - `UserService.java`: ✅ 无 TODO 注释
  - `UserController.java`: ❌ 有 TODO 注释 → 需完成或移除
□ 需要同步修改：是/否
```

---

### 维度 3：可维护性（Maintainability）

**铁律**：代码必须易于维护，依赖注入、接口抽象、避免全局状态。

**理解目标**：代码的依赖关系是否清晰？是否容易被后续开发者理解和修改？

**常见关注点**（按需检查）：
- **依赖注入**：外部依赖通过构造函数或框架注入机制注入
- **接口抽象**：优先使用接口定义依赖
- **全局状态**：避免全局变量和静态单例
- **配置外置**：配置项外置到配置文件
- **日志规范**：catch 块有日志 + 占位符格式（详细的日志完整性检查由本 Skill 的生产就绪维度覆盖）

**输出清单**：
```
□ 依赖注入：
  - `UserService.java`: ✅ 外部依赖注入
  - `UserController.java`: ❌ 内部 new 依赖 → 需改为注入
□ 接口抽象：
  - `UserService.java`: ✅ 使用接口定义依赖
  - `UserController.java`: ⚠️ 直接依赖实现类 → 需改为接口
□ 全局状态：
  - `UserService.java`: ✅ 无全局状态
  - `UserController.java`: ❌ 使用静态单例 → 需改为注入
□ 配置外置：
  - `UserService.java`: ✅ 配置外置
  - `UserController.java`: ❌ 硬编码配置 → 需外置
□ 日志完整性：
  - `UserService.findById()`: ✅ 关键路径有日志、使用占位符格式
  - `UserService.updateProfile()`: ⚠️ 日志使用字符串拼接 → 需改为占位符
□ 需要同步修改：是/否
```

---

### 维度 4：安全性（Security）

**铁律**：PII 必须脱敏，查询必须使用参数化方式，接口必须幂等，敏感操作必须有权限校验。

**检查项**：
1. **PII 脱敏**：手机号、身份证、银行卡号等敏感信息是否脱敏？
2. **注入防护**：是否使用参数化查询（Prepared Statement / ORM 参数绑定）而非字符串拼接？
3. **幂等性**：接口重复调用是否会出问题？
4. **权限校验**：是否有权限校验机制？
5. **资金/高危操作风险**：是否涉及资金或高危操作？是否需要二次确认或审批？

**输出清单**：
```
□ PII 脱敏：
  - `UserService.findById()`: 日志包含手机号 → 需脱敏
  - `UserService.updateProfile()`: 返回身份证号 → 需脱敏
□ 注入防护：
  - `UserRepository.findByName()`: ✅ 使用参数化查询
  - `UserRepository.search()`: ❌ 使用字符串拼接构建查询 → 需改为参数化查询
□ 幂等性：
  - `OrderController.create()`: ✅ 有幂等键
  - `OrderController.update()`: ❌ 无幂等保护
□ 权限校验：
  - `UserController.getProfile()`: ✅ 有权限校验
  - `UserController.updateProfile()`: ❌ 无权限校验
□ 资金/高危操作风险：
  - 是否涉及资金或高危操作：否
  - 是否需要二次确认或审批：否
□ 需要同步修改：是/否
```

---

### 维度 5：性能（Performance）

**铁律**：避免 N+1 查询，避免大事务，避免内存泄漏。

**理解目标**：代码是否存在明显的性能瓶颈？数据库访问、事务范围、资源管理是否合理？

**常见关注点**（按需检查）：
- **N+1 查询**：是否存在循环查询？
- **大事务**：事务是否过长？是否需要拆分？
- **内存泄漏**：是否正确关闭资源？
- **缓存使用**：是否合理使用缓存？
- **批量操作**：是否使用批量操作？

**输出清单**：
```
□ N+1 查询：
  - `OrderService.listWithDetails()`: ✅ 使用批量查询
  - `OrderService.exportAll()`: ❌ 循环查询 → 需优化为批量
□ 大事务：
  - `OrderService.checkout()`: ✅ 事务时长 < 1s
  - `OrderService.batchImport()`: ⚠️ 事务时长 > 5s → 需拆分
□ 内存泄漏：
  - `FileService.readFile()`: ✅ 正确关闭资源
  - `FileService.processStream()`: ⚠️ 未关闭 Stream → 需修复
□ 缓存使用：
  - `UserService.findById()`: ✅ 使用缓存
  - `UserService.updateProfile()`: ⚠️ 未更新缓存 → 需添加缓存失效
□ 批量操作：
  - `OrderService.batchCreate()`: ✅ 使用批量插入
  - `OrderService.syncAll()`: ❌ 单条插入 → 需优化为批量
□ 需要同步修改：是/否
```

---

### 维度 6：测试覆盖（Test Coverage）

**铁律**：核心业务逻辑必须有测试，覆盖率 ≥ 80%。

**理解目标**：核心业务逻辑是否有充分的测试覆盖？边界和异常场景是否被验证？

**常见关注点**（按需检查）：
- **单元测试**：核心方法是否有单元测试？
- **测试覆盖率**：行覆盖率 ≥ 80%，分支覆盖率 ≥ 70%？
- **Mock 配置**：外部依赖是否 Mock？
- **边界测试**：边界值是否测试？
- **异常测试**：异常场景是否测试？

**输出清单**：
```
□ 单元测试：
  - `UserService.java`: ✅ 有单元测试
  - `UserController.java`: ❌ 无单元测试 → 需添加
□ 测试覆盖率：
  - `UserService.java`: ✅ 行覆盖率 85%，分支覆盖率 75%
  - `UserController.java`: ⚠️ 行覆盖率 60% → 需补充
□ Mock 配置：
  - `UserServiceTest.java`: ✅ 外部依赖已 Mock
  - `UserControllerTest.java`: ⚠️ 未 Mock 外部 RPC 调用 → 需添加
□ 边界测试：
  - `UserServiceTest.java`: ✅ 有边界测试
  - `UserControllerTest.java`: ❌ 无边界测试 → 需添加
□ 异常测试：
  - `UserServiceTest.java`: ✅ 有异常测试
  - `UserControllerTest.java`: ❌ 无异常测试 → 需添加
□ 需要同步修改：是/否
```

---

## 执行流程

```
提交代码前
    ↓
维度 0：设计品味检查（先建立整体印象）
    ↓
维度 1：代码质量检查
    ↓
维度 2：可读性检查
    ↓
维度 3：可维护性检查
    ↓
维度 4：安全性检查
    ↓
维度 5：性能检查
    ↓
维度 6：测试覆盖检查
    ↓
输出"Code Review 清单"
    ↓
确认无问题 → 提交
```

---

## Code Review 清单模板

```markdown
## 📋 Code Review 清单

**Review 目标**: `UserService.findById()`

### 维度 0：设计品味
- 整体印象：[优雅/尚可/需改进]
- 最值得学习的设计：[如有]
- 最需要改进的坏味道：[如有]

### 维度 1：代码质量
- ✅ 函数设计：职责单一、嵌套 1 层
- ✅ 类设计：450 行、15 个方法
- ✅ 命名规范：变量名有意义
- ✅ 代码复用：复用 `UserRepository.findById()`
- ✅ 异常处理：catch 块有日志 + 堆栈
- ⚠️ 需要同步修改：否

### 维度 2：可读性
- ✅ 注释质量：注释准确
- ✅ 逻辑清晰：逻辑清晰
- ✅ 魔法值：使用常量
- ✅ 代码格式：符合项目风格
- ✅ TODO/FIXME：无 TODO 注释
- ⚠️ 需要同步修改：否

### 维度 3：可维护性
- ✅ 依赖注入：外部依赖注入
- ✅ 接口抽象：使用接口定义依赖
- ✅ 全局状态：无全局状态
- ✅ 配置外置：配置外置
- ✅ 日志完整性：关键路径有日志、使用占位符格式
- ⚠️ 需要同步修改：否

### 维度 4：安全性
- ✅ PII 脱敏：无 PII
- ✅ 注入防护：使用参数化查询
- ✅ 幂等性：有幂等键
- ✅ 权限校验：有权限校验
- ✅ 资金/高危操作风险：不涉及
- ⚠️ 需要同步修改：否

### 维度 5：性能
- ✅ N+1 查询：使用批量查询
- ✅ 大事务：事务时长 < 1s
- ✅ 内存泄漏：正确关闭资源
- ✅ 缓存使用：合理使用缓存
- ✅ 批量操作：使用批量插入
- ⚠️ 需要同步修改：否

### 维度 6：测试覆盖
- ✅ 单元测试：有单元测试
- ✅ 测试覆盖率：行覆盖率 85%，分支覆盖率 75%
- ✅ Mock 配置：外部依赖已 Mock
- ✅ 边界测试：有边界测试
- ✅ 异常测试：有异常测试
- ⚠️ 需要同步修改：否

---

## Review 结论
- 🟢 通过：代码质量优秀，可以提交

## Review 建议
无
```

---

## 违规检测

以下情况视为违规：
- ❌ 提交代码前未调用本 skill
- ❌ **跳过维度 0 设计品味检查**（未评估抽象层次、命名表达力、坏味道）
- ❌ 代码存在上帝类（>500 行）
- ❌ 函数嵌套 >2 层
- ❌ catch 块无日志
- ❌ 使用字符串拼接构建查询语句而非参数化查询
- ❌ PII 未脱敏
- ❌ 接口无幂等保护
- ❌ 核心业务逻辑无测试
- ❌ 测试覆盖率 < 80%
- ❌ **方法名使用 `process()`/`handle()`/`doSomething()` 等模糊命名**
- ❌ **变量名使用 `list`/`map`/`result`/`data`/`temp` 等无业务含义命名**

---

## Sub Agent 委派策略

> **核心原则**：维度 0（设计品味）必须在主对话执行（需要整体感受和审美判断），维度 1-6 的逐项检查可委派给 Sub Agent。

### 委派触发条件

当以下任一条件满足时，**应主动委派**维度 1-6 的检查：
- 修改文件 ≥3 个
- 修改涉及多个模块
- 用户要求完整 Code Review

### 委派编排模式

```
主对话：维度 0 设计品味检查（整体感受 + 坏味道识别）
    ↓
并发委派（最多 2 个 Sub Agent）：
├── Sub Agent 1: 维度 1-3 检查（代码质量 + 可读性 + 可维护性）
├── Sub Agent 2: 维度 4-6 检查（安全性 + 性能 + 测试覆盖）
    ↓
主对话：汇总所有维度结果 → 输出最终 Review 清单
```

### 委派 Prompt 要求

每个 Sub Agent 的 prompt 必须包含：
1. **任务类型**：只读调研任务
2. **检查范围**：明确的文件路径列表（从本次修改中获得）
3. **检查维度**：明确分配的维度编号和检查项
4. **返回格式**：按统一输出清单格式返回（✅/❌/⚠️）
5. **禁止行为**：不要修改任何文件，不要做设计品味评价（那是主对话的职责）

---

## 与其他 Skills 的协作

- **change-impact-analyzer**: 分析变更影响后，检查代码质量
- **生产就绪检查**：已作为本 Skill 的一个审查维度内置，Code Review 时一并覆盖日志/兼容性/回滚/监控等生产就绪项
- **architecture-guard**: 事前的架构合规检查与事后的 Review 互补
