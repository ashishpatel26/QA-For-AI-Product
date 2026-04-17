"""
services.py — Business logic with optional progress callbacks.

Each run_* fn accepts progress_cb(step, total, label) called before every LLM call.
The SSE layer in main.py uses this to stream live progress to the frontend.
"""

from dataclasses import asdict
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Callable

from backend.adapters import load

ProgressCb = Callable[[int, int, str], None] | None

FAST_MODE = os.getenv("FAST_MODE", "0").lower() in {"1", "true", "yes", "on"}
MAX_WORKERS = max(1, int(os.getenv("QA_MAX_WORKERS", "8")))
CACHE_ENABLED = os.getenv("QA_CACHE", "1").lower() not in {"0", "false", "no", "off"}

_CACHE_LOCK = threading.Lock()
_LLM_CACHE: dict[tuple[str, str], str] = {}


def _cached_llm_call(fn: Callable[[str], str], prompt: str, key_prefix: str) -> str:
    if not CACHE_ENABLED:
        return fn(prompt)
    key = (key_prefix, prompt)
    with _CACHE_LOCK:
        hit = _LLM_CACHE.get(key)
    if hit is not None:
        return hit
    out = fn(prompt)
    with _CACHE_LOCK:
        _LLM_CACHE[key] = out
    return out


# ---------- Eval ----------
def run_eval(payload: dict, progress_cb: ProgressCb = None) -> dict:
    mod = load("eval_runner")
    test_cases = payload.get("test_cases") or mod.TEST_CASES
    if FAST_MODE:
        test_cases = test_cases[: min(8, len(test_cases))]
    threshold = payload.get("pass_threshold", 0.5)
    total = len(test_cases)

    items = []
    tag_stats: dict[str, dict[str, int]] = {}

    def _eval_one(i: int, tc: dict):
        start = time.time()
        actual = _cached_llm_call(mod.ollama_llm, tc["input"], "eval")
        latency = (time.time() - start) * 1000
        score = mod.score_contains(actual, tc["expected"])
        passed = score >= threshold
        return i, {
            "input": tc["input"],
            "expected": tc["expected"],
            "actual": actual,
            "score": score,
            "latency_ms": round(latency, 2),
            "tags": tc.get("tags", []),
            "passed": passed,
        }

    workers = min(MAX_WORKERS, total) or 1
    completed = 0
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(_eval_one, i, tc) for i, tc in enumerate(test_cases)]
        ordered: dict[int, dict] = {}
        for fut in as_completed(futs):
            i, item = fut.result()
            completed += 1
            ordered[i] = item
            if progress_cb:
                progress_cb(completed, total, f'Evaluating: "{item["input"][:50]}"')

    items = [ordered[i] for i in sorted(ordered)]
    for item in items:
        for tag in item["tags"]:
            s = tag_stats.setdefault(tag, {"passed": 0, "total": 0})
            s["total"] += 1
            if item["passed"]:
                s["passed"] += 1

    passed_cnt = sum(1 for r in items if r["passed"])
    avg_latency = sum(r["latency_ms"] for r in items) / total if total else 0
    return {
        "results": items,
        "summary": {
            "total": total,
            "passed": passed_cnt,
            "failed": total - passed_cnt,
            "pass_rate": (passed_cnt / total * 100) if total else 0,
            "avg_latency_ms": round(avg_latency, 2),
            "tag_stats": tag_stats,
        },
    }


# ---------- Judge ----------
def run_judge(payload: dict, progress_cb: ProgressCb = None) -> dict:
    mod = load("llm_judge")
    cases = payload.get("test_cases") or mod.TEST_CASES
    if FAST_MODE:
        cases = cases[: min(6, len(cases))]
    total_steps = len(cases) * 2  # target call + judge call per case
    step = 0

    items = []
    totals = {"accuracy": 0, "relevance": 0, "completeness": 0, "clarity": 0, "safety": 0}
    passed = 0

    for i, tc in enumerate(cases):
        q = tc["input"] if isinstance(tc, dict) else tc.input
        ref = (tc["expected"] if isinstance(tc, dict) else tc.expected) or ""

        step += 1
        if progress_cb:
            progress_cb(step, total_steps, f'Target response [{i+1}/{len(cases)}]: "{q[:45]}"')
        response = _cached_llm_call(mod.target_llm, q, "judge_target")

        step += 1
        if progress_cb:
            progress_cb(step, total_steps, f'Judge scoring [{i+1}/{len(cases)}]: "{q[:45]}"')

        judge_prompt = mod.JUDGE_PROMPT.format(query=q, response=response, reference=ref)
        raw = _cached_llm_call(mod.judge_llm, judge_prompt, "judge_judge")
        scores = mod.parse_judge_response(raw)
        if scores is None:
            scores = mod.JudgeScore(accuracy=3, relevance=3, completeness=3,
                                    clarity=3, safety=3, total=15,
                                    reasoning="Could not parse judge response")

        for k in totals:
            totals[k] += getattr(scores, k)
        if scores.passed:
            passed += 1

        items.append({
            "query": q,
            "response": response,
            "reference": ref,
            "scores": {
                "accuracy": scores.accuracy,
                "relevance": scores.relevance,
                "completeness": scores.completeness,
                "clarity": scores.clarity,
                "safety": scores.safety,
                "total": scores.total,
                "average": scores.average,
                "reasoning": scores.reasoning,
                "passed": scores.passed,
            },
        })

    n = len(items) or 1
    avg_criteria = {k: round(v / n, 2) for k, v in totals.items()}
    return {
        "results": items,
        "summary": {
            "total": len(items),
            "passed": passed,
            "pass_rate": (passed / len(items) * 100) if items else 0,
            "avg_criteria": avg_criteria,
        },
    }


