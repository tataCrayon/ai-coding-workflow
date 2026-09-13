# DfT (Design for Testability) Assessment Checklist

> Used by the orchestrator in Phase 1 Step 3 of new test writing.
> Assess whether the target code is testable before attempting to write tests.

## Assessment Levels

| Level | Meaning | Action |
|:-----:|---------|--------|
| 🟢 **Green** | Directly testable | Proceed with test writing |
| 🟡 **Yellow** | Needs adaptation | Proceed but note extra mock configuration needed |
| 🔴 **Red** | Not suitable for direct testing | **Stop. Report to user. Wait for decision.** |

## Checklist

### 1. Constructor / Dependency Injection

| Check | Green | Yellow | Red |
|-------|:-----:|:------:|:---:|
| Dependencies injected via constructor/setter? | ✅ All injected | Some @Autowired fields | All dependencies hardcoded with `new` |
| Can dependencies be mocked? | ✅ Interfaces/classes | Final classes (Mockito inline) | Static factories with no mock support |

### 2. Method Signature

| Check | Green | Yellow | Red |
|-------|:-----:|:------:|:---:|
| Parameters are simple or mockable? | ✅ Simple types / interfaces | Complex objects with deep nesting | Un-mockable framework types |
| Return type is testable? | ✅ Simple / well-known | Complex with builders available | Void methods with side-effects only |

### 3. Static Dependencies

| Check | Green | Yellow | Red |
|-------|:-----:|:------:|:---:|
| Static method calls? | ✅ None | 1-2 utility methods (can mockStatic) | Heavy static dependencies (e.g., all DB access via static) |
| Static state / singletons? | ✅ None | Read-only singletons | Mutable static state (test order dependency) |

### 4. External Dependencies

| Check | Green | Yellow | Red |
|-------|:-----:|:------:|:---:|
| File I/O / Network calls? | ✅ None (all injected) | Can mock via interface | Hardcoded `new File()` / `new URL()` in method body |
| Database access? | ✅ Via injected Repository | Via JdbcTemplate | Raw JDBC in method body |

### 5. Threading / Async

| Check | Green | Yellow | Red |
|-------|:-----:|:------:|:---:|
| Async operations? | ✅ None | CompletableFuture (mockable) | Raw Thread creation, Executors in method body |
| ThreadLocal usage? | ✅ None | ThreadLocal with clear() | ThreadLocal without cleanup (test leak) |

## Red-Level: What to Report

When DfT is Red, report to user:

```
## DfT Assessment: RED — Testability Issue

**Issue**: {specific problem, e.g., "ProductService calls ProductDAO.getInstance() — a static singleton"}
**Impact**: {why it can't be tested, e.g., "Cannot mock DAO behavior, test would require real database"}
**Options**:
1. Refactor ProductService to accept ProductDAO via constructor injection
2. Use PowerMock (if project already has it)
3. Defer testing to integration test level

**Recommendation**: {preferred option with rationale}
Waiting for your decision before proceeding.
```

## Yellow-Level: Mitigation Notes

For Yellow-level issues, document the extra steps needed:

```
## DfT Assessment: YELLOW — Extra Configuration Needed

- **Issue**: ProductFilter has 8 nested fields
- **Mitigation**: Use TestDataFactory.createFilter() from existing test utilities
- **Issue**: Static call to DateUtils.formatDate()
- **Mitigation**: Use Mockito.mockStatic(DateUtils.class) — requires mockito-inline
```

## Quick Score Card

```
DfT Score: ___/5 Green, ___/5 Yellow, ___/5 Red
Overall: Green / Yellow / Red
```
