# Dimensions 1-3: Code Quality + Readability + Maintainability

> These three dimensions are often checked together. They share the same output format pattern.

---

## Dimension 1: Code Quality

**Iron Law**: Code must meet high standards: no TODO placeholders, no God classes, no deep nesting, no duplicate code.

**Goal**: Are function/class designs sound? Do names convey business semantics? Is there duplicate code or exception handling gaps?

### Check Items

| Item | Standard |
|------|----------|
| Function Design | Single responsibility, nesting <= 2 levels, use Guard Clause for early return |
| Class Design | No God class (>500 lines), methods <= 20 |
| Naming Convention | Names meaningful, follow language conventions, **convey business semantics** (avoid vague names like `process()`/`handle()`, avoid non-business names like `list`/`map`/`result`/`data`/`temp`) |
| Code Reuse | No duplicate code, reuse existing APIs and design patterns |
| Exception Handling | Catch blocks have log + stacktrace, never swallow exceptions, must have corresponding handling action |

### Output Template

```
□ Function Design:
  - `UserService.findById()`: ✅ Single responsibility, nesting 1 level
  - `UserService.updateProfile()`: ⚠️ Nesting 3 levels → Refactor
□ Class Design:
  - `UserService.java`: ✅ 450 lines, 15 methods
  - `UserController.java`: ❌ 600 lines, 25 methods → Split
□ Naming Convention:
  - `UserService.findById()`: ✅ Variable names meaningful
  - `UserService.updateProfile()`: ⚠️ Variable name `n` → Change to `numRecords`
□ Code Reuse:
  - `UserService.findById()`: ✅ Reuses `UserRepository.findById()`
  - `UserService.updateProfile()`: ❌ Duplicate query logic → Extract
□ Exception Handling:
  - `UserService.findById()`: ✅ Catch block has log + stacktrace
  - `UserService.updateProfile()`: ❌ Catch block no log → Add
□ Needs Sync Changes: Yes/No
```

---

## Dimension 2: Readability

**Iron Law**: Code must be easy to understand, comments accurate, logic clear, no magic values.

**Goal**: Does the code read smoothly? Are there misleading comments, magic values, or unfinished TODOs?

### Check Items

| Item | Standard |
|------|----------|
| Comment Quality | Comments consistent with code, no misleading descriptions |
| Logic Clarity | Avoid complex ternary expressions, avoid overly long chain calls |
| Magic Values | Avoid hardcoding, use constants or enums |
| Code Format | Follow project code style, consistent indentation |
| TODO/FIXME | No TODO comments, code is complete |

### Output Template

```
□ Comment Quality:
  - `UserService.findById()`: ✅ Comments accurate
  - `UserService.updateProfile()`: ⚠️ Comment inconsistent with code → Update
□ Logic Clarity:
  - `UserService.findById()`: ✅ Logic clear
  - `UserService.updateProfile()`: ⚠️ Complex ternary expression → Refactor
□ Magic Values:
  - `UserService.findById()`: ✅ Uses constants
  - `UserService.updateProfile()`: ❌ Hardcoded "APPROVED" → Extract as constant
□ Code Format:
  - `UserService.java`: ✅ Follows project style
  - `UserController.java`: ⚠️ Inconsistent indentation → Adjust
□ TODO/FIXME:
  - `UserService.java`: ✅ No TODO comments
  - `UserController.java`: ❌ Has TODO comment → Complete or remove
□ Needs Sync Changes: Yes/No
```

---

## Dimension 3: Maintainability

**Iron Law**: Code must be easy to maintain — dependency injection, interface abstraction, avoid global state.

**Goal**: Are dependency relationships clear? Can subsequent developers easily understand and modify?

### Check Items

| Item | Standard |
|------|----------|
| Dependency Injection | External dependencies injected via constructor or framework injection |
| Interface Abstraction | Prefer using interfaces to define dependencies |
| Global State | Avoid global variables and static singletons |
| Configuration Externalization | Config items externalized to config files |
| Logging Standards | Catch blocks have logs + placeholder format (detailed log completeness covered by production-readiness dimension) |

### Output Template

```
□ Dependency Injection:
  - `UserService.java`: ✅ External dependencies injected
  - `UserController.java`: ❌ Internal new dependency → Change to injection
□ Interface Abstraction:
  - `UserService.java`: ✅ Uses interfaces for dependencies
  - `UserController.java`: ⚠️ Direct dependency on implementation class → Change to interface
□ Global State:
  - `UserService.java`: ✅ No global state
  - `UserController.java`: ❌ Uses static singleton → Change to injection
□ Configuration Externalization:
  - `UserService.java`: ✅ Config externalized
  - `UserController.java`: ❌ Hardcoded config → Externalize
□ Logging Completeness:
  - `UserService.findById()`: ✅ Key paths logged, using placeholder format
  - `UserService.updateProfile()`: ⚠️ Log uses string concatenation → Change to placeholder
□ Needs Sync Changes: Yes/No
```
