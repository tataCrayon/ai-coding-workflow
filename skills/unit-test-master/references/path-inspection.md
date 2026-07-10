# Path: Inspection — Autopilot and Manual Inspection Flows

> This reference covers both **Autopilot** (fully automated scan-report-fix-verify) and **Manual** (scan-report then wait for user decision) inspection flows, plus the **Checkpoint Resume** mode.
> See the main `SKILL.md` for iron laws, intent routing, and core writing strategy.

---

## Phase 0A: Autopilot Inspection Mode

> **Applicable scenario**: User says "start test inspection", expecting one-trigger full automation.
> **Core idea**: Scan -> Report -> Fix -> Verify, fully automatic, zero manual breakpoints.
> **Context management**: Continuously assess context consumption during fixes; when insufficient, auto-archive and guide user to start new conversation.

### Complete Automation Flow

```text
User triggers Autopilot
    |
    v
Step 1: Default full scan (no need to ask scan mode)
    |
    v
Step 2: Parse test report
    |
    v
Step 3: Root cause clustering and priority sorting
    |
    v
Step 4: Generate inspection report file (persist to .agent/context/)
    |
    v
Step 5: Output inspection summary (concise version, not full report)
    |
    v
Step 6: [Auto flow] Read troubleshooting guide (hard constraint)
    |
    v
Step 7: [Auto flow] Fix item by item by priority
    |              |
    |              After fixing one item:
    |              - Update report status to completed
    |              - Assess remaining context capacity
    |              - Continue next / trigger re-scan / auto-archive
    |
    v
Step 8: All fixes complete -> re-scan verify -> output final report
    OR
Step 8: Context insufficient -> auto-archive to .agent/context/ -> prompt user to start new dialog with "continue fixing tests"
```

### Step 1-5: Scan and Report Generation

Execution logic is identical to "Phase 0 (Manual Mode)" Step 1-5, **including Step 2 background run + polling wait + completeness check**. Only differences:
- **Step 1 does not ask scan mode**, defaults to full scan (`{test_command}`)
- **Step 5 does not stop for user decision**, outputs summary then proceeds directly to Step 6

> **Hard constraint**: Autopilot mode must also execute Step 2b completeness check, ensuring all test classes have been run. If check reveals insufficient coverage (test report count significantly less than test class count), must report warning in summary, must not silently skip.

### Step 6: Load Troubleshooting Guide (hard constraint)

Before starting fixes, **must** read the troubleshooting guide:
1. Read the project's test troubleshooting guide (e.g., files under `.notes/patterns/troubleshooting/`)
2. Cache key entries in current context for subsequent fix comparison

### Step 7: Fix Item by Item Automatically by Priority

Execute fixes in P0 -> P1 -> P2 -> P3 priority order:

#### 7a. Fix Routing (reuse existing complexity分流 logic)

For each fix item, select fix path per these rules:

| Condition | Route |
|-----------|-------|
| <=2 errors AND error type clear AND single-file change | Green **Inline Fix** (main dialog direct fix) |
| >=3 errors OR involves framework context/mock config/multi-file linkage | Yellow **Delegated Fix** (spawn fix sub-agent) |

#### 7b. Update Report After Fix

After each item is fixed:
1. Update inspection report item status: `- [ ]` -> `- [x]`, `pending` -> `completed`
2. Record fix time and notes

#### 7c. Trigger Re-scan After P0 Fixes

When all P0 (infrastructure issues) fixes are complete:
1. **Auto re-run** `{test_command}`
2. Re-parse test report
3. Compare pre/post fix failure count, identify **P2/P3 items that auto-resolved due to P0 fix**
4. Update inspection report: auto-resolved items marked `auto-resolved`
5. Output incremental summary: `"After P0 fix re-scan: originally Z failures -> remaining Z', auto-resolved N"`
6. Continue fixing remaining items

#### 7d. Context Capacity Assessment and Auto-archive

