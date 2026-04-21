# 2) The 6 Pillars of AI QA Testing

## Pillars

1. Functional Testing
2. Accuracy & Quality Testing
3. Robustness Testing
4. Performance Testing
5. Safety & Compliance
6. Regression Testing

```mermaid
flowchart LR
  P1[Functional] --> P2[Accuracy/Quality]
  P2 --> P3[Robustness]
  P3 --> P4[Performance]
  P4 --> P5[Safety/Compliance]
  P5 --> P6[Regression]
```

## Practical Checks

- Functional: edge cases, format handling, tool calls
- Quality: golden datasets + human preference + A/B
- Robustness: prompt injection, jailbreaks, OOD prompts
- Performance: p95 latency, throughput, soak/stress
- Safety: toxicity, bias, privacy, misinformation
- Regression: baseline diffs on every PR/deploy
