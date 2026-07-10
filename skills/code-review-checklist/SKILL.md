---
name: code-review-checklist
version: 1.2.0
description: "Code Review Checklist. Systematically check code quality, readability, maintainability and security, output Review checklist. Trigger words: CR, Code Review, submit code."
---

# Code Review Checklist

> **Goal**: Review code with quality and maintainability as top priorities.
> Not ticking boxes — **feel the overall design elegance first, then check details**.

**Iron Law**: Before submitting code → must run this skill → output Review checklist → confirm no issues → then submit. No exceptions.

---

## Trigger Conditions

Must invoke when user requests:
- Git commit
- Code Review request
- Pull/Merge request (PR/MR)

---

## Seven-Dimension Framework

> **Execution Order**: Run Dimension 0 (design taste) first to establish overall impression, then check Dimensions 1-6 details.

| Dim | Name | One-Line Summary | Reference |
|-----|------|------------------|-----------|
| 0 | Design Taste | Feel code elegance: SLAP, code smells, SOLID | [dimension-0-design-taste.md](references/dimension-0-design-taste.md) |
| 1 | Code Quality | No God class, no deep nesting, business-semantic naming | [dimensions-1-3-quality-readability-maintainability.md](references/dimensions-1-3-quality-readability-maintainability.md) |
| 2 | Readability | Clear logic, accurate comments, no magic values | [dimensions-1-3-quality-readability-maintainability.md](references/dimensions-1-3-quality-readability-maintainability.md) |
| 3 | Maintainability | DI, interface abstraction, no global state, config externalized | [dimensions-1-3-quality-readability-maintainability.md](references/dimensions-1-3-quality-readability-maintainability.md) |
| 4 | Security | PII desensitized, parameterized queries, idempotent, permission checks | [dimensions-4-6-security-performance-testing.md](references/dimensions-4-6-security-performance-testing.md) |
| 5 | Performance | No N+1 queries, no large transactions, no memory leaks | [dimensions-4-6-security-performance-testing.md](references/dimensions-4-6-security-performance-testing.md) |
| 6 | Test Coverage | Core logic tested, coverage >= 80%, boundary + exception tests | [dimensions-4-6-security-performance-testing.md](references/dimensions-4-6-security-performance-testing.md) |

---

## Unified Output Format

> Each dimension outputs results in this format:

```markdown
□ [Check Item Name]:
  - `UserService.findById()`: ✅ [Pass Reason]
  - `UserService.findById()`: ❌ [Problem Description] → [Improvement Suggestion]
  - `UserService.findById()`: ⚠️ [Warning] → [Optional Improvement]
□ Needs Sync Changes: Yes/No
```

Full output template: [review-checklist-template.md](references/review-checklist-template.md)

---

## Execution Flow

Dimension 0 first → Dimensions 1-6 (may delegate to sub-agents) → Output Review checklist → Confirm → Submit

---

## Key Violations

The following are always violations — no exceptions:

- Skipping Dimension 0 design taste check
- God class (>500 lines)
- Function nesting > 2 levels
- Catch block without logging
- String concatenation for query building (not parameterized)
- PII not desensitized
- Interface without idempotency protection
- Core business logic without tests
- Test coverage < 80%
- Vague method names (`process()`/`handle()`/`doSomething()`)
- Non-business variable names (`list`/`map`/`result`/`data`/`temp`)

---

## Sub-Agent Delegation Strategy

> Dimension 0 must run in main conversation (needs aesthetic judgment). Dimensions 1-6 can be delegated.

**Delegate when**: modified files >= 3, changes span multiple modules, or user requests full Code Review.

**Pattern**: Main → D0 → parallel delegate (Sub-agent 1: D1-3, Sub-agent 2: D4-6) → Main aggregates → final checklist.

**Sub-agent prompt must include**: (1) Read-only investigation task type; (2) Explicit file path list; (3) Assigned dimension numbers + check items from reference files; (4) Unified output format (✅/❌/⚠️); (5) No file modifications, no design taste evaluation.

---
