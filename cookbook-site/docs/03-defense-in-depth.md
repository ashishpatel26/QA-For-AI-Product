# 3) Defense-in-Depth Architecture

Trustworthy AI requires layered controls, not a single gate.

```mermaid
flowchart TB
  A[Macro Governance\nNIST AI RMF] --> B[Pre-Prod Evals\nAdversarial + RAG Triad]
  B --> C[Live Production\nObservability + Optimization]
```

## 7 Trust Vectors

- Valid & Reliable
- Safe
- Secure & Resilient
- Fair
- Explainable
- Accountable
- Transparent

## Governance Loop

`Map → Measure → Manage → Govern`
