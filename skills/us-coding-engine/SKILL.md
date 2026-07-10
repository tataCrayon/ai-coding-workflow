---
name: us-coding-engine
version: 1.0.0
description: This skill should be used when the user asks to "编码", "写代码", "开始开发", "按US编码", "帮我实现", "写实现", "开发", "实现需求", "coding", or mentions 编码/实现/开发/写代码. Make sure to use this skill whenever the user wants to implement a feature or write code, even for simple modifications.
---

# US-Coding-Engine v1.0 — Per-US Coding with Senior-Developer Best-Practice Awareness

> **Core principle**: A senior engineer doesn't just translate requirements into statements — they simultaneously ensure the code is **observable, resilient, and debuggable** in production.

**Trigger**: When user requests coding, implementation, or development — regardless of scale.

---

## Input

Acquire coding context in this priority order:

1. **SOP trace directory** (e.g. `docs/sop-traces/REQ-001/`): `02-user-stories.md` (mandatory), `03-changepoints.md` (recommended), `04-database-design.md` (if DB changes)
2. **User direct input**: US description, change scope, requirement spec
3. **Project codebase**: For tech-stack detection and pattern reuse

If no User Story list found, **stop and ask**: "Please provide User Story list or requirement description."

---

## Execution Flow

### Step 1: Tech-Stack Detection

**Before writing any code, must detect tech-stack and get user confirmation.**

Scan project codebase to identify:

1. **Build & Dependencies**: `pom.xml`/`build.gradle` — Java version, Spring Boot version, ORM, middleware, utility libs
2. **Layered Architecture**: `src/main/java/` — package structure, Controller/Service/Mapper/Entity naming, DTO/VO/BO layering
3. **Project Conventions**: response wrapper, exception hierarchy, pagination, validation style, logging, constant/enum organization
4. **Code Style**: indentation, import order, comment language, Service method naming

Output **Tech-Stack Summary** and ask user to confirm/supplement. **No coding until confirmed.**

> Procedure: [references/best-practice-awareness-detail.md](references/best-practice-awareness-detail.md)

---

### Step 2: Coding Task Planning

After tech-stack confirmation:

1. Read User Story list — understand each US's description and acceptance criteria
2. Read changepoints checklist — map each US to change scope (module, file, layer)
3. Read database design — map involved table structures
4. **🔴 事实校验**：对 changepoints 中每个 `modify` 类型的涉及文件路径，用 Grep/Glob 验证其在代码库中真实存在。不存在则标记 ❌ NOT_FOUND 并暂停，禁止凭记忆假设文件存在
5. Generate **Coding Task Plan** and ask user to confirm

| # | US ID | Title | Changepoints | Est. Files | Depends On | Best-Practice Focus |
|---|-------|-------|-------------|-----------|------------|---------------------|
| 1 | US-01 | xxx | CP-US01-01 | 3 | - | Logging + Idempotent + Trace |

> Format: [references/best-practice-awareness-detail.md](references/best-practice-awareness-detail.md)

---

### Step 3: Per-US Implementation (Bottom-Up + Best-Practice Awareness)

For each US in order, execute bottom-up coding: Data (Entity/Mapper) -> Service -> Interface (Controller)

**Apply the best-practice awareness checklist at each layer**:

| # | Awareness | What to Check |
|---|-----------|---------------|
| 1 | Logging | Entry/exit logs, branch logs, error context, no sensitive data |
| 2 | Exception | Business vs system exception, unified wrapping, no silent catch |
| 3 | Monitoring | Key operation metrics, alert thresholds, trace links |
| 4 | Defensive | Parameter validation, null protection, idempotent design |
| 5 | Observability | Trace propagation, timing stats, state snapshots |

> Full templates: [references/best-practice-awareness-detail.md](references/best-practice-awareness-detail.md)

**Per-US sub-steps**:

1. **Declare**: Output "Starting US-{id}: {title}"
2. **Confirm scope**: List changepoints, files, layers for this US
3. **Implement with awareness** (strictly follow Step 1 tech-stack):
   - Reference existing similar code — maintain style consistency
   - Use project conventions (response wrapper, exception class, pagination)
   - Apply 5-area awareness checklist at each layer
   - If DB changes involved, follow `04-database-design.md`
4. **Present change summary** with best-practice notes:

```markdown
### US-{id} Coding Complete

**Changed files**: NEW/MOD with best-practice annotations
**Best-practice applied**: Logging, Exception, Monitoring, Defensive, Observability — one line each
**Acceptance criteria**: AC-01 ✅ / AC-02 ✅
```

5. **Human confirmation**: Pass / Revise / Skip

---

### Step 4: Completion Summary

After all US confirmed, output:

```markdown
## Coding Completion Summary

| US ID | Title | Status | Files Changed |
|-------|-------|--------|--------------|
| US-01 | xxx | Confirmed | 3 |

**Total**: N completed / M skipped / X files changed
```

---

## Best-Practice Awareness Quick Reference

| Awareness | Core Question | Fail Criterion |
|-----------|--------------|---------------|
| Logging | Is every meaningful path logged? | Silent catch or critical path with no log |
| Exception | Is every failure surface properly wrapped? | Bare catch with no action; business error as system error |
| Monitoring | Are critical operations instrumented? | High-value operation with no timing/metric上报 |
| Defensive | Are all inputs validated and outputs null-safe? | Missing @Validated; collection return could be null |
| Observability | Can production issues be traced end-to-end? | No traceId; no timing at decision points |

> Full templates: [references/best-practice-awareness-detail.md](references/best-practice-awareness-detail.md)

---

## Coding Principles

1. **Strictly follow tech-stack** — no out-of-scope frameworks or architecture changes
2. **Reuse existing patterns** — maintain style consistency
3. **Bottom-up** — Data -> Service -> Interface
4. **Use project conventions** — response wrapper, exception class, pagination
5. **Best-practice awareness by default** — not optional add-ons
6. **Minimal change** — only modify code related to current US
7. **Compilable** — every US must leave project compilable
8. **Dependency ordering** — depended-upon US coded first

---

## Collaboration

- **Upstream**: `02-user-stories.md` (R-toolkit), `03-changepoints.md` + `04-database-design.md` (A-toolkit)
- **Downstream**: unit-test-master, code-review-checklist
- **Independent**: Can run standalone if user provides US descriptions directly
