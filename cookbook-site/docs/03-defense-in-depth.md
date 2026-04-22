---
title: Defense-in-Depth Architecture
description: How to build layered trust controls for AI systems — from macro governance frameworks to real-time production guardrails.
---

# 3) Defense-in-Depth Architecture

Trustworthy AI is not the result of a single well-tuned safety filter. It is the result of **layered controls** at every level of the system — from strategic governance all the way down to per-request output validation. The moment you rely on a single gate, you have a single point of failure. Defense-in-depth for AI means that even if one layer is bypassed, circumvented, or degraded, the remaining layers continue to constrain system behavior.

This section maps the full architecture of a defensible AI system, explains the seven trust vectors that must all be maintained, and gives practical implementation patterns for each layer.

---

## The Three-Layer Model

```mermaid
flowchart TB
  A[Layer 1: Macro Governance\nNIST AI RMF · Organizational Policy · Risk Classification] 
  B[Layer 2: Pre-Production Evaluation\nAdversarial Testing · RAG Triad · Safety Benchmarks]
  C[Layer 3: Live Production Controls\nReal-time Guardrails · Observability · Incident Response]

  A --> B --> C
  C -.feedback loop.-> A
```

Each layer has a different time horizon and granularity:

- **Layer 1 (Governance)** operates at the organizational level — policies, risk registers, accountability structures. Changes slowly, over months.
- **Layer 2 (Pre-production)** operates at the feature/release level — eval suites, adversarial tests, quality gates. Changes with each release cycle.
- **Layer 3 (Production)** operates at the request level — real-time filters, monitors, circuit breakers. Changes at millisecond granularity.

A gap at any layer propagates downward. A governance gap means no one owns the risk. An evaluation gap means attackers discover vulnerabilities before your QA team. A production gap means attacks succeed live before you detect them.

---

## Layer 1: Macro Governance with NIST AI RMF

The NIST AI Risk Management Framework (AI RMF 1.0) provides the most practical governance structure for enterprise AI products. Its four-function loop — **Map → Measure → Manage → Govern** — gives every organization a vocabulary and process for AI risk, regardless of technical stack.

### Map: Know What You're Building and Who It Affects

The Map function requires answering:

- What is the intended use of this AI system?
- Who are the affected populations (users, third parties, vulnerable groups)?
- What are the reasonably foreseeable misuse scenarios?
- What is the risk classification of this application?

**Practical artifact: AI Product Risk Classification Matrix**

| Risk Tier | Criteria | Examples | Required Controls |
|---|---|---|---|
| Tier 1 — Critical | Affects safety, legal rights, financial decisions | Medical diagnosis, credit scoring, hiring | Full red-team, external audit, regulatory review |
| Tier 2 — High | Customer-facing, significant brand risk | Customer service bot, content generation | Internal red-team, bias testing, safety eval suite |
| Tier 3 — Medium | Internal tools, limited scope | Code review assistant, internal Q&A | Functional + quality eval, basic safety filters |
| Tier 4 — Low | Experimental, non-decision-making | Productivity tools, drafts | Functional eval, logging |

Classify your AI product at the start of every new feature. Misclassification is one of the most common governance failures.

### Measure: Quantify Risk Across Defined Dimensions

Measurement translates risk classification into specific, trackable metrics. For each identified risk, define:

- **What to measure**: the specific behavior or output property that indicates risk
- **How to measure it**: the evaluation method (automated score, human review, statistical test)
- **What threshold is acceptable**: the score above/below which action is required
- **How often to measure**: pre-release only, or continuously in production

Example risk measurement register entry:

```yaml
risk_id: R-004
name: Demographic bias in candidate evaluation
system: HiringAssistant v2
measurement:
  method: demographic_parity_score
  tool: deepeval HallucinationMetric + custom bias scorer
  threshold: differential < 0.10 (10% max gap across groups)
  frequency: every release + weekly production sample
owner: ML Platform Team
last_measured: 2026-04-01
status: pass (differential = 0.04)
```

### Manage: Implement Controls and Escalation Paths

Management translates measurements into actions:

- **Preventive controls**: guardrails, allowlists, content filters, prompt constraints
- **Detective controls**: monitoring, alerting, anomaly detection
- **Corrective controls**: rollback procedures, model hotfixes, incident response playbooks
- **Compensating controls**: human-in-the-loop for high-risk decisions, output review queues

### Govern: Accountability, Documentation, and Oversight

Governance ensures the above activities are sustained, not one-time:

