# Best-Practice Awareness Detail — Templates, Strategies, and Procedures

> Deep-reference for `SKILL.md`. Use during implementation for each awareness area.

---

## 1. Logging Strategy

| Layer | Level | When | Content |
|-------|-------|------|---------|
| Controller | INFO | Request/Response | method + path + key params (desensitized); status + duration |
| Service | INFO | Entry/Exit | operation name + key identifiers; result + duration |
| Service | DEBUG | Branch | condition result + context at if/switch |
| Service | WARN | Before BizException | what failed + why + business identifiers |
| Service | ERROR | Before SystemException | exception class + message + traceId + stack (first 5 lines) |
| Mapper/DAO | DEBUG | After SQL | table + operation type + row count |

Format: `log.info("OrderService.createOrder exit, orderId={}, duration={}ms", orderId, duration);`

Violations: silent catch; critical path with no log; sensitive data (password/token/PII) in content.

---

## 2. Exception Handling

| Type | When | Class | Handling |
|------|------|-------|----------|
| Business | Invalid input, rule violation | `BizException` | GlobalExceptionHandler -> structured error + WARN |
| System | Network/DB failure, unexpected | `SystemException` | GlobalExceptionHandler -> generic error + ERROR + alert |

BizException: `throw new BizException(ErrorCode.STOCK_INSUFFICIENT, "库存不足");` — log.warn before throw.
SystemException: wrap cause — `throw new SystemException(ErrorCode.REMOTE_SERVICE_ERROR, "外部服务调用失败", e);` — log.error before throw.

Anti-patterns: `catch(e){}` silent catch; `log.error(e.getMessage())` missing context+stack; business errors as raw RuntimeException; duplicate catch blocks.

---

## 3. Monitoring and Metrics

| Category | Metric | Point |
|----------|--------|-------|
| Timing | Method duration | Service: `log.info("duration={}ms")` or Micrometer Timer |
| Error rate | BizException per error code | GlobalExceptionHandler counter |
| Throughput | Request count per endpoint | Controller/filter counter |
| Resource | DB query count, external call count | Mapper/DAO layer |

上报: `log.info` (lightweight) / Micrometer Timer/Counter (if Prometheus) / Custom SDK (if project has one). Placeholder: `// TODO-METRICS: 上报 duration, key=order.create.duration`

Alerts: duration P99>3s WARN; BizException rate >5%/5min WARN; SystemException >1%/5min CRITICAL; external failure >2/10min CRITICAL.

---

## 4. Defensive Programming

| Item | Pattern |
|------|---------|
| Validation | `@Validated` + group on DTO; manual validate in Service internal |
| Null protection | Never return null collections — `Collections.emptyList()`; Optional for single values |
| Idempotent | Key on write endpoints; `if (exists) { log.info("Duplicate"); return existing; }` |
| Boundary | Pagination: page>=1, size [1,100]; date range validation |
| Sanitization | Parameterized queries always; validate string format before DB |

---

## 5. Observability

Trace: HTTP entry -> MDC.put("traceId", id); downstream -> header X-Trace-Id; async/MQ -> embed in payload; log pattern -> `%X{traceId}`.

Timing: `long start = System.currentTimeMillis(); try { ... } finally { log.info("duration={}ms, traceId={}", System.currentTimeMillis()-start, MDC.get("traceId")); }`

State snapshot: At branch decisions, log the state that determined the path — `log.debug/warn("Payment result, orderId={}, success={}, errorCode={}, traceId={}", ...)`

---

## 6. Tech-Stack Detection Procedure

| Target | File | Extract |
|--------|------|---------|
| Build | pom.xml/build.gradle | Java/Spring Boot version, key dependencies |
| Architecture | src/main/java/** | Layer pattern, naming, DTO/VO layering |
| Sample code | 1 Controller + 1 Service + 1 Mapper | Response wrapper, exception, logging, method naming |
| Config | application.yml | DB/middleware config |
| Constants | **/constant/ / **/enums/ | Enum naming, constant organization |

Output Tech-Stack Summary (Build, Architecture, Conventions, Style). Ask: "Correct? Confirm / Supplement." No coding until confirmed.

---

## 7. Coding Task Plan Output Format

```markdown
## Coding Task Plan
Context: US source, Changepoints, DB design (file paths)

| # | US ID | Title | Changepoints | Files | Depends | Best-Practice Focus |
|---|-------|-------|-------------|-------|---------|---------------------|
| 1 | US-01 | Create order | CP-US01-01 | 4 | - | Logging+Idempotent+Trace |
| 2 | US-02 | Payment | CP-US02-01 | 3 | US-01 | Exception+Monitoring+Timing |

Execution order: dependency graph; best-practice focus annotated per US.
```
