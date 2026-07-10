---
name: unit-test-master
version: 4.0.0
description: "单元测试全流程引擎。编写、修复、巡检单元测试，支持单点编写和全量巡检。写测试或修测试前必须调用。触发词：写测试、UT、单元测试、测试报错、修测试、全量巡检。"
---

# Unit Test Master v4.0 — Context-First Hybrid Mode

> **Architecture**: Context-First + Hybrid Mode.
> **Context-First**: Before any agent dispatch or fix, deeply understand the tested code's business context and data structures. Inject this understanding as a "context anchor" into all subsequent phases.
> **Hybrid Mode**: Orchestrator handles routing, complexity assessment, and decisions; simple fixes are done inline in the main dialog (Inline Fix), complex tasks are delegated to sub-agents with independent context.
> **Core principle**: The biggest bottleneck for AI writing tests is not code generation capability, but understanding depth of the tested code.

**Trigger**: When user requests writing unit tests, coverage, fixing test errors, or **scanning all failed cases**.

---

## Iron Laws: Test Isolation (highest priority, violation = breach)

> Tests are "clients" of tested code. Senior engineers treat tested code as an immutable black box — tests adapt to code, not code to tests.

1. **Never modify non-test code**: Only create or modify files in test directories (e.g., `src/test/`, `__tests__/`, `*_test.go`). Source code, config files, dependency management files must not be touched.
   - If tested code is hard to test (static methods, hardcoded deps, final classes), **report in DfT assessment and stop for user decision** — never "helpfully refactor" tested code
   - If tested method signature changed causing test compile failure, **only modify test code to adapt to new signature**
2. **Never introduce new dependencies**: Only use project-declared dependencies. Introducing new deps is an architecture decision, not a test engineer's job.
   - If a utility class is needed but absent, **implement equivalent functionality using existing dependencies**
   - If a new dependency is truly required, **report to user and wait for confirmation**
3. **Never modify test infrastructure**: Test base classes, shared config files, etc. must not be changed without explicit user authorization

## Core Writing Strategy (always in effect)

- **Coverage-oriented**: Only write cases for uncovered lines, not extra path combinations
- **Minimal case set**: Choose paths that penetrate the most uncovered lines; same coverage keeps only one case
- **Parameterized tests**: Prefer parameterized tests to cover multiple branches with one data set
- **Mock external deps**: Use mock framework to simulate external calls, bypass complex prerequisites
- **Test naming**: `should_{expected_behavior}_when_{condition}`, never Chinese names
- **Test structure**: Strict Given-When-Then three-section format

---

## Intent Recognition Routing

```text
Test-related request received
    |
    |-- Autopilot inspection -> references/path-inspection.md (Phase 0A)
    |       Trigger words: "start test inspection", "run tests then fix", "auto-fix all failures"
    |
    |-- Manual inspection -> references/path-inspection.md (Phase 0)
    |       Trigger words: "scan failed cases", "full inspection", "see which tests failed"
    |
    |-- Resume from checkpoint -> references/path-inspection.md (Phase 0B)
    |       Trigger words: "continue fixing tests", "resume"
    |
    |-- Write new test -> references/path-new-test.md (Phases 1-3)
    |
    |-- Fix existing test -> references/path-fix-test.md (Phases 1-2)
```

| User expression | Route to | Notes |
|----------------|----------|-------|
| "start test inspection" | Autopilot mode | Default full scan, auto-fix all |
| "scan failed cases" | Manual inspection mode | Generate report, wait for user |
| "continue fixing tests" | Checkpoint resume | Load existing report, resume |
| Ambiguous intent | Proactively ask | "Autopilot or report first?" |

### Fix Path Complexity Routing

```text
Complexity assessment:
    |-- Green: <=2 errors, type clear, single file -> Inline Fix (main dialog)
    |-- Yellow: >=3 errors or framework/mock/multi-file -> Delegated Fix (sub-agent)
    |-- Red: >=3 test classes failing -> Batch Fix (Phase 0 inspection)
```

---

## References

| File | Description |
|------|-------------|
| `references/path-new-test.md` | Write-new-test flow: Understand (context probe + business understanding + DfT + strategy design) -> Act (generation + verification) -> Verify (intent check + experience review) |
| `references/path-fix-test.md` | Fix-existing-test flow: Understand (intent + error classification + troubleshooting guide) -> Plan (declare strategy) -> Act (Inline/Delegated/Batch routing) |
| `references/path-inspection.md` | Both Autopilot (auto scan-fix-verify) and Manual (scan-report-wait) inspection flows, plus checkpoint resume mode |
| `references/violations.md` | Complete violation detection checklist: Context-First, Test Isolation, Process, and Inspection violations |

---

## Quality Self-Check (short version)

After any test action, verify:
1. **Isolation**: Did I touch only test files? No source/config/dependency changes?
2. **Intent preservation**: Does the test still verify the original business behavior? No assertion weakening?
3. **Experience capture**: Should new patterns be recorded in `.notes/` assets?

---

## Bound Knowledge Assets

### Sub-Agent Prompt Templates

| Agent | Template file | Purpose |
|-------|--------------|---------|
| Research Agent | `references/agents/researcher-agent-prompt.md` | Business-driven multi-dimensional context collection |
| Generator Agent | `references/agents/generator-agent-prompt.md` | Code generation with business semantic constraints |
| Fix Agent | `references/agents/fixer-agent-prompt.md` | Intent-preserving error fix (Delegated Fix path) |
| Verification Sub-Agent | Orchestrator inline prompt | Run test + parse results (read-only, must not modify files) |

### Core Process Assets

| Asset file | Loaded by | Purpose |
|-----------|-----------|---------|
| `references/dft-checklist.md` | Orchestrator | DfT testability assessment |
| `references/test-strategy-template.md` | Orchestrator | Test strategy design template |
| `references/generation-anti-patterns.md` | Generator Agent | Anti-pattern quick reference |
| Project troubleshooting guide (e.g., `.notes/patterns/troubleshooting/`) | **Orchestrator** (Phase 1 hard constraint) | Common error troubleshooting manual, must-read before fixing |