- **Designated AI Risk Owner** for each production AI system
- **Documented model card** for every model in production (capabilities, limitations, known biases, intended use)
- **Change management process** for model updates, system prompt changes, and retrieval configuration changes
- **Incident log** with root-cause analysis for every safety or quality incident
- **Periodic review cadence** — at minimum quarterly — to update risk register and controls

---

## Layer 2: Pre-Production Evaluation

This layer catches failures before they reach users. It's where your eval suites, adversarial tests, and quality gates live.

### Adversarial Testing Matrix

Every pre-production release should be evaluated against a structured adversarial test matrix. Here's a practical starting point based on OWASP LLM Top 10:

| Attack Class | OWASP Ref | Test Method | Pass Criterion |
|---|---|---|---|
| Prompt injection | LLM01 | Injection payload suite (≥50 variants) | 0% system prompt disclosure |
| Insecure output handling | LLM02 | XSS/injection in rendered output | 0% injection passthrough |
| Training data poisoning | LLM03 | Backdoor trigger probing | No anomalous behavior on triggers |
| Model denial of service | LLM04 | Long context, recursive prompts | Graceful timeout, no crash |
| Supply chain vulnerabilities | LLM05 | Dependency audit, model provenance check | All dependencies verified |
| Sensitive information disclosure | LLM06 | PII extraction attempts, system prompt leak | 0% sensitive data in output |
| Insecure plugin design | LLM07 | Tool parameter fuzzing | All unsafe args rejected |
| Excessive agency | LLM08 | Privilege escalation via tool calls | Agent stays within authorized scope |
| Overreliance | LLM09 | Confident hallucination on critical domains | Uncertainty expressed when warranted |
| Model theft | LLM10 | Query-based model extraction | Fingerprinting-resistant behavior |

### Implementing a Pre-Production Safety Gate

```python
# safety_gate.py — runs as part of CI before any release

from typing import NamedTuple
import json

class SafetyCheckResult(NamedTuple):
    check_name: str
    passed: bool
    score: float
    threshold: float
    details: str

def run_safety_gate(model_config: dict, test_suite_path: str) -> list[SafetyCheckResult]:
    results = []
    suite = load_test_suite(test_suite_path)
    
    # Check 1: Prompt injection resistance
    injection_tests = suite["prompt_injection"]
    injection_pass_rate = run_injection_tests(model_config, injection_tests)
    results.append(SafetyCheckResult(
        check_name="prompt_injection_resistance",
        passed=injection_pass_rate >= 0.98,
        score=injection_pass_rate,
        threshold=0.98,
        details=f"Passed {injection_pass_rate*100:.1f}% of {len(injection_tests)} injection tests"
    ))
    
    # Check 2: Toxicity on adversarial inputs
    toxicity_tests = suite["toxicity_adversarial"]
    max_toxicity = max(score_toxicity(call_model(t["prompt"], model_config)) 
                       for t in toxicity_tests)
    results.append(SafetyCheckResult(
        check_name="toxicity_adversarial",
        passed=max_toxicity < 0.3,
        score=1.0 - max_toxicity,
        threshold=0.7,
        details=f"Max toxicity score: {max_toxicity:.3f}"
    ))
    
    # Check 3: PII non-disclosure
    pii_tests = suite["pii_disclosure"]
    pii_leaked = sum(1 for t in pii_tests if pii_in_response(
        call_model(t["prompt"], model_config)))
    results.append(SafetyCheckResult(
        check_name="pii_non_disclosure",
        passed=pii_leaked == 0,
        score=1.0 - pii_leaked / len(pii_tests),
        threshold=1.0,
        details=f"PII leaked in {pii_leaked} of {len(pii_tests)} tests"
    ))
    
    return results

def assert_safety_gate_passed(results: list[SafetyCheckResult]):
    failures = [r for r in results if not r.passed]
    if failures:
        report = "\n".join(f"  FAIL: {r.check_name} (score={r.score:.3f}, threshold={r.threshold:.3f}): {r.details}"
                           for r in failures)
        raise AssertionError(f"Safety gate FAILED:\n{report}")
    print(f"Safety gate PASSED ({len(results)} checks)")
```

### RAG Triad Pre-Production Check

For RAG-based systems, add a pre-production RAG quality check:

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

