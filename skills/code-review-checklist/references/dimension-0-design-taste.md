# Dimension 0: Design Taste (Design Taste)

> **Core Idea**: This is what separates "mechanical checking" from "a tasteful Review".
> An experienced Reviewer's first reaction is not counting lines or checking nesting — it's **feeling whether the code "reads comfortably"**.

**Iron Law**: Code should make readers think "this was written by an engineer with taste." If the first impression after reading is "it works but feels awkward," there's a design taste problem.

---

## Check Items

### 1. Abstraction Level Consistency (SLAP)

Are statements within the same method at the same abstraction level? Is high-level orchestration mixed with low-level details?

### 2. Code Smell Identification

| Smell | Description | Example |
|-------|-------------|---------|
| Feature Envy | Method heavily accesses another object's fields | `ReportService.buildReport()` accessing many `Order` fields |
| Primitive Obsession | Using primitive types for business concepts | `String` representing order status |
| Long Parameter List | Method parameters > 3 | `create(name, type, status, priority, owner)` |
| God Method | Method exceeds 20 lines | A 50-line `process()` method |
| Magic Number | Bare numbers without named constants | `if (status == 3)` |
| Data Clump | Same set of parameters always passed together | `(userId, userName, userEmail)` in 5 methods |

### 3. SOLID Principle Compliance

| Principle | Question |
|-----------|----------|
| Single Responsibility | Does the class/method have only one reason to change? |
| Open/Closed | Is new functionality added by extension rather than modification? |
| Dependency Inversion | Does it depend on abstractions rather than concrete implementations? |

---

## Output Template

```
□ Abstraction Level Consistency:
  - `OrderService.placeOrder()`: ✅ Method body is clear flow orchestration, each step at same abstraction level
  - `OrderService.process()`: ❌ Param validation, field copying, business logic mixed → Split by abstraction level
□ Code Smells:
  - Feature Envy: ✅ None / ❌ `ReportService.buildReport()` heavily accesses `Order` fields
  - Primitive Obsession: ✅ None / ❌ Using String for order status
  - Magic Number: ✅ None / ❌ `if (retryCount > 3)` → Extract as `MAX_RETRY_ATTEMPTS`
□ SOLID Principles:
  - Single Responsibility: ✅ / ❌ `OrderService` handles both validation and persistence
  - Open/Closed: ✅ Extended / ❌ if-else stacking for product differences
□ Needs Sync Changes: Yes/No
```
