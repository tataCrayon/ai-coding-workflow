# Agent Observability
Span design, trace model, and cost attribution.
## Span Design
| Span | Parent | Attributes |
|------|--------|------------|
| agent.run | (root) | agent_name, prompt_version, session_id |
| llm.call | agent.run | model, input_tokens, output_tokens, cost |
| tool.call | agent.run | tool_name, parameters, duration_ms, status |
| tool.retry | tool.call | attempt, error, backoff_ms |
## Cost Attribution
Every LLM call must be tagged with agent.name, prompt.version, tool.name, cost.usd.
This enables: cost by agent, cost by prompt version, cost by tool.