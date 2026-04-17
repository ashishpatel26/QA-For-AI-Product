"""
adapters.py — Import digit-prefixed script modules via importlib.
Wraps each script's public functions so FastAPI can call them cleanly.
"""

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

ROOT = Path(__file__).resolve().parent.parent

_SCRIPTS = {
    "eval_runner":      "01_eval_runner.py",
    "llm_judge":        "02_llm_judge.py",
    "adversarial":      "03_adversarial_tests.py",
    "rag_triad":        "04_rag_triad.py",
    "bias_audit":       "05_bias_audit.py",
    "consistency":      "06_consistency_check.py",
}

_cache: dict[str, ModuleType] = {}


def load(name: str) -> ModuleType:
    if name in _cache:
        return _cache[name]
    path = ROOT / _SCRIPTS[name]
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    _cache[name] = mod
    return mod


# Ensure project root on sys.path so modules can import `ollama_client`
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