# ---------- Adversarial ----------
def run_adversarial(payload: dict, progress_cb: ProgressCb = None) -> dict:
    mod = load("adversarial")
    tests = payload.get("tests") or mod.ADVERSARIAL_TESTS
    if FAST_MODE:
        tests = tests[: min(8, len(tests))]
    total = len(tests)

    items = []
    by_type: dict[str, dict[str, int]] = {}

    def _adv_one(i: int, test: dict):
        t = dict(test)
        name = t.get("name", f"Test {i+1}")
        attack = t.get("attack_type", "")
        attack_label = attack.value if hasattr(attack, "value") else str(attack)
        output = _cached_llm_call(mod.ollama_llm, t["input"], "adversarial")
        passed, reason = mod.check_test_passed(
            output=output,
            should_contain=t.get("should_contain"),
            should_not_contain=t.get("should_not_contain"),
        )
        return i, attack_label, {
            "name": name,
            "attack_type": attack_label,
            "input": t["input"],
            "output": output,
            "passed": passed,
            "failure_reason": reason,
            "description": t.get("description", ""),
        }

    workers = min(MAX_WORKERS, total) or 1
    completed = 0
    ordered: dict[int, tuple[str, dict]] = {}
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(_adv_one, i, test) for i, test in enumerate(tests)]
        for fut in as_completed(futs):
            i, attack_label, row = fut.result()
            completed += 1
            ordered[i] = (attack_label, row)
            if progress_cb:
                progress_cb(completed, total, f"[{attack_label.replace('_',' ')}] {row['name']}")

    for i in sorted(ordered):
        attack_label, row = ordered[i]
        items.append(row)
        s = by_type.setdefault(attack_label, {"passed": 0, "total": 0})
        s["total"] += 1
        if row["passed"]:
            s["passed"] += 1

    passed_cnt = sum(1 for r in items if r["passed"])
    return {
        "results": items,
        "summary": {
            "total": total,
            "passed": passed_cnt,
            "failed": total - passed_cnt,
            "pass_rate": (passed_cnt / total * 100) if total else 0,
            "by_attack_type": by_type,
        },
    }


# ---------- RAG ----------
def run_rag(payload: dict, progress_cb: ProgressCb = None) -> dict:
    mod = load("rag_triad")
    steps = ["Scoring context relevance…", "Extracting & checking claims…", "Scoring answer relevance…"]
    if progress_cb:
        for i, label in enumerate(steps):
            progress_cb(i + 1, len(steps), label)

    inp = mod.RAGInput(
        query=payload["query"],
        retrieved_context=payload["contexts"],
        generated_response=payload["response"],
        ground_truth=payload.get("ground_truth"),
    )
    result = mod.evaluate_rag(inp)
    s = result.scores
    return {
        "query": result.input.query,
        "response": result.input.generated_response,
        "context_relevance": s.context_relevance,
        "groundedness": s.groundedness,
        "answer_relevance": s.answer_relevance,
        "overall": s.overall,
        "passed": s.passed,
        "details": {
            **result.details,
            "hallucinations": result.hallucinations,
            "contexts": result.input.retrieved_context,
        },
    }


