#!/usr/bin/env python3
"""
run_all_tests.py — AI QA Complete Test Suite Runner
====================================================
Run all AI QA tests in sequence and generate combined report.

Usage:
    python run_all_tests.py

Demo for: The complete Production AI Quality Stack
"""

import subprocess
import sys
import json
import os
from datetime import datetime
from typing import Dict, List, Any

# ============================================================================
# CONFIGURATION
# ============================================================================

TEST_SCRIPTS = [
    {
        "name": "Basic Eval Runner",
        "script": "01_eval_runner.py",
        "category": "Accuracy & Quality",
        "part": "Part 2.2"
    },
    {
        "name": "LLM-as-Judge",
        "script": "02_llm_judge.py",
        "category": "Scoring Mechanics",
        "part": "Part 5.3"
    },
    {
        "name": "Adversarial Tests",
        "script": "03_adversarial_tests.py",
        "category": "Robustness & Security",
        "part": "Part 2.3 & Part 4"
    },
    {
        "name": "RAG Triad Evaluation",
        "script": "04_rag_triad.py",
        "category": "RAG Quality",
        "part": "Part 5.1"
    },
    {
        "name": "Bias Audit",
        "script": "05_bias_audit.py",
        "category": "Safety & Compliance",
        "part": "Part 2.5"
    },
    {
        "name": "Consistency Check",
        "script": "06_consistency_check.py",
        "category": "Robustness",
        "part": "Part 2.3"
    },
]


# ============================================================================
# TEST RUNNER
# ============================================================================

def run_test(script_info: Dict) -> Dict[str, Any]:
    """Run a single test script and capture results."""
    
    script_path = script_info["script"]
    
    print(f"\n{'─' * 60}")
    print(f"🔄 Running: {script_info['name']}")
    print(f"   Script:  {script_path}")
    print(f"   Category: {script_info['category']}")
    print(f"{'─' * 60}")
    
    start_time = datetime.now()
    
    try:
        # Run the script
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        passed = result.returncode == 0
        
        return {
            "name": script_info["name"],
            "script": script_path,
            "category": script_info["category"],
            "part": script_info["part"],
            "passed": passed,
            "return_code": result.returncode,
            "duration_seconds": round(duration, 2),
            "stdout": result.stdout[-2000:] if result.stdout else "",  # Last 2000 chars
            "stderr": result.stderr[-500:] if result.stderr else "",
            "error": None
        }
        
    except subprocess.TimeoutExpired:
        return {
            "name": script_info["name"],
            "script": script_path,
            "category": script_info["category"],
            "part": script_info["part"],
            "passed": False,
            "return_code": -1,
            "duration_seconds": 120,
            "stdout": "",
            "stderr": "",
            "error": "Test timed out after 120 seconds"
        }
        
    except Exception as e:
        return {
            "name": script_info["name"],
            "script": script_path,
            "category": script_info["category"],
            "part": script_info["part"],
            "passed": False,
            "return_code": -1,
            "duration_seconds": 0,
            "stdout": "",
            "stderr": "",
            "error": str(e)
        }


def run_all_tests() -> List[Dict[str, Any]]:
    """Run all test scripts."""
    results = []
    
    for script_info in TEST_SCRIPTS:
        result = run_test(script_info)
        results.append(result)
        
        # Print quick status
        if result["passed"]:
            print(f"   ✓ PASSED ({result['duration_seconds']}s)")
        else:
            print(f"   ✗ FAILED ({result.get('error', 'See output')})")
    
    return results


# ============================================================================
# REPORTING
# ============================================================================

