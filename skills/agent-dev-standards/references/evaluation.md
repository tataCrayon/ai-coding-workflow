# Evaluation
Golden test structure and CI integration.
## Evaluation Dimensions
| Dimension | What it measures | Target |
|-----------|-----------------|--------|
| Tool Selection | Agent picks the right tool for the task | >= 90% |
| Parameter Accuracy | Tool call parameters are correct | >= 95% |
| Chain Completion | Multi-step task completes without hang | >= 85% |
| Error Recovery | Agent recovers from tool failures gracefully | >= 80% |
| Output Quality | Final output meets requirements | >= 85% |
## CI Integration
1. Run golden suite on every prompt/tool change.
2. Compare scores against baseline (stored in registry).
3. Block merge if any dimension drops below threshold.
4. Generate diff report.