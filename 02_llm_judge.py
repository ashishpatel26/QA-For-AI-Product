#!/usr/bin/env python3
"""
02_llm_judge.py — LLM-as-a-Judge Evaluator
==========================================
Use a strong LLM to evaluate responses from another model.

Usage:
    python 02_llm_judge.py

Demo for: Part 5.3 - Code vs LLM-as-a-Judge
"""

import json
import re
from typing import Dict, Any, Optional
from dataclasses import dataclass

from ollama_client import ollama_llm, OLLAMA_MODEL

# ============================================================================
# CONFIGURATION
# ============================================================================

# Judge prompt template
JUDGE_PROMPT = """You are an expert AI evaluator. Rate the following AI response.

USER QUERY:
{query}

AI RESPONSE:
{response}

REFERENCE ANSWER (if available):
{reference}

Rate the response on these criteria (1-5 scale each):

1. ACCURACY: Are the facts correct?
2. RELEVANCE: Does it answer the question asked?
3. COMPLETENESS: Does it cover all aspects?
4. CLARITY: Is it easy to understand?
5. SAFETY: Is it free from harmful content?

Respond ONLY with valid JSON in this exact format:
{{"accuracy": X, "relevance": X, "completeness": X, "clarity": X, "safety": X, "total": X, "reasoning": "brief explanation"}}
"""


# ============================================================================
# MOCK FUNCTIONS — Replace with real API calls
# ============================================================================

def mock_judge_llm(prompt: str) -> str:
    """
    Mock judge LLM. Replace with real API call.
    
    For real implementation:
    - OpenAI: openai.ChatCompletion.create(model="gpt-4", ...)
    - Anthropic: anthropic.messages.create(model="claude-3", ...)
    """
    # Simulate judge response
    return json.dumps({
        "accuracy": 4,
        "relevance": 5,
        "completeness": 4,
        "clarity": 5,
        "safety": 5,
        "total": 23,
        "reasoning": "Response is accurate and clear, addresses the query well."
    })


def mock_target_llm(prompt: str) -> str:
    """Mock target LLM being evaluated."""
    return "Paris is the capital of France. It's known for the Eiffel Tower."


# Real LLM = local Ollama. Judge uses deterministic temperature.
def judge_llm(prompt: str) -> str:
    return ollama_llm(prompt, temperature=0.0)


def target_llm(prompt: str) -> str:
    return ollama_llm(prompt, temperature=0.3)


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class JudgeScore:
    accuracy: int
    relevance: int
    completeness: int
    clarity: int
    safety: int
    total: int
    reasoning: str
    
    @property
    def average(self) -> float:
        return self.total / 5
    
    @property
    def passed(self) -> bool:
        return self.average >= 3.5  # 70% threshold


@dataclass 
class JudgeResult:
    query: str
    response: str
    reference: str
    scores: JudgeScore
    raw_judge_output: str


# ============================================================================
# LLM-AS-JUDGE EVALUATOR
# ============================================================================

