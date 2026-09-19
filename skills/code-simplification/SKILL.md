---
name: code-simplification
version: 1.0.0
description: "简化代码以提高可读性和可维护性。在保持行为不变的前提下，降低代码复杂度。触发词：简化代码、重构代码、代码简化、优化代码结构、这个代码太复杂了、简化。适用于代码能工作但可读性/可维护性不佳时，与 code-review-checklist D0 互补（D0 是审查时评估设计味道，本 Skill 是主动重构降复杂度）。"
---

# Code Simplification（代码简化）

> **核心信念**：简化的目标不是更少的行数——而是更容易理解、修改和调试的代码。每次简化必须通过一个简单的测试："一个新团队成员能比原版更快理解这段代码吗？"

---

## 何时使用

- 功能已正常工作、测试通过，但实现比需要的重
- 代码审查中发现可读性或复杂度问题
- 遇到深层嵌套逻辑、长方法、不清晰的命名
- 重构时间压力下写的代码
- 合并后引入了重复或不一致

**什么时候不用**：

- 代码已经干净可读——不要为了简化而简化
- 还不理解代码做什么——理解后再简化
- 代码是性能关键的，且"简化"版本会明显变慢
- 即将重写整个模块——简化废弃代码是浪费精力

---

## 五个原则

### 1. 行为不变

不改变代码做什么——只改变它如何表达。所有输入、输出、副作用、错误行为、边界情况必须保持完全一致。如果不确定简化是否保持行为，不要做。

```
每次修改前自问：
→ 对每个输入，输出是否相同？
→ 是否保持相同的错误行为？
→ 是否保持相同的副作用和顺序？
→ 所有现有测试是否无需修改就能通过？
```

### 2. 遵循项目约定

简化意味着让代码与代码库更一致，而不是强加外部偏好。简化前：

```
1. 读 CLAUDE.md / 项目约定
2. 研究邻近代码如何处理类似模式
3. 匹配项目的风格：
   - 命名约定
   - 错误处理模式
   - 类型注解深度
   - 导入顺序
```

打破项目一致性的简化不是简化——是无效变更。

### 3. 清晰优于巧妙

显式代码优于紧凑代码，当紧凑版本需要心智停顿来解析时。

```java
// 不清晰：三元链
String label = isNew ? "New" : isUpdated ? "Updated" : isArchived ? "Archived" : "Active";

// 清晰：可读的映射
if (item.isNew) return "New";
if (item.isUpdated) return "Updated";
if (item.isArchived) return "Archived";
return "Active";
```

```java
// 不清晰：链式流操作堆叠
List<Long> ids = items.stream()
    .filter(i -> i.getStatus() == Status.ACTIVE)
    .map(Item::getId)
    .filter(id -> id != null)
    .collect(Collectors.toList());

// 清晰：方法引用 + 显式中间步骤
List<Item> activeItems = items.stream()
    .filter(Item::isActive)
    .collect(Collectors.toList());
List<Long> ids = activeItems.stream()
    .map(Item::getId)
    .filter(Objects::nonNull)
    .collect(Collectors.toList());
```

### 4. 保持平衡

简化有失败模式：过度简化。注意以下陷阱：

- **过度内联**——删除了给概念命名的辅助方法，反而让调用处更难读
- **合并无关逻辑**——两个简单函数合并成一个复杂函数不是简化
- **删除"不必要的"抽象**——有些抽象的存在是为了扩展性/可测试性，不是复杂度
- **优化行数**——更少的行数不是目标，更容易的理解才是

### 5. 限定变更范围

默认只简化最近修改过的代码。避免对无关代码做"顺便"重构，除非明确要求扩大范围。无范围限制的简化会在 diff 中制造噪声，并引入意外回归风险。

---

## 简化流程

### Step 1: 理解再动手（Chesterton's Fence）

