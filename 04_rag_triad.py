#!/usr/bin/env python3
"""
04_rag_triad.py — RAG Evaluation Triad
======================================
Evaluate RAG systems on Context Relevance, Groundedness, and Answer Relevance.

Usage:
    python 04_rag_triad.py

Demo for: Part 5.1 - The RAG Evaluation Triad
"""

import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from difflib import SequenceMatcher

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class RAGInput:
    query: str
    retrieved_context: List[str]
    generated_response: str
    ground_truth: Optional[str] = None


@dataclass
class RAGScores:
    context_relevance: float  # Are retrieved docs relevant to query?
    groundedness: float       # Is response grounded in context?
    answer_relevance: float   # Does response answer the query?
    overall: float            # Combined score
    
    @property
    def passed(self) -> bool:
        return self.groundedness >= 0.85  # Critical threshold


@dataclass
class RAGResult:
    input: RAGInput
    scores: RAGScores
    hallucinations: List[str]
    details: Dict[str, Any]


# ============================================================================
# SCORING FUNCTIONS
# ============================================================================

def score_context_relevance(query: str, contexts: List[str]) -> float:
    """
    Score how relevant the retrieved contexts are to the query.
    
    Simple implementation: keyword overlap
    Production: Use embeddings similarity or LLM-as-judge
    """
    query_words = set(query.lower().split())
    
    relevance_scores = []
    for ctx in contexts:
        ctx_words = set(ctx.lower().split())
        overlap = len(query_words & ctx_words)
        max_possible = len(query_words)
        score = overlap / max_possible if max_possible > 0 else 0
        relevance_scores.append(score)
    
    return sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0


def extract_claims(response: str) -> List[str]:
    """
    Extract individual claims from a response.
    
    Simple implementation: Split by sentences
    Production: Use NLP or LLM to extract atomic claims
    """
    # Simple sentence splitting
    sentences = []
    for sent in response.replace("!", ".").replace("?", ".").split("."):
        sent = sent.strip()
        if len(sent) > 10:  # Filter very short fragments
            sentences.append(sent)
    return sentences


def check_claim_in_context(claim: str, contexts: List[str]) -> tuple:
    """
    Check if a claim is supported by the context.
    
    Returns: (is_grounded: bool, best_match_score: float)
    """
    claim_lower = claim.lower()
    best_score = 0
    
    for ctx in contexts:
        ctx_lower = ctx.lower()
        
        # Check direct containment
        if claim_lower in ctx_lower:
            return True, 1.0
        
        # Check similarity
        ratio = SequenceMatcher(None, claim_lower, ctx_lower).ratio()
        best_score = max(best_score, ratio)
        
        # Check key phrase overlap
        claim_words = set(claim_lower.split())
        ctx_words = set(ctx_lower.split())
        overlap = len(claim_words & ctx_words) / len(claim_words) if claim_words else 0
        best_score = max(best_score, overlap)
    
    return best_score >= 0.6, best_score


def score_groundedness(response: str, contexts: List[str]) -> tuple:
    """
    Score how grounded the response is in the context.
    
    Returns: (score: float, hallucinations: List[str])
    """
    claims = extract_claims(response)
    
    if not claims:
        return 1.0, []
    
    grounded_count = 0
    hallucinations = []
    
    for claim in claims:
        is_grounded, score = check_claim_in_context(claim, contexts)
        if is_grounded:
            grounded_count += 1
        else:
            hallucinations.append(claim)
    
    groundedness_score = grounded_count / len(claims)
    return groundedness_score, hallucinations


def score_answer_relevance(query: str, response: str) -> float:
    """
    Score how well the response answers the query.
    
    Simple implementation: keyword overlap + length check
    Production: Use LLM-as-judge or semantic similarity
    """
    query_words = set(query.lower().split())
    response_words = set(response.lower().split())
    
    # Keyword overlap
    overlap = len(query_words & response_words)
    overlap_score = overlap / len(query_words) if query_words else 0
    
    # Response length (penalize very short or very long)
    response_len = len(response.split())
    if response_len < 5:
        length_score = 0.5
    elif response_len > 500:
        length_score = 0.7
    else:
        length_score = 1.0
    
    # Check for refusals (which might be appropriate)
    refusal_phrases = ["i don't know", "cannot", "no information", "not sure"]
    is_refusal = any(phrase in response.lower() for phrase in refusal_phrases)
    
    if is_refusal:
        return 0.5  # Neutral score for refusals
    
    return (overlap_score * 0.7 + length_score * 0.3)


# ============================================================================
# RAG EVALUATOR
# ============================================================================

def evaluate_rag(input_data: RAGInput) -> RAGResult:
    """
    Evaluate a RAG system output using the RAG Triad.
    """
    # Score context relevance
    context_relevance = score_context_relevance(
        input_data.query,
        input_data.retrieved_context
    )
    
    # Score groundedness
    groundedness, hallucinations = score_groundedness(
        input_data.generated_response,
        input_data.retrieved_context
    )
    
    # Score answer relevance
    answer_relevance = score_answer_relevance(
        input_data.query,
        input_data.generated_response
    )
    
    # Calculate overall score (weighted)
    overall = (
        context_relevance * 0.25 +
        groundedness * 0.50 +  # Groundedness most important
        answer_relevance * 0.25
    )
    
    scores = RAGScores(
        context_relevance=round(context_relevance, 3),
        groundedness=round(groundedness, 3),
        answer_relevance=round(answer_relevance, 3),
        overall=round(overall, 3)
    )
    
    details = {
        "num_contexts": len(input_data.retrieved_context),
        "num_claims": len(extract_claims(input_data.generated_response)),
        "num_hallucinations": len(hallucinations),
        "response_length": len(input_data.generated_response.split())
    }
    
    return RAGResult(
        input=input_data,
        scores=scores,
        hallucinations=hallucinations,
        details=details
    )