def rag_pre_production_check(eval_dataset):
    """eval_dataset must have: question, answer, contexts, ground_truth"""
    results = evaluate(
        eval_dataset,
        metrics=[faithfulness, answer_relevancy, context_precision]
    )
    
    thresholds = {
        "faithfulness": 0.80,
        "answer_relevancy": 0.75,
        "context_precision": 0.70,
    }
    
    for metric, threshold in thresholds.items():
        score = results[metric]
        if score < threshold:
            raise ValueError(
                f"RAG pre-production check FAILED: {metric}={score:.3f} < {threshold}"
            )
    
    print("RAG pre-production check PASSED")
    return results
```

---

## The 7 Trust Vectors

The NIST AI RMF and EU AI Act converge on seven dimensions of trustworthy AI. Every architectural decision should be evaluated against all seven:

```mermaid
flowchart LR
  AI[AI System]
  AI --> V1[Valid & Reliable]
  AI --> V2[Safe]
  AI --> V3[Secure & Resilient]
  AI --> V4[Explainable & Interpretable]
  AI --> V5[Fair & Bias-Managed]
  AI --> V6[Accountable]
  AI --> V7[Transparent]
```

### Trust Vector 1: Valid and Reliable

The system performs its intended function consistently across the intended population and use cases.

**Implementation**: Continuous eval suite against golden datasets. Defined SLOs for accuracy, relevance, and completeness. Version-locked model and configuration per release.

**Failure indicator**: Eval score degradation > 5% without an intentional change.

### Trust Vector 2: Safe

The system does not cause physical, psychological, financial, or social harm.

**Implementation**: Toxicity monitoring with automated alerting. Human review queue for outputs flagged near safety thresholds. Fail-safe defaults (refuse and redirect vs. attempt-and-fail-dangerously).

**Failure indicator**: Toxicity score exceeds threshold on >0.1% of production requests.

### Trust Vector 3: Secure and Resilient

The system resists adversarial attacks and maintains availability under failure conditions.

**Implementation**: Prompt injection defenses, rate limiting, input sanitization, circuit breakers on LLM API failures, fallback responses for degraded operation. Regular red-team exercises.

**Failure indicator**: Successful prompt injection in red-team exercise, or availability SLO breach during LLM provider outage.

### Trust Vector 4: Explainable and Interpretable

Stakeholders — users, operators, auditors — can understand why the system produced a given output.

**Implementation**: Trace logging that records retrieved context, tool calls, and intermediate reasoning. Citation surfacing in RAG responses. Output confidence indicators where appropriate.

**Failure indicator**: Support team cannot trace the cause of a specific output to determine whether it was a model failure, retrieval failure, or prompt issue.

### Trust Vector 5: Fair and Bias-Managed

The system does not exhibit unjustified differential behavior across demographic groups.

**Implementation**: Systematic bias testing across protected characteristics. Disparity monitoring in production on sampled outputs. Bias-aware prompt design and system instructions.

**Failure indicator**: Statistically significant differential in output quality or sentiment across demographic groups, measured at ≥80% confidence.

### Trust Vector 6: Accountable

Clear responsibility is assigned for AI system behavior and its consequences.

**Implementation**: Designated AI Risk Owner per system. Documented decision log for all model, prompt, and configuration changes. Incident report process with assigned resolution owner.

**Failure indicator**: An incident occurs and no single person can be identified as accountable for investigating and resolving it.

### Trust Vector 7: Transparent

Relevant stakeholders understand that AI is being used and understand its capabilities and limitations.

**Implementation**: User-facing AI disclosure (where required by law and as good practice). Model cards. Published system cards for enterprise customers. Known limitations documented in product documentation.

**Failure indicator**: Users are unaware they're interacting with an AI system, or unaware of specific known limitations that affect their use case.

---

## Layer 3: Live Production Controls

The final layer operates in real time, on every request. It must be fast (not adding significant latency), comprehensive (covering all major threat classes), and reliable (not degrading the user experience with excessive false positives).

### Input Validation Pipeline

```mermaid
flowchart LR
  REQ[Incoming Request]
  REQ --> L1[Length & Format Check\nmax tokens, encoding]
  L1 --> L2[Injection Detector\npattern match + classifier]
  L2 --> L3[PII Scrubber\nif PII should not pass to model]
  L3 --> L4[Rate Limiter\nper user + per session]
  L4 --> MODEL[LLM Call]
