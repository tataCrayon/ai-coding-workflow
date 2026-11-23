# Tool Calling
Tool schema design and error recovery patterns.
## Error Recovery Patterns
Every tool must define 4 outcomes:
| Outcome | Signal | Recovery |
|---------|--------|----------|
| Success | Returns expected data | Normal flow |
| Partial | Returns partial data + warning | Flag to agent, continue |
| Retryable | Network timeout, rate limit | Retry with backoff (max 3) |
| Terminal | Invalid input, auth failure | Abort, report error to agent |
## Orchestration Principles
1. Tools are single-responsibility: one tool, one job.
2. Tool chains must have circuit breaker: max N consecutive failures before abort.
3. Tool output must be structured (JSON), not free text.
4. Every tool call logged with latency, token cost, and result status.