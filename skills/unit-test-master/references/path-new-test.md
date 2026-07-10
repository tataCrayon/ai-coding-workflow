# Path: Write New Test — Understand, Act, Verify

> This reference covers the complete flow for **writing new unit tests**.
> It includes three phases: Understand (deep context), Act (code generation + compilation verification), and Verify (intent-preserving validation + experience review).
> See the main `SKILL.md` for iron laws, intent routing, and core writing strategy.

---

## Phase 1: Understand — Deep Context Understanding

### Step 1: Engineering Context Probe (mandatory)

**Understanding goal** — must be able to answer:
- Where do test files go? What is the relationship between test modules and main code modules?
- What test framework does the project use? What mock framework?
- What test base classes exist? What capabilities do they provide?
- Are there shared TestDataBuilders or TestFixtures?

**Information sources** (pick as needed, fast path first):
- **Test convention assets** (fast path): Read the project's test convention file (e.g., `.notes/foundation/test-convention.md`). If it exists, get engineering conventions directly.
- **Probe existing tests**: Find 1 typical test file in the test directory, analyze its structure, base class, and mock approach.
- **Scan test base classes**: Search for `*BaseTest*` or test configuration files.

**Output**: The orchestrator organizes probe results as an "Engineering Context Anchor":

```markdown
## Engineering Context Anchor
- **Test directory structure**: `{path}`
- **Test framework**: `{framework}` (e.g., JUnit5 / pytest / Jest)
- **Mock framework**: `{mock_framework}` (e.g., Mockito / unittest.mock / Jest mock)
- **Test base class**: `{base_class}` (if any)
- **Data builders**: `{builder_class}` (if any), key methods: [...]
- **Same-domain test exemplar**: `{example_test_file}`
```

### Step 2: Business Context Understanding (mandatory)

**Understanding goal** — must be able to answer:
- What is the **business semantics** of the tested method? (Not "receives Request returns Response", but "validates user permissions and returns accessible resource list")
- What are the data structures and business meanings of key input parameters?
- What is the business meaning of the return value?
- What key external dependencies need to be mocked?

### Step 3: DfT (Design for Testability) Assessment

Evaluate testability of the tested code:
- Green **Directly testable**: method signature is clear, dependencies are injectable
- Yellow **Needs adaptation**: static method calls, needs special mock configuration
- Red **Not suitable for direct testing**: hardcoded external dependencies, un-mockable final classes — report the problem and wait for user decision

### Step 4: Strategy Design (mandatory — must declare before coding)

Before writing any test code, declare the test strategy:

```markdown
## Test Strategy
- **Tested method**: `{ClassName.method()}`
- **Business semantics**: {one-sentence description}
- **Case design**:
  | Case name | Covered path | Input characteristic | Expected behavior |
  |-----------|-------------|--------------------|------------------|
  | should_... | Normal path | ... | ... |
  | should_... | Exception path | ... | ... |
- **Mock strategy**: [dependencies to mock and their return values]
- **Test file path**: `{path}`
```

Key constraints:
- **Assertions verify business behavior** (e.g., verify calculation results, state transitions), not just `assertNotNull`
- **Mock data has business plausibility** (use business-reasonable values, not arbitrary numbers)
- **Explicitly declare test file path**: based on the engineering context anchor from Step 1
- **Wait for user confirmation**

---

## Phase 2: Act — Code Generation and Verification

### Spawn Generator Agent (inject complete context)

After user confirms strategy, spawn `generator-agent`, injecting "Engineering Context Anchor", "Business Context Summary", and "Deep Data Structure Analysis" into the agent prompt.

**Generator Agent responsibilities**:
- Read the anti-pattern quick reference (`references/generation-anti-patterns.md`)
- Write code following exemplar constraints
- **Based on Engineering Context Anchor**: create test file in the correct test directory and package path, inherit the correct test base class, reuse existing test data builders
- **Based on Business Context Summary**: test naming reflects business intent, assertions verify business behavior, mock data has business plausibility
- **Based on Deep Data Structure Analysis**: correctly construct nested objects, set field values layer by layer, avoid null pointers and type errors
- Execute `read_lints` for self-check

### Compilation Verification — Delegate to Verification Sub-Agent

> **Core idea**: The main dialog handles "thinking" (understanding, design, decisions); sub-agents handle "execution" (running, verifying, collecting results).

Use the `task` tool to spawn a **Verification Sub-Agent**, injecting: test file path, test module name, project root directory.

**Verification Sub-Agent responsibilities** (read-only + run tasks, must NOT modify any file):
1. Run `{test_command} --test={test class name}`
2. Wait for test completion (background run + polling mode)
3. Parse test report, extract structured error information
4. Return a structured verification report:

```markdown
## Verification Report
- **Compilation result**: Passed / Failed
- **Test run result**: All passed / N failures
- **Failure case list** (if any):
  - `method name`: error type | first line of error message
  - ...
- **Key error stack** (only on failure, max 10 lines per case)
```

**Main dialog routing after receiving verification report**:
- All passed -> enter Phase 3 (Verify)
- Has failures -> route to the "fix existing test" complexity logic (see `references/path-fix-test.md`)

---

## Phase 3: Verify — Intent Preservation Validation and Experience Review

> **Hard constraint: tests passing != process complete**. The orchestrator executes this phase itself.

### Step 1: Intent Preservation Validation (mandatory)

After fixing, the orchestrator must re-read the test code and confirm it still verifies the original business behavior.

**Known pitfalls**:
- Red alert **Assertion weakening**: changing a precise assertion to `assertNotNull` just to "make the test pass" — this is a warning signal, must explain to the user
- Red alert **Mock distortion**: newly added/modified mock return values do not fit the business scenario

### Step 2: Experience Review

Check if new problem-fixing experience should be captured into `.notes/` assets.

### Step 3: Output Verification Report

Output final test coverage and fix summary using the template, **must include intent preservation check results**.