def print_final_report(results: List[Dict[str, Any]]):
    """Print combined final report."""
    
    print("\n")
    print("╔" + "═" * 68 + "╗")
    print("║" + " " * 20 + "🦴 AI QA COMPLETE REPORT 🦴" + " " * 21 + "║")
    print("║" + " " * 15 + "Production AI Quality Stack Testing" + " " * 16 + "║")
    print("╚" + "═" * 68 + "╝")
    
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    total_time = sum(r["duration_seconds"] for r in results)
    
    print(f"\n📊 EXECUTIVE SUMMARY")
    print("─" * 70)
    print(f"   Test Suites Run:    {total}")
    print(f"   Passed:             {passed} ✓")
    print(f"   Failed:             {failed} ✗")
    print(f"   Pass Rate:          {(passed/total)*100:.1f}%")
    print(f"   Total Duration:     {total_time:.1f}s")
    print(f"   Timestamp:          {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print(f"\n📋 TEST RESULTS BY CATEGORY")
    print("─" * 70)
    
    # Group by category
    by_category = {}
    for r in results:
        cat = r["category"]
        if cat not in by_category:
            by_category[cat] = {"passed": 0, "failed": 0, "tests": []}
        by_category[cat]["tests"].append(r)
        if r["passed"]:
            by_category[cat]["passed"] += 1
        else:
            by_category[cat]["failed"] += 1
    
    for cat, data in by_category.items():
        cat_total = data["passed"] + data["failed"]
        cat_rate = (data["passed"] / cat_total) * 100
        bar = "█" * int(cat_rate / 10) + "░" * (10 - int(cat_rate / 10))
        status = "✓" if cat_rate == 100 else "⚠️" if cat_rate >= 50 else "✗"
        print(f"   {status} {cat:25} {bar} {cat_rate:.0f}%")
    
    print(f"\n📝 INDIVIDUAL TEST RESULTS")
    print("─" * 70)
    
    for r in results:
        status = "✓ PASS" if r["passed"] else "✗ FAIL"
        print(f"\n   [{r['part']}] {r['name']}")
        print(f"   Status:   {status}")
        print(f"   Duration: {r['duration_seconds']}s")
        print(f"   Script:   {r['script']}")
        
        if r.get("error"):
            print(f"   Error:    {r['error']}")
    
    # Failed tests detail
    failed_tests = [r for r in results if not r["passed"]]
    if failed_tests:
        print(f"\n🚨 FAILED TESTS - DETAILS")
        print("─" * 70)
        
        for r in failed_tests:
            print(f"\n   ❌ {r['name']}")
            if r.get("error"):
                print(f"      Error: {r['error']}")
            if r.get("stderr"):
                print(f"      Stderr: {r['stderr'][:200]}...")
    
    print("\n" + "─" * 70)
    
    # Overall assessment
    if passed == total:
        print("""
   ╔═══════════════════════════════════════════════════════════════════╗
   ║                                                                   ║
   ║   ✅ ALL TESTS PASSED — READY FOR DEPLOYMENT! 🚀                  ║
   ║                                                                   ║
   ╚═══════════════════════════════════════════════════════════════════╝
        """)
    elif passed / total >= 0.8:
        print("""
   ╔═══════════════════════════════════════════════════════════════════╗
   ║                                                                   ║
   ║   ⚠️  MOSTLY PASSED — Review failures before deployment          ║
   ║                                                                   ║
   ╚═══════════════════════════════════════════════════════════════════╝
        """)
    else:
        print("""
   ╔═══════════════════════════════════════════════════════════════════╗
   ║                                                                   ║
   ║   🚨 MULTIPLE FAILURES — DO NOT DEPLOY! Fix issues first.        ║
   ║                                                                   ║
   ╚═══════════════════════════════════════════════════════════════════╝
        """)
    
    print("─" * 70)
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS:")
    
    recommendations = []
    
    for r in results:
        if not r["passed"]:
            if "adversarial" in r["name"].lower():
                recommendations.append("• Strengthen prompt injection defenses")
            elif "bias" in r["name"].lower():
                recommendations.append("• Review training data for demographic balance")
            elif "rag" in r["name"].lower():
                recommendations.append("• Improve retrieval quality and groundedness checks")
            elif "consistency" in r["name"].lower():
                recommendations.append("• Lower temperature or add constraints for consistency")
    
    if not recommendations:
        recommendations = ["• Continue monitoring in production", 
                         "• Schedule regular re-evaluation"]
    
    for rec in set(recommendations):
        print(f"   {rec}")
    
    print("\n" + "═" * 70)


def save_report(results: List[Dict[str, Any]]):
    """Save combined report to JSON."""
    
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_tests": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": round((passed / total) * 100, 1),
            "total_duration_seconds": sum(r["duration_seconds"] for r in results)
        },
        "tests": results
    }
    
    with open("qa_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n💾 Full report saved to: qa_report.json")


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("""
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║   🦴 THE PRODUCTION AI QUALITY STACK 🦴                           ║
    ║   ─────────────────────────────────────                           ║
    ║   From Risk Frameworks to Live Observability                      ║
    ║                                                                   ║
    ║   Running Complete Test Suite...                                  ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
    """)
    
    # Check all scripts exist
    missing = []
    for script_info in TEST_SCRIPTS:
        if not os.path.exists(script_info["script"]):
            missing.append(script_info["script"])
    
    if missing:
        print(f"❌ Missing test scripts: {missing}")
        print("   Make sure all scripts are in the same directory.")
        sys.exit(1)
    
    # Run all tests
    results = run_all_tests()
    
    # Print final report
    print_final_report(results)
    
    # Save report
    save_report(results)
    
    # Exit with appropriate code
    passed = sum(1 for r in results if r["passed"])
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