# ---------- Bias ----------
def run_bias(payload: dict, progress_cb: ProgressCb = None) -> dict:
    mod = load("bias_audit")
    templates = payload.get("templates") or mod.BIAS_TEMPLATES
    if FAST_MODE:
        templates = templates[: min(3, len(templates))]
    names_cfg = mod.IDENTITY_SWAPS["names"]
    names_per_demo = getattr(mod, "NAMES_PER_DEMOGRAPHIC", 1)
    name_list = [n for names in names_cfg.values() for n in names[:names_per_demo]]
    total_calls = len(templates) * len(name_list)
    step = 0

    all_results: list = []
    all_analyses: list = []
    by_template: dict[str, list] = {}

    for tmpl in templates:
        t = dict(tmpl)
        tmpl_results = []
        tasks = []
        for demographic, demo_names in names_cfg.items():
            for name in demo_names[:names_per_demo]:
                tasks.append((demographic, name, t["template"].format(name=name)))

        def _bias_one(demographic: str, name: str, prompt: str):
            response = _cached_llm_call(mod.ollama_llm, prompt, "bias")
            sentiment, pos, neg = mod.analyze_sentiment(response)
            return mod.BiasTestResult(
                template_name=t["name"],
                category=t.get("category", ""),
                name=name,
                demographic=demographic,
                prompt=prompt,
                response=response,
                sentiment_score=sentiment,
                positive_words=pos,
                negative_words=neg,
            )

        workers = min(MAX_WORKERS, len(tasks)) or 1
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futs = [ex.submit(_bias_one, d, n, p) for d, n, p in tasks]
            for fut in as_completed(futs):
                r = fut.result()
                step += 1
                if progress_cb:
                    progress_cb(step, total_calls, f'[{t["name"]}] {r.demographic}: {r.name}')
                tmpl_results.append(r)
                all_results.append(r)

        analysis = mod.analyze_bias(tmpl_results)
        all_analyses.append(analysis)
        by_template.setdefault(t["name"], []).extend(tmpl_results)

    items = []
    for a in all_analyses:
        rows = by_template.get(a.template_name, [])
        resp_by_id: dict[str, str] = {}
        sent_by_id: dict[str, float] = {}
        for r in rows:
            key = f"{r.demographic}:{r.name}"
            resp_by_id[key] = r.response
            sent_by_id[key] = r.sentiment_score
        items.append({
            "template_name": a.template_name,
            "category": a.category,
            "responses_by_identity": resp_by_id,
            "sentiment_by_identity": sent_by_id,
            "demographic_scores": a.demographic_scores,
            "bias_score": a.variance,
            "bias_detected": a.bias_detected,
            "bias_direction": a.bias_direction,
            "details": a.details,
        })

    biased = sum(1 for a in all_analyses if a.bias_detected)
    return {
        "analyses": items,
        "summary": {
            "total_templates": len(all_analyses),
            "biased": biased,
            "clean": len(all_analyses) - biased,
            "bias_rate": (biased / len(all_analyses) * 100) if all_analyses else 0,
        },
    }


# ---------- Consistency ----------
def run_consistency(payload: dict, progress_cb: ProgressCb = None) -> dict:
    mod = load("consistency")
    sets_raw = payload.get("paraphrase_sets") or mod.PARAPHRASE_SETS
    runs = payload.get("runs_per_variation", 1)
    if FAST_MODE:
        sets_raw = sets_raw[: min(4, len(sets_raw))]
        runs = 1

    sets = []
    for s in sets_raw:
        sets.append({
            "name": s.get("name") or s.get("id", ""),
            "category": s.get("category", ""),
            "variations": s["variations"],
            "expected_answer": s.get("expected_answer") or s.get("expected", ""),
        })

    total_calls = sum(len(s["variations"]) * runs for s in sets)
    step = 0
    items = []
    passed_cnt = 0

    for s in sets:
        results = []
        all_answers = []
        tasks = []
        for variation in s["variations"]:
            for _ in range(runs):
                tasks.append(variation)

        def _cons_one(variation: str):
            response = _cached_llm_call(mod.ollama_llm, variation, "consistency")
            extracted = mod.extract_core_answer(response)
            matches = mod.check_answer_match(response, s["expected_answer"])
            return mod.ConsistencyResult(
                set_name=s["name"],
                category=s["category"],
                prompt=variation,
                response=response,
                extracted_answer=extracted,
                matches_expected=matches,
            )

        workers = min(MAX_WORKERS, len(tasks)) or 1
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futs = [ex.submit(_cons_one, v) for v in tasks]
            for fut in as_completed(futs):
                r = fut.result()
                step += 1
                if progress_cb:
                    progress_cb(step, total_calls, f'[{s["name"]}] "{r.prompt[:55]}"')
                results.append(r)
                all_answers.append(r.extracted_answer.lower())

        unique_answers = list(set(all_answers))
        score = 1.0 / len(unique_answers) if unique_answers else 0
        matches_exp = sum(1 for r in results if r.matches_expected)
        passed = score >= 0.5 and (matches_exp / len(results) >= 0.8) if results else False
        if passed:
            passed_cnt += 1

        items.append({
            "question_id": s["name"],
            "consistency_score": round(score, 3),
            "is_consistent": passed,
            "variations": [r.prompt for r in results],
            "responses": [r.response for r in results],
            "core_answers": [r.extracted_answer for r in results],
        })

    return {
        "analyses": items,
        "summary": {
            "total": len(items),
            "consistent": passed_cnt,
            "inconsistent": len(items) - passed_cnt,
            "avg_score": round(sum(i["consistency_score"] for i in items) / len(items), 3) if items else 0,
        },
    }


# ---------- Health ----------
def check_health() -> dict:
    import json
    import urllib.request
    import urllib.error
    from ollama_client import OLLAMA_HOST, OLLAMA_MODEL

    reachable = False
    models: list[str] = []
    try:
        with urllib.request.urlopen(f"{OLLAMA_HOST}/api/tags", timeout=3) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            models = [m["name"] for m in body.get("models", [])]
            reachable = True
    except (urllib.error.URLError, TimeoutError, Exception):
        pass

    return {
        "status": "ok" if reachable else "ollama_unreachable",
        "ollama_reachable": reachable,
        "ollama_host": OLLAMA_HOST,
        "ollama_model": OLLAMA_MODEL,
        "models_available": models,
    }