After every **3 items fixed**, or when sensing context is about to run out:
1. Assess current dialog's context consumption
2. If context is sufficient -> continue fixing next item
3. If context is about to run out -> execute auto-archive:
   - Update inspection report's "Checkpoint Info" section, record current progress
   - Output to user:
     ```
     Context is about to run out, fix progress has been auto-archived.
     Report file: .agent/context/{date}_test-inspection-report_{scope}.md
     Current progress: X/Y items fixed
     Please start a new dialog and enter "continue fixing tests" to resume from checkpoint.
     ```

### Step 8: Completion Verification

When all fix items are processed:
1. **Final verification scan**: re-run `{test_command}`
2. Parse results, confirm whether any failures remain
3. Update inspection report status to "Completed" or "Partially Completed"
4. Output final summary:
   ```
   Test inspection complete
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total fix items: Y | Fixed: X | Auto-resolved: N | Skipped: S
   Final test result: All passed / Still K failures
   Full report: .agent/context/{date}_test-inspection-report_{scope}.md
   ```

---

## Phase 0B: Checkpoint Resume Mode

> **Applicable scenario**: User says "continue fixing tests" in a new dialog, resuming from last breakpoint.

### Execution Steps

1. Scan `.agent/context/` to find the latest test inspection report file (sorted by date)
2. Read report, parse "Checkpoint Info" and "Fix Progress"
3. Locate the first `pending` status fix item
4. Read troubleshooting guide (hard constraint)
5. Resume fixing from checkpoint, same flow as Autopilot Step 7
6. When fix complete or context insufficient, handle per Step 7d/Step 8 logic

---

## Phase 0 (Manual Mode): Full Inspection and Task Spawning

> **Applicable scenario**: User wants to see report first before deciding to fix, or just wants to scan without fixing.
> **Difference from Autopilot**: Generates report then **stops and waits for user decision**, does not auto-enter fix flow.

### Step 1: Determine Scan Scope

Ask user to choose scan mode:

| Mode | Applicable scenario | Execution method |
|------|--------------------|-----------------|
| **Full scan** | First inspection, major version verification | `{test_command}` |
| **Incremental scan** | Daily dev, PR submission prep | First `git diff --name-only HEAD~1` extract changed files, derive associated test classes, run only those tests |
| **Module scan** | Focus on specific module | `{test_command} --module {module}` or equivalent command |

### Step 2: Execute Scan and Parse Structured Report

#### 2a. Execute Tests (background run + polling wait)

> **Hard constraint: full test runs may take minutes. Never rely on a single process call timeout to determine whether tests are complete.**

**Execution strategy**: Use background run + polling mode, ensure tests **actually complete**:

```bash
# Step 2a-1: Start tests in background, redirect output to temp file
cd {project root} && {test_command} > /tmp/test-output.log 2>&1 &
echo "Test PID: $!"
```

Use `run_command` (`wait=false`) for background start.

```bash
# Step 2a-2: Poll whether tests are complete (check every 30 seconds)
tail -5 /tmp/test-output.log
```

Use `read-process` or `run_command` to poll, **until any of these conditions is met**:
- Log tail shows test framework completion markers (e.g., `BUILD SUCCESS`/`BUILD FAILURE`, `Tests: X passed`)
- Process has exited (check via `ps` or process status)
- Polling exceeds **10 minutes** (timeout protection, output warning and continue with available partial report)

#### 2b. Completeness Check (mandatory)

After tests finish, **must execute these checks** to ensure tests actually all ran:

```bash
# Check 1: Confirm test framework exited normally
tail -20 /tmp/test-output.log | grep -E "{completion marker regex}"

# Check 2: Count test report files (= actual test classes run)
find . -path "*/{test_report_dir}/*.xml" | wc -l

# Check 3: Count project test class total (for comparison)
find . -path "*/test*" -name "*Test.*" -o -name "*_test.*" | wc -l
```