# ============================================================================
# TEST CASES
# ============================================================================

TEST_CASES = [
    # Good RAG response (grounded)
    RAGInput(
        query="What is the capital of France?",
        retrieved_context=[
            "France is a country in Western Europe. Paris is the capital city of France.",
            "Paris is known for the Eiffel Tower and is home to about 2 million people."
        ],
        generated_response="The capital of France is Paris. Paris is known for landmarks like the Eiffel Tower."
    ),
    
    # Hallucination example
    RAGInput(
        query="What is the warranty coverage?",
        retrieved_context=[
            "The standard warranty covers fire damage for 12 months.",
            "Extended warranty options are available for purchase."
        ],
        generated_response="Your policy covers fire damage and theft. The warranty lasts for 12 months and includes water damage protection."
        # "theft" and "water damage" are NOT in context = hallucinations!
    ),
    
    # Poor context retrieval
    RAGInput(
        query="How do I reset my password?",
        retrieved_context=[
            "Our company was founded in 1990.",
            "We have offices in New York and London."
        ],
        generated_response="To reset your password, go to the login page and click 'Forgot Password'."
        # Response is helpful but NOT grounded in context
    ),
    
    # Good refusal (no info in context)
    RAGInput(
        query="What is the return policy?",
        retrieved_context=[
            "Products are shipped within 2 business days.",
            "We accept all major credit cards."
        ],
        generated_response="I don't have information about the return policy in the available documents. Please contact customer support."
    ),
]


# ============================================================================
# REPORTING
# ============================================================================

def print_rag_report(results: List[RAGResult]):
    """Print RAG evaluation report."""
    
    print("\n" + "=" * 70)
    print("📚 RAG TRIAD EVALUATION REPORT")
    print("=" * 70)
    
    total = len(results)
    passed = sum(1 for r in results if r.scores.passed)
    
    # Averages
    avg_context = sum(r.scores.context_relevance for r in results) / total
    avg_ground = sum(r.scores.groundedness for r in results) / total
    avg_answer = sum(r.scores.answer_relevance for r in results) / total
    avg_overall = sum(r.scores.overall for r in results) / total
    
    print(f"\n📊 SUMMARY:")
    print(f"   Total Evaluations: {total}")
    print(f"   Passed (Ground ≥ 0.85): {passed} ✓")
    print(f"   Failed: {total - passed} ✗")
    
    print(f"\n📈 AVERAGE SCORES:")
    print(f"   ┌{'─'*50}┐")
    
    def score_bar(score, label, threshold=None):
        filled = int(score * 10)
        bar = "█" * filled + "░" * (10 - filled)
        threshold_marker = f" (threshold: {threshold})" if threshold else ""
        status = "✓" if threshold is None or score >= threshold else "✗"
        return f"   │ {status} {label:20} {bar} {score:.2f}{threshold_marker:15} │"
    
    print(score_bar(avg_context, "Context Relevance"))
    print(score_bar(avg_ground, "Groundedness", 0.85))
    print(score_bar(avg_answer, "Answer Relevance"))
    print(f"   ├{'─'*50}┤")
    print(score_bar(avg_overall, "OVERALL"))
    print(f"   └{'─'*50}┘")
    
    print(f"\n📋 DETAILED RESULTS:")
    print("-" * 70)
    
    for i, r in enumerate(results, 1):
        status = "✓ PASS" if r.scores.passed else "✗ FAIL"
        print(f"\n[{i}] {status}")
        print(f"    Query:       {r.input.query}")
        print(f"    Response:    {r.input.generated_response[:60]}...")
        print(f"    Scores:")
        print(f"      Context Relevance:  {r.scores.context_relevance:.2f}")
        print(f"      Groundedness:       {r.scores.groundedness:.2f} {'✓' if r.scores.groundedness >= 0.85 else '⚠️ BELOW THRESHOLD'}")
        print(f"      Answer Relevance:   {r.scores.answer_relevance:.2f}")
        print(f"      Overall:            {r.scores.overall:.2f}")
        
        if r.hallucinations:
            print(f"    🚨 HALLUCINATIONS DETECTED ({len(r.hallucinations)}):")
            for h in r.hallucinations[:3]:  # Show first 3
                print(f"       ❌ \"{h[:50]}...\"")
    
    print("\n" + "=" * 70)
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS:")
    if avg_context < 0.7:
        print("   ⚠️ Context Relevance is low — improve retrieval/embedding model")
    if avg_ground < 0.85:
        print("   ⚠️ Groundedness below 0.85 — add citations or constrain generation")
    if avg_answer < 0.7:
        print("   ⚠️ Answer Relevance is low — improve prompt or fine-tune model")
    if avg_overall >= 0.8:
        print("   ✅ Overall quality is good!")
    
    print("=" * 70)


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("\n📚 RAG TRIAD EVALUATOR — Starting...")
    
    # Evaluate all test cases
    results = [evaluate_rag(tc) for tc in TEST_CASES]
    
    # Print report
    print_rag_report(results)
    
    # Save results
    output = []
    for r in results:
        output.append({
            "query": r.input.query,
            "response": r.input.generated_response,
            "contexts": r.input.retrieved_context,
            "scores": asdict(r.scores),
            "hallucinations": r.hallucinations,
            "details": r.details
        })
    
    with open("rag_results.json", "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\n💾 Results saved to: rag_results.json")
    
    # Exit with appropriate code
    passed = sum(1 for r in results if r.scores.passed)
    if passed == len(results):
        print("\n✅ All RAG evaluations passed!")
        exit(0)
    else:
        print(f"\n⚠️ {len(results) - passed} evaluations failed groundedness threshold")
        exit(1)
