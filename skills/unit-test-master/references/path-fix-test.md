# Path: Fix Existing Test — Understand, Plan, Act

> This reference covers the complete flow for **fixing existing failing tests**.
> It includes three phases: Understand (test intent + error context), Plan (declare fix strategy), and Act (route and execute fix).
> See the main `SKILL.md` for iron laws, intent routing, and core writing strategy.

---

## Phase 1: Understand — Understand Test Intent and Tested Context

> **Core idea**: Fixing a test is not "change until it compiles", but "understand the test's original intent, then make it correctly verify business behavior again".

### Step 1: Engineering Context Awareness (orchestrator executes, mandatory)

Same as writing new test Step 1 — understand test base class capabilities, same-domain paradigms.

**Output**: "Engineering Context Anchor (Fix Version)"

### Step 2: Understand Test Intent (orchestrator executes, mandatory)

**Understanding goal** — must be able to answer:
- What **business behavior** does this test intend to verify?
- Has the tested method's signature/structure/logic changed?
- Which root cause category does the error belong to?

**Error Root Cause Classification Table** (routing map):

| Category | Characteristics | Fix Direction |
|----------|----------------|--------------|
| **Test code outdated** | Tested class signature/structure changed, test not updated | Update test code to adapt to new signature/structure, while preserving original business verification intent |
| **Test data construction error** | Mock objects or test data nested structure is incorrect | Deep-analyze object structure, fix data construction layer by layer. **Check first whether existing construction methods can be reused** |
| **Test logic error** | The test's own Given/When/Then was written wrong | Redesign test logic based on the tested method's business intent. **Reference same-domain test paradigm** |
| **Environment/infrastructure issue** | Application context, dependency injection, config loading, etc. | Fix infrastructure issues per troubleshooting guide. **Check whether test base class config is correctly inherited** |

### Step 3: Collect Error Information

Get the test failure error information (source: user-provided / `read_lints` / test run output / test report)

### Step 4: Read Troubleshooting Guide (hard constraint, mandatory)
1. Read the project's test troubleshooting guide
2. **Compare current error information with troubleshooting guide entries one by one**
3. Output match results: which problem matched / no known problem matched

### Step 5: Complexity Assessment and Routing Decision

| Condition | Route | Explanation |
|-----------|-------|-------------|
| <=2 errors AND error type clear AND single-file change | Green **Inline Fix** | Missing import, method signature change, simple mock completion |
| >=3 errors OR involves framework context/mock config/multi-file linkage | Yellow **Delegated Fix** | Dependency injection failure, test base class restructuring, etc. |
| >=3 test classes failing | Red **Batch Fix** | Bulk failures, need root cause clustering then fix item by item |

---

## Phase 2: Plan + Act — Declare Fix Strategy and Execute

### Plan: Declare Fix Strategy (mandatory)

```markdown
## Fix Strategy
### Fix Direction
- **Error category**: [from Phase 1 judgment]
- **Fix plan**: [specific fix plan — if troubleshooting guide matched, cite guide solution]
- **Intent preservation commitment**: After fix, this test will still verify [original business behavior]
### Verification Method
- [verification plan]
```

### Act: Route Fix

#### Green Inline Fix (main dialog direct fix)

1. Based on troubleshooting guide match results and test intent summary, determine fix strategy
2. If error category is "test data construction error", **must deep-analyze object structure first**
3. Execute fix, use `read_lints` to verify compilation
4. **Spawn Verification Sub-Agent** to run test and collect structured results
5. Max 3 fix rounds; exceed this -> escalate to Delegated Fix

**Constraint**: Follow "Test Isolation Iron Laws" from main `SKILL.md`

#### Yellow Delegated Fix (spawn Fix Agent)

Use the `task` tool to spawn a fix Agent, injecting: engineering context anchor, test fix context summary, troubleshooting guide match results.

**Fix Agent responsibilities**:
- Understand original business intent based on test intent summary
- Diagnose item by item -> fix
- Follow "Test Isolation Iron Laws"
- After fix, spawn Verification Sub-Agent to run test and verify
- Max 5 fix rounds
- Output fix report (with experience capture suggestions)

#### Red Batch Fix (transition to Phase 0)

Jump directly to "Phase 0: Full Inspection & Task Spawning" (see `references/path-inspection.md`), execute root cause clustering and priority sorting, then fix item by item.
