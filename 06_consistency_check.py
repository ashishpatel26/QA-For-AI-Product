#!/usr/bin/env python3
"""
06_consistency_check.py — AI Consistency Checker
================================================
Test if AI gives consistent answers to paraphrased questions.

Usage:
    python 06_consistency_check.py

Demo for: Part 2.3 - Robustness Testing (Consistency)
"""

import json
from typing import List, Dict, Callable
from dataclasses import dataclass, asdict

from ollama_client import ollama_llm, OLLAMA_MODEL
from collections import defaultdict
import re

# ============================================================================
# PARAPHRASE TEST SETS
# ============================================================================

PARAPHRASE_SETS = [
    {
        "name": "capital_of_france",
        "category": "factual",
        "expected_answer": "Paris",
        "variations": [
            "What is the capital of France?",
            "France's capital city is?",
            "Which city serves as France's capital?",
            "Name the capital of France.",
            "Capital of France = ?",
            "Tell me the capital city of France.",
            "What city is the capital of France?",
        ]
    },
    {
        "name": "python_string_reverse",
        "category": "technical",
        "expected_answer": "[::-1]",
        "variations": [
            "How do I reverse a string in Python?",
            "Python string reversal method?",
            "Reverse string python code?",
            "Show me how to flip a string in Python.",
            "What's the way to reverse text in Python?",
            "Python: reversing a string?",
        ]
    },
    {
        "name": "water_boiling_point",
        "category": "science",
        "expected_answer": "100",
        "variations": [
            "What temperature does water boil at?",
            "Water boiling point in Celsius?",
            "At what temperature does water boil?",
            "Boiling point of water?",
            "When does water start boiling?",
            "What's the boiling temperature of water?",
        ]
    },
    {
        "name": "earth_sun_distance",
        "category": "science",
        "expected_answer": "93 million miles",  # or 150 million km
        "variations": [
            "How far is Earth from the Sun?",
            "Distance between Earth and Sun?",
            "What is the Earth-Sun distance?",
            "How many miles from Earth to Sun?",
            "Earth to Sun distance?",
        ]
    },
    {
        "name": "python_list_add",
        "category": "technical",
        "expected_answer": "append",
        "variations": [
            "How do I add an element to a Python list?",
            "Python list add element method?",
            "Adding to a list in Python?",
            "What method adds items to Python lists?",
            "Python: insert element into list?",
        ]
    },
]


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class ConsistencyResult:
    set_name: str
    category: str
    prompt: str
    response: str
    extracted_answer: str
    matches_expected: bool


@dataclass
class ConsistencyAnalysis:
    set_name: str
    category: str
    expected_answer: str
    total_variations: int
    unique_answers: List[str]
    consistency_score: float
    passed: bool
    responses: List[Dict]


# ============================================================================
# MOCK LLM
# ============================================================================

def mock_llm(prompt: str) -> str:
    """Mock LLM with slight variations for realism."""
    prompt_lower = prompt.lower()
    
    if "capital" in prompt_lower and "france" in prompt_lower:
        responses = [
            "The capital of France is Paris.",
            "Paris is the capital of France.",
            "France's capital city is Paris.",
        ]
        # Return based on prompt hash for determinism
        return responses[hash(prompt) % len(responses)]
    
    if "reverse" in prompt_lower and "string" in prompt_lower and "python" in prompt_lower:
        return "You can reverse a string in Python using string[::-1] or the reversed() function."
    
    if "boil" in prompt_lower and "water" in prompt_lower:
        return "Water boils at 100 degrees Celsius (212°F) at sea level."
    
    if ("earth" in prompt_lower or "sun" in prompt_lower) and "distance" in prompt_lower:
        return "Earth is approximately 93 million miles (150 million km) from the Sun."
    
    if "list" in prompt_lower and ("add" in prompt_lower or "append" in prompt_lower):
        return "Use the append() method to add elements to a Python list."
    
    return "I don't have enough information to answer that."


# ============================================================================
# ANSWER EXTRACTION
# ============================================================================

def extract_core_answer(response: str, expected_patterns: List[str] = None) -> str:
    """
    Extract the core answer from a response.
    
    Simple implementation: look for key terms
    Production: Use NLP or regex patterns
    """
    response_lower = response.lower()
    
    # Look for common answer patterns
    patterns = [
        r'is\s+([A-Z][a-z]+)',  # "is Paris"
        r':\s*(\d+)',           # ": 100"
        r'(\d+\s*(million|billion|degrees|km|miles))',
        r'(append|[::\-1])',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, response, re.IGNORECASE)
        if match:
            return match.group(1) if match.lastindex else match.group(0)
    
    # Return first significant word
    words = [w for w in response.split() if len(w) > 3]
    return words[0] if words else response[:20]


def check_answer_match(response: str, expected: str) -> bool:
    """Check if response contains the expected answer."""
    return expected.lower() in response.lower()


# ============================================================================
# CONSISTENCY TESTING
# ============================================================================

