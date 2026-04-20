#!/usr/bin/env python3
"""
01_eval_runner.py — Basic AI Eval Runner
=========================================
Run golden dataset tests against any LLM.

Usage:
    python 01_eval_runner.py

Demo for: Part 2.2 - Accuracy & Quality Testing
"""

import json
import time
from typing import Callable, Dict, List, Any
from dataclasses import dataclass, asdict

from ollama_client import ollama_llm, OLLAMA_HOST, OLLAMA_MODEL

# ============================================================================
# CONFIGURATION — Change these for your setup
# ============================================================================


# Mock LLM function (fallback if Ollama unavailable)
def mock_llm(prompt: str) -> str:
    """Simulate LLM response. Replace with real API."""
    responses = {
        "what is 2+2": "The answer is 4.",
        "capital of france": "The capital of France is Paris.",
        "who wrote hamlet": "William Shakespeare wrote Hamlet.",
        "what is python": "Python is a programming language.",
    }

    prompt_lower = prompt.lower()
    for key, response in responses.items():
        if key in prompt_lower:
            return response

    return "I don't know the answer to that question."


# ============================================================================
# TEST CASES — Your golden dataset
# ============================================================================

TEST_CASES = [
    {
        "input": "What is 2+2?",
        "expected": "4",
        "tags": ["math", "basic"]
    },
    {
        "input": "What is the capital of France?",
        "expected": "Paris",
        "tags": ["geography", "basic"]
    },
    {
        "input": "Who wrote Hamlet?",
        "expected": "Shakespeare",
        "tags": ["literature", "basic"]
    },
    {
        "input": "What is Python?",
        "expected": "programming language",
        "tags": ["tech", "basic"]
    },
    {
        "input": "What is the meaning of life?",
        "expected": "42",  # This should fail with mock LLM
        "tags": ["philosophy", "trick"]
    },
]


# ============================================================================
# SCORING FUNCTIONS
# ============================================================================

def score_contains(actual: str, expected: str) -> float:
    """Simple scoring: does response contain expected answer?"""
    return 1.0 if expected.lower() in actual.lower() else 0.0


def score_exact_match(actual: str, expected: str) -> float:
    """Strict scoring: exact match only."""
    return 1.0 if actual.strip().lower() == expected.strip().lower() else 0.0


# ============================================================================
# EVAL RUNNER
# ============================================================================

@dataclass
class EvalResult:
    input: str
    expected: str
    actual: str
    score: float
    latency_ms: float
    tags: List[str]
    passed: bool


def run_eval(
    model_fn: Callable[[str], str],
    test_cases: List[Dict],
    scorer: Callable[[str, str], float] = score_contains,
    pass_threshold: float = 0.5
) -> List[EvalResult]:
    """
    Run evaluation suite against a model.

    Args:
        model_fn: Function that takes prompt, returns response
        test_cases: List of {input, expected, tags}
        scorer: Scoring function (actual, expected) -> 0.0-1.0
        pass_threshold: Score >= this = pass

    Returns:
        List of EvalResult objects
    """
    results = []

    for tc in test_cases:
        # Time the response
        start = time.time()
        response = model_fn(tc["input"])
        latency = (time.time() - start) * 1000  # ms

        # Score it
        score = scorer(response, tc["expected"])

        results.append(EvalResult(
            input=tc["input"],
            expected=tc["expected"],
            actual=response,
            score=score,
            latency_ms=round(latency, 2),
            tags=tc.get("tags", []),
            passed=score >= pass_threshold
        ))

    return results


# ============================================================================
# REPORTING
# ============================================================================

def print_report(results: List[EvalResult]) -> Dict[str, Any]:
    """Print evaluation report and return summary stats."""

    print("\n" + "=" * 70)
    print("🦴 AI EVAL REPORT — CAVEMAN STYLE")
    print("=" * 70)

    passed = sum(1 for r in results if r.passed)
    total = len(results)
    pass_rate = (passed / total) * 100 if total > 0 else 0
    avg_latency = sum(r.latency_ms for r in results) / \
        total if total > 0 else 0

    print(f"\n📊 SUMMARY:")
    print(f"   Total Tests:  {total}")
    print(f"   Passed:       {passed} ✓")
    print(f"   Failed:       {total - passed} ✗")
    print(f"   Pass Rate:    {pass_rate:.1f}%")
    print(f"   Avg Latency:  {avg_latency:.2f}ms")

    print(f"\n📋 DETAILED RESULTS:")
    print("-" * 70)

    for i, r in enumerate(results, 1):
        status = "✓ PASS" if r.passed else "✗ FAIL"
        print(
            f"\n[{i}] {status} | Score: {r.score:.2f} | Latency: {r.latency_ms:.1f}ms")
        print(f"    Input:    {r.input[:50]}...")
        print(f"    Expected: {r.expected}")
        print(f"    Actual:   {r.actual[:60]}...")
        print(f"    Tags:     {', '.join(r.tags)}")

    # Group by tags
    print(f"\n📊 RESULTS BY TAG:")
    print("-" * 70)

    tag_stats = {}
    for r in results:
        for tag in r.tags:
            if tag not in tag_stats:
                tag_stats[tag] = {"passed": 0, "total": 0}
            tag_stats[tag]["total"] += 1
            if r.passed:
                tag_stats[tag]["passed"] += 1

    for tag, stats in tag_stats.items():
        rate = (stats["passed"] / stats["total"]) * 100
        bar = "█" * int(rate / 10) + "░" * (10 - int(rate / 10))
        print(
            f"   {tag:15} {bar} {rate:.0f}% ({stats['passed']}/{stats['total']})")

    print("\n" + "=" * 70)

    return {
        "total": total,
        "passed": passed,
        "failed": total - passed,
        "pass_rate": pass_rate,
        "avg_latency_ms": avg_latency,
        "tag_stats": tag_stats
    }


def save_results(results: List[EvalResult], filepath: str = "eval_results.json"):
    """Save results to JSON file."""
    data = [asdict(r) for r in results]
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\n💾 Results saved to: {filepath}")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("\n🦴 CAVEMAN EVAL RUNNER — Starting...")
    print(f"   Model: {OLLAMA_MODEL} @ {OLLAMA_HOST}")

    # Run evaluation (swap to mock_llm if Ollama not running)
    results = run_eval(
        model_fn=ollama_llm,
        test_cases=TEST_CASES,
        scorer=score_contains,
        pass_threshold=0.5
    )

    # Print report
    summary = print_report(results)

    # Save results
    save_results(results)

    # Exit with appropriate code
    if summary["pass_rate"] >= 80:
        print("\n✅ EVAL PASSED — Ready to deploy!")
        exit(0)
    else:
        print("\n❌ EVAL FAILED — Fix issues before deploy!")
        exit(1)
