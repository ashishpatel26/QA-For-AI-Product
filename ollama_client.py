"""
ollama_client.py — Shared Ollama helper (stdlib only)
=====================================================
One function, imported by every demo script.

Env overrides:
    OLLAMA_HOST  (default: http://localhost:11434)
    OLLAMA_MODEL (default: gemma3:4b)
"""

import json
import os
import urllib.request
import urllib.error

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma3:4b")


def ollama_llm(prompt: str, model: str = OLLAMA_MODEL, host: str = OLLAMA_HOST,
               temperature: float = 0.2, timeout: int = 120) -> str:
    """Call local Ollama /api/generate. Returns plain text response."""
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
