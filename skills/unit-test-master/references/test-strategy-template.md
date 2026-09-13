# Test Strategy Template

> Declare test strategy before writing any test code.
> Used by the orchestrator in Phase 1 Step 4 of new test writing.

## Template

```markdown
## Test Strategy: {ClassName}.{methodName}()

### Business Semantics
{One-sentence description of what this method does in business terms}

### DfT Assessment
- **Level**: 🟢 Green / 🟡 Yellow / 🔴 Red
- **Notes**: {any special considerations}

### Case Design

| # | Case Name | Covered Path | Input Characteristics | Expected Behavior | Priority |
|---|-----------|-------------|----------------------|------------------|:--------:|
| 1 | should_{behavior}_when_{condition} | Normal path / Happy path | {key input values} | {business outcome} | P0 |
| 2 | should_{behavior}_when_{condition} | Edge case / Boundary | {edge values} | {expected handling} | P1 |
| 3 | should_{behavior}_when_{condition} | Error path / Exception | {invalid input} | {expected error} | P1 |
| 4 | should_{behavior}_when_{condition} | Empty / Null input | {null/empty} | {null handling} | P2 |

**Priority Legend**:
- **P0**: Core business logic — must cover
- **P1**: Edge cases and error handling — should cover
- **P2**: Null/empty/trivial cases — nice to have

### Mock Strategy

| Dependency | Mock Behavior | Return Value |
|-----------|--------------|--------------|
| {Repository}.{method}() | when(...).thenReturn(...) | {business-plausible return} |
| {Service}.{method}() | when(...).thenThrow(...) | {expected exception for error path} |

### Test File
- **Path**: `{test_dir}/{package}/{ClassName}Test.java`
- **Base class**: `{BaseTestClass}` (if any)
- **Data builders to reuse**: `{Builder.method()}` (if any)

### Coverage Target
- **Lines**: aiming for {X}% (current: {Y}%)
- **Branches**: aiming for {X}% (current: {Y}%)
- **Key uncovered paths**: {list specific branches/lines to cover}

### Dependencies to Mock (complete list)
1. {DependencyClass}.{method}() — {why it needs mocking}
2. ...

---
> ⚠️ **Wait for user confirmation before proceeding to code generation.**
```

## Constraints

- **Case count**: Default 1 case per covered path. Don't add "extra" cases for the same path.
- **Mock completeness**: List every external call that will be mocked. Missing mocks cause NPE.
- **Data plausibility**: Mock data values must be business-reasonable (e.g., `"PRODUCT_001"` not `"test"`).
- **User confirmation gate**: Strategy must be approved before any code is written.
