# Code Review Checklist Template

```markdown
## Code Review Checklist

**Review Target**: `UserService.findById()`

### Dimension 0: Design Taste
- Overall impression: [Elegant/Adequate/Needs Improvement]
- Best design to learn from: [If any]
- Worst code smell to fix: [If any]

### Dimension 1: Code Quality
- ✅ Function Design: Single responsibility, nesting 1 level
- ✅ Class Design: 450 lines, 15 methods
- ✅ Naming Convention: Variable names meaningful
- ✅ Code Reuse: Reuses `UserRepository.findById()`
- ✅ Exception Handling: Catch block has log + stacktrace
- ⚠️ Needs Sync Changes: No

### Dimension 2: Readability
- ✅ Comment Quality: Comments accurate
- ✅ Logic Clarity: Logic clear
- ✅ Magic Values: Uses constants
- ✅ Code Format: Follows project style
- ✅ TODO/FIXME: No TODO comments
- ⚠️ Needs Sync Changes: No

### Dimension 3: Maintainability
- ✅ Dependency Injection: External dependencies injected
- ✅ Interface Abstraction: Uses interfaces for dependencies
- ✅ Global State: No global state
- ✅ Configuration Externalization: Config externalized
- ✅ Logging Completeness: Key paths logged, using placeholder format
- ⚠️ Needs Sync Changes: No

### Dimension 4: Security
- ✅ PII Desensitization: No PII
- ✅ Injection Prevention: Uses parameterized query
- ✅ Idempotency: Has idempotency key
- ✅ Permission Check: Has permission check
- ✅ Financial/High-risk Operations: Not involved
- ⚠️ Needs Sync Changes: No

### Dimension 5: Performance
- ✅ N+1 Queries: Uses batch query
- ✅ Large Transactions: Transaction duration < 1s
- ✅ Memory Leaks: Resource properly closed
- ✅ Cache Usage: Reasonable cache usage
- ✅ Batch Operations: Uses batch insert
- ⚠️ Needs Sync Changes: No

### Dimension 6: Test Coverage
- ✅ Unit Tests: Has unit tests
- ✅ Test Coverage: Line coverage 85%, branch coverage 75%
- ✅ Mock Configuration: External dependencies Mocked
- ✅ Boundary Tests: Has boundary tests
- ✅ Exception Tests: Has exception tests
- ⚠️ Needs Sync Changes: No

---

## Review Conclusion
- 🟢 Pass: Code quality excellent, ready to submit

## Review Suggestions
None
```
