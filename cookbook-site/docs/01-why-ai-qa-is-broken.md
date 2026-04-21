# 1) Why AI QA is Broken

AI QA is fundamentally different from traditional software QA because model outputs are **probabilistic**, not deterministic.

## AI Accountability Gap

Traditional systems: same input → same output.  
LLM systems: same input can produce multiple valid outputs, including unsafe ones.

```mermaid
flowchart LR
  T1[Input] --> T2[Traditional Logic]
  T2 --> T3[Deterministic Output ✅]

  A1[Input] --> A2[LLM]
  A2 --> A3[Task Completion ✅]
  A2 --> A4[Hallucination ⚠️]
  A2 --> A5[Toxic Output ❌]
  A2 --> A6[Security Risk ❌]
```

## Paradigm Shift

- Output Nature: Predictable → Stochastic
- Metric: Pass/Fail → Multi-metric (quality, safety, latency, cost)
- Debugging: Code-only → Prompt/context/retrieval/system chain
