# Test Generation Anti-Patterns Quick Reference

> Common patterns that produce low-quality tests. Read before generating or fixing any test code.

## Critical Anti-Patterns (Test Is Worthless)

### AP-1: Assert-Nothing
```java
// ❌ WRONG — test passes but verifies nothing
@Test
void shouldProcessOrder() {
    orderService.process(order);
    // No assertions at all
}

// ✅ RIGHT
@Test
void shouldSetOrderStatusToConfirmed_whenPaymentSucceeds() {
    orderService.process(order);
    assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
}
```
**Rule**: Every test must have at least one meaningful assertion on business state.

### AP-2: Tautological Assertions
```java
// ❌ WRONG — assertion repeats the setup
when(repo.findById(1L)).thenReturn(Optional.of(product));
Product result = service.getProduct(1L);
assertThat(result).isEqualTo(product);  // Of course it is — we mocked it

// ✅ RIGHT — verify the business transformation
assertThat(result.getDisplayPrice())
    .isEqualTo(product.getBasePrice().multiply(taxRate));
```
**Rule**: Assertions must verify business logic, not mock return values.

### AP-3: Mock-Everything
```java
// ❌ WRONG — every single dependency mocked, test is fragile and meaningless
@Mock ProductRepository repo;
@Mock PriceCalculator calc;
@Mock TaxService tax;
@Mock NotificationService notify;
@Mock AuditLogger audit;
@Mock CacheManager cache;
// ... 12 more mocks

// ✅ RIGHT — mock only external boundaries, use real value objects
@Mock ProductRepository repo;  // external DB
@Mock TaxService tax;          // external HTTP
// ProductFilter, Price, etc. are value objects — use real instances
```
**Rule**: Mock external boundaries (DB, HTTP, MQ). Use real value objects and domain types.

### AP-4: No-Edge-Cases
```java
// ❌ WRONG — only happy path
@Test void shouldCreateOrder() { ... }  // happy path only

// ✅ RIGHT — cover boundaries
@Test void shouldCreateOrder_whenValidRequest() { ... }
@Test void shouldThrowException_whenQuantityIsZero() { ... }
@Test void shouldThrowException_whenProductNotFound() { ... }
@Test void shouldApplyDiscount_whenBulkOrder() { ... }
```
**Rule**: At minimum: 1 happy path + 1 error path + 1 boundary case.

### AP-5: Generic Naming
```java
// ❌ WRONG — generic names that don't explain what's being tested
@Test void test1() { ... }
@Test void testCreate() { ... }
@Test void testProcess() { ... }

// ✅ RIGHT — names explain behavior and condition
@Test void shouldReturnActiveProductsOnly_whenFilterByStatus() { ... }
@Test void shouldThrowNotFoundException_whenProductIdNotExist() { ... }
```
**Rule**: Follow `should_{expected_behavior}_when_{condition}` naming convention.

### AP-6: Repetitive Structure
```java
// ❌ WRONG — 5 nearly-identical test methods for 5 input values
@Test void shouldValidatePrice_when100() { ... }
@Test void shouldValidatePrice_when200() { ... }
@Test void shouldValidatePrice_whenZero() { ... }
@Test void shouldValidatePrice_whenNegative() { ... }
@Test void shouldValidatePrice_whenMaxValue() { ... }

// ✅ RIGHT — parameterized test
@ParameterizedTest
@CsvSource({"100, true", "200, true", "0, false", "-1, false", "999999, false"})
void shouldValidatePriceCorrectly(long price, boolean expected) {
    assertThat(validator.isValid(price)).isEqualTo(expected);
}
```
**Rule**: >2 cases with same structure → parameterized test.

## Warning Anti-Patterns (Test Is Fragile)

### AP-7: Over-Specified Mocks
```java
// ❌ WRONG — specifies exact argument values that don't matter
verify(repo).save(argThat(p -> p.getName().equals("test") && p.getPrice().equals(BigDecimal.TEN)));

// ✅ RIGHT — verify the interaction happened, not exact values
verify(repo).save(any(Product.class));
// If you need to check what was saved, use ArgumentCaptor
```
**Rule**: Use `any()` by default. Only use argument matchers to verify business-critical values.

### AP-8: Hidden Test Data
```java
// ❌ WRONG — shared mutable state between tests
private static Product sharedProduct = new Product("test", BigDecimal.TEN);

@Test void test1() { sharedProduct.setPrice(BigDecimal.ONE); ... }
@Test void test2() { ... /* depends on sharedProduct state from test1 */ }

// ✅ RIGHT — each test creates its own data
@Test void shouldApplyDiscount() {
    Product product = TestDataFactory.createProduct(price: BigDecimal.TEN);
    ...
}
```
**Rule**: No shared mutable state. Use factory methods for common data.

### AP-9: Sleeping in Tests
```java
// ❌ WRONG — Thread.sleep makes tests slow and flaky
service.submitAsync(task);
Thread.sleep(1000);
assertThat(task.isDone()).isTrue();

// ✅ RIGHT — use Awaitility or synchronous test doubles
service.submitAsync(task);
await().atMost(2, SECONDS).until(() -> task.isDone());
```
**Rule**: Never use `Thread.sleep()`. Use Awaitility or synchronous alternatives.

### AP-10: Testing Framework Instead of Code
```java
// ❌ WRONG — testing that Mockito works
when(repo.findById(1L)).thenReturn(Optional.of(product));
assertThat(repo.findById(1L)).isPresent();  // Testing the mock, not the service

// ✅ RIGHT — test your code
ProductDTO result = service.getProductDetail(1L);
assertThat(result.getName()).isEqualTo(product.getName());
```
**Rule**: Don't assert on mock setups. Assert on the result of calling YOUR code.

## Quick Pre-Code Check

Before writing any test, ask:
1. ❓ What business behavior am I verifying? (Not "what method am I calling?")
2. ❓ Will my assertions fail if the business logic is wrong? (Not just if the mock setup is wrong)
3. ❓ Am I testing at least one edge case / error path?
4. ❓ Can other developers understand the intent from the test name alone?