def test_consistency(
    model_fn: Callable[[str], str],
    paraphrase_set: Dict,
    runs_per_variation: int = 1
) -> ConsistencyAnalysis:
    """Test consistency across paraphrased questions."""
    
    results = []
    all_answers = []
    
    for variation in paraphrase_set["variations"]:
        for _ in range(runs_per_variation):
            response = model_fn(variation)
            extracted = extract_core_answer(response)
            matches = check_answer_match(response, paraphrase_set["expected_answer"])
            
            results.append(ConsistencyResult(
                set_name=paraphrase_set["name"],
                category=paraphrase_set["category"],
                prompt=variation,
                response=response,
                extracted_answer=extracted,
                matches_expected=matches
            ))
            
            all_answers.append(extracted.lower())
    
    # Calculate consistency
    unique_answers = list(set(all_answers))
    consistency_score = 1.0 / len(unique_answers) if unique_answers else 0
    
    # Passed if >80% consistent and matches expected
    matches_expected = sum(1 for r in results if r.matches_expected)
    passed = consistency_score >= 0.5 and matches_expected / len(results) >= 0.8
    
    return ConsistencyAnalysis(
        set_name=paraphrase_set["name"],
        category=paraphrase_set["category"],
        expected_answer=paraphrase_set["expected_answer"],
        total_variations=len(results),
        unique_answers=unique_answers,
        consistency_score=round(consistency_score, 3),
        passed=passed,
        responses=[asdict(r) for r in results]
    )


def run_full_consistency_check(
    model_fn: Callable[[str], str],
    paraphrase_sets: List[Dict] = PARAPHRASE_SETS,
    runs_per_variation: int = 1
) -> List[ConsistencyAnalysis]:
    """Run consistency check across all paraphrase sets."""
    
    analyses = []
    for ps in paraphrase_sets:
        analysis = test_consistency(model_fn, ps, runs_per_variation)
        analyses.append(analysis)
    
    return analyses


# ============================================================================
# REPORTING
# ============================================================================

def print_consistency_report(analyses: List[ConsistencyAnalysis]):
    """Print consistency report."""
    
    print("\n" + "=" * 70)
    print("🔄 CONSISTENCY CHECK REPORT")
    print("=" * 70)
    
    total = len(analyses)
    passed = sum(1 for a in analyses if a.passed)
    avg_consistency = sum(a.consistency_score for a in analyses) / total
    
    print(f"\n📊 SUMMARY:")
    print(f"   Test Sets:         {total}")
    print(f"   Passed:            {passed} ✓")
    print(f"   Failed:            {total - passed} ✗")
    print(f"   Avg Consistency:   {avg_consistency:.1%}")
    
    print(f"\n📈 CONSISTENCY BY CATEGORY:")
    print("-" * 70)
    
    # Group by category
    by_category = defaultdict(list)
    for a in analyses:
        by_category[a.category].append(a.consistency_score)
    
    for cat, scores in by_category.items():
        avg = sum(scores) / len(scores)
        bar = "█" * int(avg * 10) + "░" * (10 - int(avg * 10))
        status = "✓" if avg >= 0.5 else "✗"
        print(f"   {status} {cat:15} {bar} {avg:.1%}")
    
    print(f"\n📋 DETAILED RESULTS:")
    print("-" * 70)
    
    for a in analyses:
        status = "✓ PASS" if a.passed else "✗ FAIL"
        print(f"\n   [{a.category.upper()}] {a.set_name}")
        print(f"   Status:       {status}")
        print(f"   Expected:     \"{a.expected_answer}\"")
        print(f"   Consistency:  {a.consistency_score:.1%}")
        print(f"   Variations:   {a.total_variations}")
        print(f"   Unique Ans:   {len(a.unique_answers)}")
        
        if len(a.unique_answers) > 1:
            print(f"   Answers Found:")
            for ans in a.unique_answers[:5]:
                print(f"      • \"{ans}\"")
    
    print("\n" + "=" * 70)
    
    # Assessment
    if passed == total:
        print("✅ CONSISTENCY ASSESSMENT: EXCELLENT — All tests consistent!")
    elif passed / total >= 0.8:
        print("⚠️ CONSISTENCY ASSESSMENT: GOOD — Minor inconsistencies")
    else:
        print("🚨 CONSISTENCY ASSESSMENT: POOR — Model gives inconsistent answers")
    
    print("\n💡 RECOMMENDATIONS:")
    if passed < total:
        print("   • Lower temperature setting for more deterministic outputs")
        print("   • Add few-shot examples for consistent formatting")
        print("   • Fine-tune on question paraphrases")
        print("   • Use constrained decoding for factual queries")
    else:
        print("   • Continue monitoring consistency in production")
        print("   • Add more paraphrase variations to test coverage")
    
    print("=" * 70)


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("\n🔄 CONSISTENCY CHECKER — Starting paraphrase testing...")
    print(f"   Model: {OLLAMA_MODEL} (local Ollama)")

    # Run tests against real Ollama model
    analyses = run_full_consistency_check(
        model_fn=ollama_llm,
        paraphrase_sets=PARAPHRASE_SETS,
        runs_per_variation=1
    )
    
    # Print report
    print_consistency_report(analyses)
    
    # Save results
    output = {
        "summary": {
            "total_sets": len(analyses),
            "passed": sum(1 for a in analyses if a.passed),
            "avg_consistency": sum(a.consistency_score for a in analyses) / len(analyses)
        },
        "analyses": [asdict(a) for a in analyses]
    }
    
    with open("consistency_results.json", "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\n💾 Results saved to: consistency_results.json")
    
    # Exit code
    passed = sum(1 for a in analyses if a.passed)
    exit(0 if passed == len(analyses) else 1)