在修改或删除任何东西之前，先理解它为什么存在。这就是 Chesterton's Fence：如果你看到路上有一道栅栏，不理解它为什么在那，不要把它拆掉。先理解理由，再决定理由是否仍然成立。

```
简化前回答：
- 这段代码的职责是什么？
- 谁调用它？它调用了谁？
- 边界情况和错误路径是什么？
- 是否有测试定义了期望行为？
- 为什么当初这样写？（性能？平台约束？历史原因？）
- 用 git blame 检查：这段代码的原始上下文是什么？
```

如果回答不了这些问题，你还没准备好简化。先读更多上下文。

### Step 2: 识别简化机会

扫描以下模式——每个都是一个具体信号，不是模糊的"味道"。

**结构复杂度：**

| 模式 | 信号 | 简化方案 |
|------|------|---------|
| 深层嵌套（3+ 层） | 控制流难以跟踪 | 提取为 Guard Clause 或辅助方法 |
| 长方法（30+ 行，超过我们 ≤20 行标准） | 多职责混合 | 拆分为有命名描述的独立方法 |
| 三元运算符嵌套 | 需要心智栈来解析 | 替换为 if/else 链、switch、或查找表 |
| 布尔参数标志 | `doThing(true, false, true)` | 替换为 Options 对象或独立方法 |
| 重复条件判断 | 同一 `if` 检查在多处出现 | 提取为有命名的谓词方法 |

**命名和可读性：**

| 模式 | 信号 | 简化方案 |
|------|------|---------|
| 泛化命名 | `data`, `result`, `temp`, `val`, `list`, `map` | 重命名为描述内容：`userProfile`, `validationErrors` |
| 缩写命名 | `usr`, `cfg`, `btn`, `evt` | 使用全称，除非缩写是通用（`id`, `url`, `api`） |
| 误导命名 | 名为 `getXxx` 但同时修改状态 | 重命名以反映实际行为 |
| 注释说"做什么" | `// 递增计数器` 在 `count++` 上面 | 删除注释——代码本身够清晰 |
| 注释说"为什么" | `// 重试因为 API 在负载下不稳定` | 保留——这些注释携带代码无法表达的意图 |

**冗余：**

| 模式 | 信号 | 简化方案 |
|------|------|---------|
| 重复逻辑 | 相同 5+ 行在多个地方 | 提取为共享方法 |
| 死代码 | 不可达分支、未用变量、注释掉的块 | 删除（确认确实是死代码后） |
| 不必要的抽象 | 包装层没有增加价值 | 直接调用底层方法 |
| 过度设计 | 策略模式只有一个策略、工厂方法没有多种实现 | 替换为简单直接的方式 |
| 冗余类型声明 | 泛型类型在右侧已推断 | 使用 diamond operator `<>` |

### Step 3: 增量应用

每次只做一个简化。每次修改后跑测试。**重构修改与功能修改分开提交。** 一个既重构又加功能的 PR 是两个 PR——分开它们。

```
每次简化：
1. 做修改
2. 跑测试套件
3. 测试通过 → 继续下一个简化
4. 测试失败 → 回滚并重新考虑
```

避免把多个简化批量塞进一个未测试的改动。如果某处崩了，你需要知道是哪个简化导致的。

**500 规则**：如果重构会触及超过 500 行，考虑用自动化工具（IDE 重构、sed 脚本）而不是手动修改。在这个规模下手动修改容易出错且难以审查。

### Step 4: 验证结果

所有简化完成后，退一步评估整体：

```
对比前后：
- 简化版是否真的更容易理解？
- 是否引入了与代码库不一致的新模式？
- diff 是否干净可审查？
- 团队成员会批准这个修改吗？
```

如果"简化"版更难理解或审查，回滚。不是每次简化尝试都会成功。

---

## Java 特定指导