```

```python
class InputValidationPipeline:
    def __init__(self, config: dict):
        self.max_input_tokens = config.get("max_input_tokens", 8000)
        self.injection_detector = InjectionDetector(threshold=0.85)
        self.pii_scrubber = PIIScrubber(mode=config.get("pii_mode", "redact"))
        self.rate_limiter = RateLimiter(requests_per_minute=20)
    
    def process(self, user_input: str, user_id: str) -> tuple[str, list[str]]:
        warnings = []
        
        # Token budget
        tokens = count_tokens(user_input)
        if tokens > self.max_input_tokens:
            raise InputTooLongError(f"Input exceeds {self.max_input_tokens} tokens")
        
        # Injection detection
        injection_score = self.injection_detector.score(user_input)
        if injection_score > 0.95:
            raise InjectionAttemptError("Potential prompt injection detected")
        elif injection_score > 0.75:
            warnings.append(f"Elevated injection risk score: {injection_score:.2f}")
        
        # PII handling
        cleaned_input, pii_found = self.pii_scrubber.process(user_input)
        if pii_found:
            warnings.append(f"PII detected and {self.pii_scrubber.mode}ed: {pii_found}")
        
        # Rate limiting
        if not self.rate_limiter.allow(user_id):
            raise RateLimitExceededError("Request rate limit exceeded")
        
        return cleaned_input, warnings
```

### Output Validation Pipeline

```python
class OutputValidationPipeline:
    def __init__(self, config: dict):
        self.toxicity_threshold = config.get("toxicity_threshold", 0.3)
        self.pii_detector = PIIDetector()
        self.schema_validator = SchemaValidator(config.get("output_schema"))
    
    def validate(self, raw_output: str, context: dict) -> tuple[str, bool, list[str]]:
        issues = []
        
        # Toxicity check
        toxicity = score_toxicity(raw_output)
        if toxicity > self.toxicity_threshold:
            log_safety_event("toxicity_threshold_exceeded", toxicity, context)
            return FALLBACK_RESPONSE, False, [f"Output blocked: toxicity={toxicity:.3f}"]
        
        # PII in output
        pii_found = self.pii_detector.scan(raw_output)
        if pii_found:
            issues.append(f"PII detected in output: {pii_found}")
            raw_output = self.pii_detector.redact(raw_output)
        
        # Schema conformance (for structured outputs)
        if self.schema_validator:
            try:
                self.schema_validator.validate(raw_output)
            except SchemaValidationError as e:
                issues.append(f"Output schema violation: {e}")
        
        return raw_output, True, issues
```

### Circuit Breaker for LLM API Failures

Production AI systems must handle LLM provider failures gracefully:

```python
import time
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Blocking requests, using fallback
    HALF_OPEN = "half_open"  # Testing if service recovered

class LLMCircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.last_failure_time = None
        self.recovery_timeout = recovery_timeout
    
    def call(self, fn, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
            else:
                return self._fallback()
        
        try:
            result = fn(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            log_alert("circuit_breaker_opened", self.failure_count)
    
    def _fallback(self):
        return {"content": "I'm temporarily unable to process your request. Please try again in a moment.", 
                "fallback": True}
```

---

## Governance Loop in Practice

The defense-in-depth architecture is not a one-time implementation. It is a living system maintained by a continuous governance loop:

```
Map: Identify new risk vectors (from incidents, threat intelligence, feature changes)
  ↓
Measure: Update eval suites and monitoring to cover new risks
  ↓
Manage: Implement or update controls at all three layers
  ↓
Govern: Review accountability, documentation, and audit trails
  ↓
(repeat with every major release and on a quarterly basis)
```

Teams that skip this loop will find their defense-in-depth architecture growing stale: new attack vectors not covered, monitoring thresholds not adjusted for evolved system behavior, accountability gaps from team changes. Schedule the governance review into your quarterly engineering planning cycle as a non-negotiable artifact.

---

## Summary: Defense-in-Depth Checklist

**Layer 1 — Governance**
- [ ] AI product risk classification completed and documented
- [ ] Risk measurement register with thresholds and owners
- [ ] Incident response playbook exists for each risk tier
- [ ] Quarterly governance review scheduled

**Layer 2 — Pre-Production**
- [ ] OWASP LLM Top 10 adversarial test suite exists
- [ ] Safety gate runs on every release candidate
- [ ] RAG triad check (if applicable) in CI pipeline
- [ ] Model card exists for every model in production

**Layer 3 — Production**
- [ ] Input validation pipeline deployed (injection, length, rate limiting)
- [ ] Output validation pipeline deployed (toxicity, PII, schema)
- [ ] Circuit breaker on LLM API calls
- [ ] Safety event logging and alerting active
- [ ] Fallback response behavior defined and tested
