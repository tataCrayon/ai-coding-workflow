# Violation Detection Checklist

> This reference lists all violations that the orchestrator must check during the unit test workflow.
> See the main `SKILL.md` for iron laws, intent routing, and core writing strategy.

---

## Context-First Violations

- Skipping engineering context probe when writing new tests
- Skipping business context understanding when writing new tests
- Skipping deep data structure analysis when writing new tests
- Placing test files in wrong directory (typical consequence of not probing engineering conventions)
- Skipping engineering context awareness when fixing tests
- Not understanding the test's original intent when fixing tests
- Not declaring fix strategy when fixing tests
- Not executing intent preservation validation after fix is complete
- Weakening assertions to make test pass without warning the user

## Test Isolation Violations

- Modifying code in non-test directories
- Modifying dependency config files or introducing new dependencies
- Modifying test infrastructure without explicit authorization
- Modifying tested code when DfT assessment was rated Red

## Process Violations

- Skipping DfT assessment when writing new tests
- Writing test code directly without spawning research Agent
- Generator Agent not reading anti-pattern quick reference
- Fixing tests without reading troubleshooting guide first
- Inline Fix exceeding 3 rounds without escalating to Delegated Fix
- Not executing experience review after process ends
- Running tests in main dialog for compilation verification instead of delegating to Verification Sub-Agent

## Inspection Violations

- Finding failed cases after full inspection but not generating task file
- Not updating inspection report status after fixing an item in Autopilot mode
- Context about to run out in Autopilot mode but continuing to fix without auto-archiving
- Not triggering re-scan verification after all P0 fixes in Autopilot mode
- Parsing test report before tests have actually finished
- Generating inspection report without executing completeness check
- Test report count significantly less than test class count but not reporting warning