```java
// 简化：不必要的临时变量
// 前
String result = "";
result = userService.findById(userId).getName();
return result;
// 后
return userService.findById(userId).getName();

// 简化：多条件判断用 Guard Clause
// 前
if (data != null) {
    if (data.isValid()) {
        if (data.hasPermission()) {
            return process(data);
        } else {
            throw new PermissionException("No permission");
        }
    } else {
        throw new ValidationException("Invalid data");
    }
} else {
    throw new IllegalArgumentException("Data is null");
}
// 后
if (data == null) throw new IllegalArgumentException("Data is null");
if (!data.isValid()) throw new ValidationException("Invalid data");
if (!data.hasPermission()) throw new PermissionException("No permission");
return process(data);

// 简化：使用 Optional 避免空值链
// 前
Address address = null;
if (user != null) {
    address = user.getAddress();
}
// 后
Address address = Optional.ofNullable(user)
    .map(User::getAddress)
    .orElse(null);

// 简化：条件赋值
// 前
String displayName;
if (user.getNickname() != null) {
    displayName = user.getNickname();
} else {
    displayName = user.getFullName();
}
// 后
String displayName = user.getNickname() != null ? user.getNickname() : user.getFullName();
// 或 Objects.toString
String displayName = Objects.toString(user.getNickname(), user.getFullName());

// 简化：集合构建
// 前
List<Long> activeUserIds = new ArrayList<>();
for (User user : users) {
    if (user.isActive()) {
        activeUserIds.add(user.getId());
    }
}
// 后
List<Long> activeUserIds = users.stream()
    .filter(User::isActive)
    .map(User::getId)
    .collect(Collectors.toList());

// 简化：冗余布尔返回
// 前
public boolean isValid(String input) {
    if (input != null && input.length() > 0 && input.length() < 100) {
        return true;
    }
    return false;
}
// 后
public boolean isValid(String input) {
    return input != null && input.length() > 0 && input.length() < 100;
}
```

---

## 常见合理化借口

| 合理化借口 | 现实 |
|-----------|------|
| "代码能工作，没必要碰" | 能工作但难读的代码，当它坏了时更难修。现在简化能节省每次后续修改的时间。 |
| "更少的行数总是更简单" | 一行嵌套三元不比 5 行 if/else 简单。简单性是关于理解速度，不是行数。 |
| "我顺便优化一下这段无关代码" | 无范围限制的简化制造噪声 diff 和你不打算改的代码的回归风险。保持专注。 |
| "类型让它自文档化了" | 类型文档化结构，不是意图。一个有良好命名的方法比类型签名更好地解释"为什么"。 |
| "这个抽象未来可能有用" | 不要保留推测性的抽象。如果现在不用，就是没有价值的复杂度。删除它，需要时再加。 |
| "原作者肯定有理由" | 也许。检查 git blame——应用 Chesterton's Fence。但累积的复杂度往往没有理由，只是迭代压力下的残留。 |
| "我边加功能边重构" | 把重构和功能分开。混合的修改更难审查、回滚、在历史中理解。 |
| "我们项目里没这些模式" | 代码简化遵循项目约定——如果 Java 项目没有用 Stream API，就不要强制引入。保持一致性优先。 |

---

## 红旗信号

- 简化需要修改测试才能通过（你很可能改变了行为）
- "简化"后的代码比原版长且更难理解
- 用个人偏好而不是项目约定来重命名
- 因为"让代码更干净"而删除错误处理
- 简化你还不完全理解的代码
- 把多个简化批量塞进一个大而难审查的提交
- 不在当前任务范围内重构代码（未经要求）

---

## 验证

完成简化后：

- [ ] 所有现有测试无需修改通过
- [ ] 编译成功，无新警告
- [ ] 每个简化是可审查的增量变更
- [ ] diff 干净——没有混入无关变更
- [ ] 简化后的代码遵循项目约定
- [ ] 没有错误处理被删除或弱化
- [ ] 没有死代码被遗留（未用导入、不可达分支）
- [ ] 团队成员或审查者会认为这是一次净改进