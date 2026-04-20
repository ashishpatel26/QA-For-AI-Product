"""
ollama_client.py — Shared LLM helper (stdlib only)
===================================================
Tries OpenRouter first; falls back to local Ollama transparently.

Env vars:
    OLLAMA_HOST          (default: http://localhost:11434)
    OLLAMA_MODEL         (default: gemma3:4b)
    OPENROUTER_API_KEY   (default: "" — if empty, OpenRouter is skipped)
    OPENROUTER_MODEL     (default: openai/gpt-4o-mini)
"""

import json
import os
import urllib.request
import urllib.error

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma3:4b")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")

_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
_active_provider: str = "unknown"  # "openrouter" | "ollama" | "unknown"
_current_openrouter_model: str = OPENROUTER_MODEL  # mutable at runtime


def get_active_provider() -> str:
    return _active_provider


def get_current_openrouter_model() -> str:
    return _current_openrouter_model


def set_openrouter_model(model_id: str) -> None:
    global _current_openrouter_model, _active_provider
    _current_openrouter_model = model_id
    _active_provider = "openrouter"  # mark active immediately after verified selection


def _openrouter_llm(prompt: str, temperature: float, timeout: int) -> str:
    """Call OpenRouter chat completions API. Raises on any failure."""
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not set")
    body = json.dumps({
        "model": _current_openrouter_model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }).encode("utf-8")
    req = urllib.request.Request(
        _OPENROUTER_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=min(timeout, 30)) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"].strip()


def _ollama_llm(prompt: str, model: str, host: str, temperature: float, timeout: int) -> str:
    """Call local Ollama /api/generate. Returns plain text or [OLLAMA ERROR: ...]."""
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": temperature},
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{host}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return (body.get("response") or "").strip()
    except urllib.error.URLError as e:
        return f"[OLLAMA ERROR: {e}]"
    except Exception as e:
        return f"[OLLAMA ERROR: {e}]"


def ollama_llm(prompt: str, model: str = OLLAMA_MODEL, host: str = OLLAMA_HOST,
               temperature: float = 0.2, timeout: int = 120) -> str:
    """
    Primary LLM entry point used by all QA scripts.
    Tries OpenRouter first; falls back to local Ollama on any failure.
    """
    global _active_provider

    if OPENROUTER_API_KEY:
        try:
            result = _openrouter_llm(prompt, temperature, timeout)
            _active_provider = "openrouter"
            return result
        except Exception:
            pass  # silent fallback to Ollama

    result = _ollama_llm(prompt, model, host, temperature, timeout)
    if not result.startswith("[OLLAMA ERROR"):
        _active_provider = "ollama"
    return result
