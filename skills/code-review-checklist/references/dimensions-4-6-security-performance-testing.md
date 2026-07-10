# Dimensions 4-6: Security + Performance + Test Coverage

---

## Dimension 4: Security

**Iron Law**: PII must be desensitized, queries must use parameterized methods, interfaces must be idempotent, sensitive operations must have permission checks.

### Check Items

| Item | Standard |
|------|----------|
| PII Desensitization | Are phone numbers, ID numbers, bank card numbers and other sensitive info desensitized? |
| Injection Prevention | Using parameterized queries (Prepared Statement / ORM parameter binding) not string concatenation? |
| Idempotency | Will repeated interface calls cause problems? |
| Permission Check | Is there a permission check mechanism? |
| Financial/High-risk Operations | Does it involve financial or high-risk operations? Need secondary confirmation or approval? |

### Output Template

```
□ PII Desensitization:
  - `UserService.findById()`: Log contains phone number → Desensitize
  - `UserService.updateProfile()`: Returns ID number → Desensitize
□ Injection Prevention:
  - `UserRepository.findByName()`: ✅ Uses parameterized query
  - `UserRepository.search()`: ❌ Uses string concatenation for query → Change to parameterized query
□ Idempotency:
  - `OrderController.create()`: ✅ Has idempotency key
  - `OrderController.update()`: ❌ No idempotency protection
□ Permission Check:
  - `UserController.getProfile()`: ✅ Has permission check
  - `UserController.updateProfile()`: ❌ No permission check
□ Financial/High-risk Operations:
  - Involves financial/high-risk operations: No
  - Needs secondary confirmation or approval: No
□ Needs Sync Changes: Yes/No
```

---

## Dimension 5: Performance

**Iron Law**: Avoid N+1 queries, avoid large transactions, avoid memory leaks.

**Goal**: Are there obvious performance bottlenecks? Is database access, transaction scope, and resource management reasonable?

### Check Items

| Item | Standard |
|------|----------|
| N+1 Queries | Are there loop-based queries? |
| Large Transactions | Is transaction too long? Needs splitting? |
| Memory Leaks | Are resources properly closed? |
| Cache Usage | Is caching used reasonably? |
| Batch Operations | Are batch operations used? |

### Output Template

```
□ N+1 Queries:
  - `OrderService.listWithDetails()`: ✅ Uses batch query
  - `OrderService.exportAll()`: ❌ Loop query → Optimize to batch
□ Large Transactions:
  - `OrderService.checkout()`: ✅ Transaction duration < 1s
  - `OrderService.batchImport()`: ⚠️ Transaction duration > 5s → Split
□ Memory Leaks:
  - `FileService.readFile()`: ✅ Resource properly closed
  - `FileService.processStream()`: ⚠️ Stream not closed → Fix
□ Cache Usage:
  - `UserService.findById()`: ✅ Uses cache
  - `UserService.updateProfile()`: ⚠️ Cache not invalidated → Add cache invalidation
□ Batch Operations:
  - `OrderService.batchCreate()`: ✅ Uses batch insert
  - `OrderService.syncAll()`: ❌ Single-row insert → Optimize to batch
□ Needs Sync Changes: Yes/No
```

---

## Dimension 6: Test Coverage

**Iron Law**: Core business logic must have tests, coverage >= 80%.

**Goal**: Is core business logic adequately tested? Are boundary and exception scenarios verified?

### Check Items

| Item | Standard |
|------|----------|
| Unit Tests | Do core methods have unit tests? |
| Test Coverage | Line coverage >= 80%, branch coverage >= 70%? |
| Mock Configuration | Are external dependencies Mocked? |
| Boundary Tests | Are boundary values tested? |
| Exception Tests | Are exception scenarios tested? |

### Output Template

```
□ Unit Tests:
  - `UserService.java`: ✅ Has unit tests
  - `UserController.java`: ❌ No unit tests → Add
□ Test Coverage:
  - `UserService.java`: ✅ Line coverage 85%, branch coverage 75%
  - `UserController.java`: ⚠️ Line coverage 60% → Supplement
□ Mock Configuration:
  - `UserServiceTest.java`: ✅ External dependencies Mocked
  - `UserControllerTest.java`: ⚠️ External RPC call not Mocked → Add
□ Boundary Tests:
  - `UserServiceTest.java`: ✅ Has boundary tests
  - `UserControllerTest.java`: ❌ No boundary tests → Add
□ Exception Tests:
  - `UserServiceTest.java`: ✅ Has exception tests
  - `UserControllerTest.java`: ❌ No exception tests → Add
□ Needs Sync Changes: Yes/No
```