**Check rules**:
- If test framework did not exit normally (no completion marker) -> **Report anomaly**, prompt user to check environment
- If test report count **significantly less than** test class count (gap >30%) -> **Report warning**, some modules may have been skipped
- If a module's test report directory does not exist -> **Report that module was not run**

**Check result output** (included in inspection summary):
```
Completeness Check:
- Test exit status: {status}
- Test report count: {N} | Test class total: {M}
- Coverage: {percent}% ({diff} test classes did not generate reports)
- Module coverage: {status}
```

#### 2c. Parse Structured Test Report

**Do not rely on grep on console logs**. Parse the test framework's **structured reports** (e.g., JUnit XML, pytest JSON, etc.):

For each report file containing failures, extract structured info:
- **Test class/file name**: file or class the test is in
- **Failed method/case name**: specific failed test function
- **Error type**: exception type (e.g., `NullPointerException`, `AssertionError`)
- **Error message**: error info (only first line, to avoid massive stacks polluting context)
- **Duration**: test execution time

> **Note**: Must traverse **all** failed report files, never stop after reading just a few. If failed report file count is large (>10), use sub-agents to parse concurrently to avoid main dialog context explosion.

### Step 3: Root Cause Clustering and Priority Sorting

#### 3a. Root Cause Clustering

Cluster all failures by **error type + error message similarity**, avoid generating duplicate tasks for the same root cause:

| Cluster type | Identification rule | Task granularity |
|-------------|--------------------|-----------------|
| **Infrastructure failure** | Application context load failure, datasource connection exception, dependency injection failure | Aggregate entire error type into **1 task** |
| **Compilation error** | Method signature mismatch, class not found, import missing | Same tested class compilation errors aggregate into **1 task** |
| **Same-cause runtime error** | Same Exception type + similar Message (e.g., same NPE location) | Aggregate into **1 task**, list all affected cases |
| **Independent assertion failure** | AssertionError, each case has different expected/actual | Each case **independent 1 task** |

#### 3b. Priority Sorting

Order tasks so that **fixing one may resolve a batch** comes first:

1. Red **P0 - Infrastructure issues**: application context, datasource, dependency injection, etc. (widest impact)
2. Orange **P1 - Compilation errors**: method signature changes, class missing, etc. (usually cascade from interface changes)
3. Yellow **P2 - Same-cause runtime errors**: same exception causing multiple case failures
4. Green **P3 - Independent assertion failures**: single case business logic assertion not passing

### Step 4: Generate Inspection Report File

Generate **one** structured inspection report file to `.agent/context/`, using **Checklist progressive fix** mode:

**File name**: `{YYYYMMDD}_test-inspection-report_{scope}.md`

**Report template**:

```markdown
# Test Inspection Report
- **Scan time**: YYYY-MM-DD HH:MM
- **Scan scope**: [Full / Incremental / Module]
- **Status**: In Progress | Completed

## Inspection Summary
- Test class total: {N}
- Passed: {P} | Failed: {F} | Skipped: {S}
- Fix task count: {T} (P0:{a} P1:{b} P2:{c} P3:{d})

## Completeness Check
{Check results}

## Fix Checklist

### P0 - Infrastructure Issues
- [ ] **TASK-001** pending: {problem description}
  - Affected cases: {N}
  - Error type: {type}
  - Error message: {message}

### P1 - Compilation Errors
- [ ] **TASK-002** pending: {problem description}
  - Involved files: {file paths}
  - Error details: {details}

### P2 - Same-cause Runtime Errors
...

### P3 - Independent Assertion Failures
...

## Checkpoint Info
- **Last checkpoint**: {current progress description}
- **Fixed**: {N}/{Total}
```

### Step 5: Output Inspection Summary

Show user a concise summary (not the full report), including:
- Failure count statistics (by priority distribution)
- Suggested fix strategy
- Guide user choice: fix item by item / full auto-fix (Autopilot) / export report