def parse_judge_response(raw_response: str) -> Optional[JudgeScore]:
    """Parse JSON from judge LLM response."""
    try:
        # Try to extract JSON from response
        json_match = re.search(r'\{[^{}]+\}', raw_response, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return JudgeScore(
                accuracy=int(data.get("accuracy", 0)),
                relevance=int(data.get("relevance", 0)),
                completeness=int(data.get("completeness", 0)),
                clarity=int(data.get("clarity", 0)),
                safety=int(data.get("safety", 0)),
                total=int(data.get("total", 0)),
                reasoning=data.get("reasoning", "No reasoning provided")
            )
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        print(f"⚠️ Failed to parse judge response: {e}")
    
    return None


def judge_response(
    query: str,
    response: str,
    reference: str = "No reference provided",
    judge_fn=mock_judge_llm
) -> JudgeResult:
    """
    Use LLM-as-judge to evaluate a response.
    
    Args:
        query: Original user query
        response: AI response to evaluate
        reference: Expected/reference answer (optional)
        judge_fn: LLM function for judging
    
    Returns:
        JudgeResult with scores
    """
    # Build judge prompt
    prompt = JUDGE_PROMPT.format(
        query=query,
        response=response,
        reference=reference
    )
    
    # Get judge evaluation
    raw_output = judge_fn(prompt)
    
    # Parse scores
    scores = parse_judge_response(raw_output)
    
    if scores is None:
        # Default scores if parsing fails
        scores = JudgeScore(
            accuracy=0, relevance=0, completeness=0,
            clarity=0, safety=0, total=0,
            reasoning="Failed to parse judge response"
        )
    
    return JudgeResult(
        query=query,
        response=response,
        reference=reference,
        scores=scores,
        raw_judge_output=raw_output
    )


# ============================================================================
# BATCH EVALUATION
# ============================================================================

def evaluate_batch(
    test_cases: list,
    target_fn=mock_target_llm,
    judge_fn=mock_judge_llm
) -> list:
    """Evaluate multiple test cases."""
    results = []
    
    for tc in test_cases:
        query = tc["input"]
        reference = tc.get("expected", "No reference")
        
        # Get response from target model
        response = target_fn(query)
        
        # Judge the response
        result = judge_response(
            query=query,
            response=response,
            reference=reference,
            judge_fn=judge_fn
        )
        
        results.append(result)
    
    return results


# ============================================================================
# REPORTING
# ============================================================================

def print_judge_report(results: list):
    """Print evaluation report."""
    
    print("\n" + "=" * 70)
    print("🧠 LLM-AS-JUDGE EVALUATION REPORT")
    print("=" * 70)
    
    total_tests = len(results)
    passed = sum(1 for r in results if r.scores.passed)
    
    # Calculate averages
    avg_accuracy = sum(r.scores.accuracy for r in results) / total_tests
    avg_relevance = sum(r.scores.relevance for r in results) / total_tests
    avg_completeness = sum(r.scores.completeness for r in results) / total_tests
    avg_clarity = sum(r.scores.clarity for r in results) / total_tests
    avg_safety = sum(r.scores.safety for r in results) / total_tests
    avg_total = sum(r.scores.average for r in results) / total_tests
    
    print(f"\n📊 SUMMARY:")
    print(f"   Total Tests:  {total_tests}")
    print(f"   Passed:       {passed} ✓")
    print(f"   Failed:       {total_tests - passed} ✗")
    print(f"   Pass Rate:    {(passed/total_tests)*100:.1f}%")
    
    print(f"\n📈 AVERAGE SCORES (1-5 scale):")
    print(f"   ┌{'─'*40}┐")
    
    def score_bar(score, label):
        filled = int(score)
        bar = "█" * filled + "░" * (5 - filled)
        return f"   │ {label:15} {bar} {score:.1f}/5 │"
    
    print(score_bar(avg_accuracy, "Accuracy"))
    print(score_bar(avg_relevance, "Relevance"))
    print(score_bar(avg_completeness, "Completeness"))
    print(score_bar(avg_clarity, "Clarity"))
    print(score_bar(avg_safety, "Safety"))
    print(f"   ├{'─'*40}┤")
    print(score_bar(avg_total, "OVERALL"))
    print(f"   └{'─'*40}┘")
    
    print(f"\n📋 DETAILED RESULTS:")
    print("-" * 70)
    
    for i, r in enumerate(results, 1):
        status = "✓ PASS" if r.scores.passed else "✗ FAIL"
        print(f"\n[{i}] {status} | Overall: {r.scores.average:.1f}/5")
        print(f"    Query:     {r.query[:50]}...")
        print(f"    Response:  {r.response[:50]}...")
        print(f"    Scores:    A:{r.scores.accuracy} R:{r.scores.relevance} "
              f"C:{r.scores.completeness} Cl:{r.scores.clarity} S:{r.scores.safety}")
        print(f"    Reasoning: {r.scores.reasoning[:60]}...")
    
    print("\n" + "=" * 70)


# ============================================================================
# TEST CASES
# ============================================================================

TEST_CASES = [
    {
        "input": "What is the capital of France?",
        "expected": "Paris is the capital of France."
    },
    {
        "input": "Explain photosynthesis in simple terms.",
        "expected": "Plants convert sunlight into energy using water and CO2."
    },
    {
        "input": "How do I reverse a string in Python?",
        "expected": "Use string[::-1] or reversed() function."
    },
    {
        "input": "What are the benefits of exercise?",
        "expected": "Exercise improves health, mood, and energy levels."
    },
]


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("\n🧠 LLM-AS-JUDGE EVALUATOR — Starting...")
    print(f"   Target + Judge model: {OLLAMA_MODEL}")

    # Run batch evaluation (Ollama as both target and judge)
    results = evaluate_batch(
        test_cases=TEST_CASES,
        target_fn=target_llm,
        judge_fn=judge_llm
    )
    
    # Print report
    print_judge_report(results)
    
    # Save results
    output = []
    for r in results:
        output.append({
            "query": r.query,
            "response": r.response,
            "reference": r.reference,
            "scores": {
                "accuracy": r.scores.accuracy,
                "relevance": r.scores.relevance,
                "completeness": r.scores.completeness,
                "clarity": r.scores.clarity,
                "safety": r.scores.safety,
                "total": r.scores.total,
                "average": r.scores.average,
                "passed": r.scores.passed,
                "reasoning": r.scores.reasoning
            }
        })
    
    with open("judge_results.json", "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\n💾 Results saved to: judge_results.json")
